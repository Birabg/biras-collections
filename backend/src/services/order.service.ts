import { Prisma, type PaymentProvider } from '@prisma/client';
import { prisma } from '../config/prisma';
import { config } from '../config/env';
import { NotFoundError, ValidationError, PaymentError } from '../utils/errors';
import { mapOrder } from '../utils/mappers';
import { round2, toNumber } from '../utils/http';
import { generateOrderNumber } from '../utils/tokens';
import {
  CURRENCY,
  STOCK_RELEASING_STATUSES,
  CUSTOMER_CANCELLABLE_STATUSES,
  canTransition,
} from '../constants';
import { applyStockChange, checkAvailabilityInTransaction, assertAllAvailable } from './inventory.service';
import { shippingFor } from './cart.service';
import { paymentService } from './payment.service';
import { emailService } from './email.service';
import type { CreateOrderInput } from '../validators/commerce.schema';

/*
 * Order service.
 *
 * `createOrder` is the most security-sensitive function in the codebase, so it is
 * worth being explicit about what it does NOT accept from the caller: no price, no
 * subtotal, no total, no discount, no stock level, no order owner. All of those
 * are read from the database.
 *
 * Shape of the operation, and why:
 *
 *   1. One transaction validates the cart, recomputes every price, writes the
 *      order and its items, decrements stock with guarded updates, and empties
 *      the cart. Either all of that commits or none of it does — there is never a
 *      state where stock is reduced but no order exists.
 *
 *   2. Payment is attempted *after* that commit, because it is the only step that
 *      talks to an external service and holding a transaction open across a
 *      network call is how connection pools get exhausted.
 *
 *   3. If payment fails, the order is compensated: cancelled and its stock
 *      returned, in one transaction. The customer is told the payment failed
 *      rather than being left with a silently unpaid order.
 */

type Tx = Prisma.TransactionClient;

const ORDER_INCLUDE = {
  items: true,
  payment: true,
  user: { select: { id: true, firstName: true, lastName: true, email: true } },
} satisfies Prisma.OrderInclude;

type OrderWithRelations = Prisma.OrderGetPayload<{ include: typeof ORDER_INCLUDE }>;

async function nextOrderNumber(tx: Tx): Promise<string> {
  /*
   * A per-year counter derived from the highest existing number. The unique
   * constraint on orderNumber is the real guarantee; if two transactions ever
   * raced, one would fail on insert rather than create a duplicate.
   */
  const year = new Date().getFullYear();
  const prefix = `BC-${year}-`;

  const latest = await tx.order.findFirst({
    where: { orderNumber: { startsWith: prefix } },
    orderBy: { orderNumber: 'desc' },
    select: { orderNumber: true },
  });

  const lastSequence = latest ? Number(latest.orderNumber.slice(prefix.length)) : 0;

  return generateOrderNumber(lastSequence + 1, year);
}

/* ------------------------------------------------------------- checkout --*/

export interface CheckoutLine {
  itemId: string;
  productId: string;
  variantId: string | null;
  quantity: number;
  name: string;
  slug: string;
  sku: string;
  image: string | null;
  price: number;
  size: string | null;
  color: string | null;
  availableStock: number;
}

/**
 * Price and availability preview. Returns everything the checkout page needs to
 * render a trustworthy summary, including any blocking problems.
 */
export async function getCheckoutSummary(userId: string) {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          product: {
            include: {
              category: true,
              images: { orderBy: { sortOrder: 'asc' } },
              variants: { where: { isActive: true } },
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!cart || cart.items.length === 0) {
    return {
      items: [],
      itemCount: 0,
      subtotal: 0,
      discount: 0,
      availableStock: true,
      validationErrors: [{ field: 'cart', message: 'Your bag is empty.' }],
      // shippingFor() owns shippingFee/total/freeShippingThreshold, so they are
      // not repeated here.
      ...shippingFor(0),
    };
  }

  const lines: CheckoutLine[] = cart.items.map((item) => {
    const variant = item.product.variants.find((v) => v.id === item.variantId) ?? null;
    const image = item.product.images[0]?.url ?? null;

    return {
      itemId: item.id,
      productId: item.productId,
      variantId: variant?.id ?? null,
      quantity: item.quantity,
      name: item.product.name,
      slug: item.product.slug,
      sku: variant?.sku ?? item.product.sku,
      image,
      // Authoritative price: variant override, else product price.
      price: toNumber(variant?.price ?? item.product.price),
      size: variant?.size ?? null,
      color: variant?.color ?? null,
      availableStock: variant?.stockQuantity ?? 0,
    };
  });

  // Flag anything that has since been deactivated or deleted.
  const validationErrors: Array<{ field: string; message: string; productId?: string }> = [];

  for (const item of cart.items) {
    if (!item.product.isActive || item.product.deletedAt) {
      validationErrors.push({
        field: 'product',
        productId: item.productId,
        message: `${item.product.name} is no longer available and has been removed from your bag.`,
      });
    }
  }

  const { issues } = await checkAvailabilityInTransaction(
    prisma,
    lines.map((line) => ({ variantId: line.variantId, productId: line.productId, quantity: line.quantity })),
  );

  for (const issue of issues) {
    const line = lines.find((l) => l.variantId === issue.variantId);

    validationErrors.push({
      field: 'stock',
      productId: issue.productId,
      message: line
        ? `Only ${issue.available} of ${line.name} left — you asked for ${issue.requested}.`
        : 'One piece in your bag is no longer available in that quantity.',
    });
  }

  const activeLines = lines.filter(
    (line) => !validationErrors.some((error) => error.productId === line.productId),
  );

  const subtotal = round2(activeLines.reduce((sum, line) => sum + line.price * line.quantity, 0));

  return {
    items: lines.map((line) => ({
      ...line,
      lineTotal: round2(line.price * line.quantity),
      inStock: line.availableStock >= line.quantity,
    })),
    itemCount: activeLines.reduce((sum, line) => sum + line.quantity, 0),
    subtotal,
    discount: 0,
    availableStock: validationErrors.length === 0,
    validationErrors,
    ...shippingFor(subtotal),
  };
}

/* -------------------------------------------------------- order creation --*/

export async function createOrder(userId: string, input: CreateOrderInput) {
  /*
   * If the client referenced a saved address, it is copied — but only after
   * ownership is verified, so a customer cannot ship to someone else's saved
   * address by id.
   */
  let shippingAddress = input.shippingAddress;

  if (input.addressId) {
    const saved = await prisma.address.findFirst({
      where: { id: input.addressId, userId },
    });

    if (!saved) {
      throw new ValidationError('That address could not be found.', [
        { field: 'addressId', message: 'Address not available' },
      ]);
    }

    shippingAddress = {
      fullName: saved.fullName,
      phone: saved.phone,
      region: saved.region,
      city: saved.city,
      subCity: saved.subCity,
      kebele: saved.kebele,
      streetAddress: saved.streetAddress,
      additionalInfo: saved.additionalInfo,
    };
  }

  const isCashOnDelivery = input.paymentMethod === 'CASH_ON_DELIVERY';

  /*
   * Phase 1 — the database transaction. Everything that must be all-or-nothing
   * happens here, with no network calls inside it.
   */
  const transactionResult = await prisma.$transaction(
    async (tx) => {
      const freshCart = await tx.cart.findUnique({
        where: { userId },
        include: {
          items: {
            include: {
              product: {
                include: {
                  category: true,
                  images: { orderBy: { sortOrder: 'asc' } },
                  variants: { where: { isActive: true } },
                },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      if (!freshCart || freshCart.items.length === 0) {
        throw new ValidationError('Your bag is empty.', [
          { field: 'cart', message: 'Add a piece first.' },
        ]);
      }

      // 1. Every product must still be sellable.
      for (const item of freshCart.items) {
        if (!item.product.isActive || item.product.deletedAt) {
          throw new ValidationError(`${item.product.name} is no longer available.`, [
            { field: 'cart', message: `${item.product.name} is no longer available.` },
          ]);
        }
      }

      // 2. Stock, read through the transaction so the check sees the same
      //    snapshot the guarded updates below will act on.
      const { issues } = await checkAvailabilityInTransaction(
        tx,
        freshCart.items.map((item) => ({
          variantId: item.variantId,
          productId: item.productId,
          quantity: item.quantity,
        })),
      );

      assertAllAvailable(issues);

      // 3. Recompute every price from the catalogue. No client value is used.
      const lines = freshCart.items.map((item) => {
        const variant = item.product.variants.find((v) => v.id === item.variantId) ?? null;
        const image = item.product.images[0]?.url ?? null;
        const price = toNumber(variant?.price ?? item.product.price);

        return {
          item,
          variant,
          price,
          sku: variant?.sku ?? item.product.sku,
          image,
          size: variant?.size ?? null,
          color: variant?.color ?? null,
          lineTotal: round2(price * item.quantity),
        };
      });

      // 4. Totals, computed server-side.
      const subtotal = round2(lines.reduce((sum, line) => sum + line.lineTotal, 0));
      const discount = 0;
      const { shippingFee, total } = shippingFor(subtotal);
      const orderNumber = await nextOrderNumber(tx);

      // Cash on delivery is confirmed immediately; a card/bank order stays
      // PENDING until the provider actually authorises it in phase 2.
      const initialStatus = isCashOnDelivery ? 'CONFIRMED' : 'PENDING';

      const created = await tx.order.create({
        data: {
          orderNumber,
          userId,
          status: initialStatus,
          paymentStatus: 'PENDING',
          subtotal,
          shippingFee,
          discount,
          total,
          shippingAddressSnapshot: shippingAddress as unknown as Prisma.InputJsonValue,
          customerNote: input.customerNote ?? null,
          items: {
            create: lines.map((line) => ({
              productId: line.item.productId,
              variantId: line.variant?.id ?? null,
              productNameSnapshot: line.item.product.name,
              skuSnapshot: line.sku,
              slugSnapshot: line.item.product.slug,
              imageSnapshot: line.image,
              variantSnapshot: { size: line.size, color: line.color } as Prisma.InputJsonValue,
              price: line.price,
              quantity: line.item.quantity,
              subtotal: line.lineTotal,
            })),
          },
          statusEvents: {
            create: {
              to: initialStatus,
              note: isCashOnDelivery
                ? 'Order placed by the customer (cash on delivery)'
                : 'Order placed by the customer, awaiting payment',
            },
          },
        },
        include: ORDER_INCLUDE,
      });

      // 5. Decrement stock: one guarded update per variant.
      for (const line of lines) {
        if (!line.variant) continue;

        await applyStockChange(tx, line.variant.id, -line.item.quantity, 'PURCHASE', {
          reference: created.orderNumber,
          note: `Order ${created.orderNumber}`,
        });
      }

      /*
       * 6. Empty the cart in the same transaction, but remember the lines first:
       *    phase 2 may fail the payment, and the compensation step needs them to
       *    put the customer's bag back.
       */
      const cartId = freshCart.id;
      const restorePoints = lines.map((line) => ({
        productId: line.item.productId,
        variantId: line.item.variantId,
        quantity: line.item.quantity,
        price: line.price,
      }));

      await tx.cartItem.deleteMany({ where: { cartId } });

      return { order: created, restorePoints };
    },
    // One round trip per cart line, so a large basket needs headroom.
    { timeout: 15_000, maxWait: 10_000 },
  );

  const { order, restorePoints } = transactionResult;

  /*
   * Phase 2 — payment, after the commit. Using the real order number and total
   * means the amount the provider is asked for is the amount we computed and
   * stored, and any provider reference can be traced back to an order.
   */
  const settled = await settlePayment(order, input.paymentMethod);

  if (!settled.ok) {
    await compensateFailedPayment(order.id, order.orderNumber, restorePoints);

    throw new PaymentError(
      settled.reason ?? 'The payment could not be completed. Your bag has been restored.',
    );
  }

  // 7. Notifications after commit, so a mail failure cannot roll back an order.
  void emailService.sendOrderConfirmation({
    to: order.user.email,
    firstName: order.user.firstName,
    orderNumber: order.orderNumber,
    total: toNumber(order.total),
    itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
  });

  return mapOrder(settled.order);
}

/**
 * Phase 2. Records the payment row and, for a successful authorisation, moves
 * the order out of PENDING.
 */
async function settlePayment(
  order: OrderWithRelations,
  method: PaymentProvider,
): Promise<{ ok: true; order: OrderWithRelations } | { ok: false; reason: string }> {
  const total = toNumber(order.total);

  // Cash on delivery is not authorised now. The row is written as PROCESSING so
  // the order shows a payment attempt, and it settles when it is delivered.
  if (method === 'CASH_ON_DELIVERY') {
    const updated = await prisma.$transaction(async (tx) => {
      await tx.payment.create({
        data: {
          orderId: order.id,
          provider: method,
          method,
          status: 'PROCESSING',
          amount: total,
          reference: `COD-${order.orderNumber}`,
        },
      });

      return tx.order.update({
        where: { id: order.id },
        data: { paymentStatus: 'PENDING' },
        include: ORDER_INCLUDE,
      });
    });

    return { ok: true, order: updated };
  }

  try {
    const intent = await paymentService.createIntent({
      orderId: order.id,
      orderNumber: order.orderNumber,
      amount: total,
      currency: CURRENCY,
      customerEmail: order.user.email,
      provider: method,
      returnUrl: `${config.frontendUrl}/checkout/success?order=${order.orderNumber}`,
    });

    const paid = intent.status === 'SUCCEEDED';

    const updated = await prisma.$transaction(async (tx) => {
      await tx.payment.create({
        data: {
          orderId: order.id,
          provider: method,
          method,
          status: intent.status,
          amount: total,
          reference: intent.reference,
        },
      });

      return tx.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: paid ? 'PAID' : 'PENDING',
          // A successful authorisation confirms the order; anything else leaves
          // it in PENDING for a webhook or an admin to settle.
          ...(paid && order.status === 'PENDING'
            ? {
                status: 'CONFIRMED' as const,
                statusEvents: {
                  create: { from: 'PENDING' as const, to: 'CONFIRMED' as const, note: intent.message },
                },
              }
            : {}),
        },
        include: ORDER_INCLUDE,
      });
    });

    if (!paid && intent.status === 'FAILED') {
      return { ok: false, reason: intent.message };
    }

    return { ok: true, order: updated };
  } catch (error) {
    // Record the failure before compensating, so the attempt is not lost.
    await prisma.payment
      .create({
        data: {
          orderId: order.id,
          provider: method,
          method,
          status: 'FAILED',
          amount: total,
          failureReason: error instanceof Error ? error.message.slice(0, 300) : 'Unknown payment error',
        },
      })
      .catch(() => undefined);

    return { ok: false, reason: 'The payment provider could not be reached. Your bag has been restored.' };
  }
}

/**
 * Compensation for a failed authorisation: cancel the order, return its stock and
 * rebuild the customer's cart, atomically. Without this, a declined payment would
 * leave the units reserved forever and the shopper with an empty bag and no
 * explanation.
 */
async function compensateFailedPayment(
  orderId: string,
  orderNumber: string,
  restorePoints: { productId: string; variantId: string | null; quantity: number; price: number }[],
) {
  await prisma.$transaction(
    async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: { include: { variant: true } } },
      });

      if (!order || order.status === 'CANCELLED') return;

      for (const item of order.items) {
        if (!item.variant) continue;

        await applyStockChange(tx, item.variant.id, item.quantity, 'CANCELLATION', {
          reference: orderNumber,
          note: `Order ${orderNumber} cancelled after a failed payment`,
        });
      }

      await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          statusEvents: {
            create: { from: order.status, to: 'CANCELLED', note: 'Payment failed; stock returned' },
          },
        },
      });

      // Put the bag back, merging into any line the shopper added while the
      // payment was in flight rather than duplicating it.
      const cart = await tx.cart.findUnique({ where: { userId: order.userId } });

      if (cart) {
        for (const point of restorePoints) {
          const existing = await tx.cartItem.findFirst({
            where: { cartId: cart.id, productId: point.productId, variantId: point.variantId },
          });

          if (existing) {
            await tx.cartItem.update({
              where: { id: existing.id },
              data: { quantity: { increment: point.quantity } },
            });
          } else {
            await tx.cartItem.create({
              data: {
                cartId: cart.id,
                productId: point.productId,
                variantId: point.variantId,
                quantity: point.quantity,
                priceSnapshot: point.price,
              },
            });
          }
        }
      }
    },
    { timeout: 15_000 },
  );
}

/* -------------------------------------------------------------- reading --*/

export async function listOwnOrders(
  userId: string,
  query: { page: number; limit: number; skip: number; status?: string },
) {
  const where = { userId, ...(query.status ? { status: query.status as never } : {}) };

  const [total, orders] = await prisma.$transaction([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      include: ORDER_INCLUDE,
      orderBy: { createdAt: 'desc' },
      skip: query.skip,
      take: query.limit,
    }),
  ]);

  return {
    data: orders.map((order) => mapOrder(order)),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / query.limit),
    },
  };
}

/**
 * Order detail for a customer.
 *
 * Scoped by `userId`, so requesting another customer's order id returns 404. This
 * is the IDOR guard for the whole orders surface.
 */
export async function getOwnOrder(userId: string, id: string) {
  const order = await prisma.order.findFirst({
    where: { OR: [{ id }, { orderNumber: id }], userId },
    include: ORDER_INCLUDE,
  });

  if (!order) throw new NotFoundError('That order could not be found.');

  return mapOrder(order);
}

/**
 * Customer-initiated cancellation.
 *
 * Ownership is enforced by the `userId` filter, and the allowed starting states
 * are narrower than an admin's: once an order is SHIPPED the units are with the
 * courier, so cancelling it is a return, not a cancellation, and has to go
 * through staff. A paid order is marked for refund rather than silently dropped.
 */
export async function cancelOwnOrder(userId: string, id: string) {
  const existing = await prisma.order.findFirst({
    where: { OR: [{ id }, { orderNumber: id }], userId },
    include: { items: { include: { variant: true } }, payment: true },
  });

  if (!existing) throw new NotFoundError('That order could not be found.');

  if (existing.status === 'CANCELLED') {
    throw new ValidationError('This order is already cancelled.');
  }

  if (!CUSTOMER_CANCELLABLE_STATUSES.includes(existing.status as never)) {
    throw new ValidationError(
      'This order can no longer be cancelled online. Please contact us for help.',
    );
  }

  const updated = await prisma.$transaction(
    async (tx) => {
      // Everything is still in stock's hands at these states, so it goes back.
      for (const item of existing.items) {
        if (!item.variant) continue;

        await applyStockChange(tx, item.variant.id, item.quantity, 'CANCELLATION', {
          reference: existing.orderNumber,
          note: `Order ${existing.orderNumber} cancelled by the customer`,
          actorId: userId,
        });
      }

      /*
       * A captured payment cannot be undone here. It is flagged REFUNDED so the
       * admin queue picks it up, rather than being marked FAILED and losing the
       * record that money actually moved.
       */
      await tx.payment.updateMany({
        where: { orderId: existing.id, status: { notIn: ['REFUNDED', 'FAILED'] } },
        data: {
          status: existing.paymentStatus === 'PAID' ? 'REFUNDED' : 'FAILED',
        },
      });

      return tx.order.update({
        where: { id: existing.id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          ...(existing.paymentStatus === 'PAID' ? { paymentStatus: 'REFUNDED' as const } : {}),
          statusEvents: {
            create: {
              from: existing.status,
              to: 'CANCELLED',
              note: 'Cancelled by the customer',
              actorId: userId,
            },
          },
        },
        include: ORDER_INCLUDE,
      });
    },
    { timeout: 15_000 },
  );

  return mapOrder(updated, true);
}

/* ------------------------------------------------------- admin operations --*/

export async function adminListOrders(query: {
  page: number;
  limit: number;
  skip: number;
  search?: string;
  status?: string;
  paymentStatus?: string;
  from?: string;
  to?: string;
  customerId?: string;
}) {
  const where: Prisma.OrderWhereInput = {
    ...(query.status ? { status: query.status as never } : {}),
    ...(query.paymentStatus ? { paymentStatus: query.paymentStatus as never } : {}),
    ...(query.customerId ? { userId: query.customerId } : {}),
    ...(query.from || query.to
      ? {
          createdAt: {
            ...(query.from ? { gte: new Date(query.from) } : {}),
            ...(query.to ? { lte: new Date(query.to) } : {}),
          },
        }
      : {}),
    ...(query.search
      ? {
          OR: [
            { orderNumber: { contains: query.search, mode: 'insensitive' } },
            {
              user: {
                OR: [
                  { email: { contains: query.search, mode: 'insensitive' } },
                  { firstName: { contains: query.search, mode: 'insensitive' } },
                  { lastName: { contains: query.search, mode: 'insensitive' } },
                ],
              },
            },
          ],
        }
      : {}),
  };

  const [total, orders] = await prisma.$transaction([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      include: ORDER_INCLUDE,
      orderBy: { createdAt: 'desc' },
      skip: query.skip,
      take: query.limit,
    }),
  ]);

  return {
    data: orders.map((order) => mapOrder(order, true)),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / query.limit),
    },
    summary: await adminOrderSummary(),
  };
}

async function adminOrderSummary() {
  const grouped = await prisma.order.groupBy({
    by: ['status'],
    _count: { _all: true },
    _sum: { total: true },
  });

  const summary: Record<string, { count: number; revenue: number }> = {};

  for (const row of grouped) {
    summary[row.status] = { count: row._count._all, revenue: toNumber(row._sum.total) };
  }

  return summary;
}

export async function adminGetOrder(id: string) {
  const order = await prisma.order.findFirst({
    where: { OR: [{ id }, { orderNumber: id }] },
    include: {
      ...ORDER_INCLUDE,
      statusEvents: { orderBy: { createdAt: 'asc' } },
    },
  });

  if (!order) throw new NotFoundError('That order could not be found.');

  return {
    ...mapOrder(order, true),
    statusHistory: order.statusEvents.map((event) => ({
      from: event.from,
      to: event.to,
      note: event.note,
      createdAt: event.createdAt.toISOString(),
    })),
  };
}

/**
 * Status transition with validation.
 *
 * The allowed transitions come from a single map, so a request cannot move an
 * order from PENDING straight to DELIVERED, and a cancelled or delivered order
 * is terminal. Cancelling also returns stock, in the same transaction that
 * changes the status.
 */
export async function updateOrderStatus(
  id: string,
  nextStatus: string,
  options: { note?: string; actorId?: string } = {},
) {
  const existing = await prisma.order.findUnique({
    where: { id },
    include: { items: { include: { variant: true } }, payment: true },
  });

  if (!existing) throw new NotFoundError('That order could not be found.');

  if (existing.status === nextStatus) {
    throw new ValidationError(`This order is already ${nextStatus.toLowerCase()}.`);
  }

  if (!canTransition(existing.status, nextStatus)) {
    throw new ValidationError(
      `An order cannot go from ${existing.status.toLowerCase()} to ${nextStatus.toLowerCase()}.`,
    );
  }

  return prisma.$transaction(
    async (tx) => {
      // Return stock if the order is being cancelled before delivery.
      if (
        nextStatus === 'CANCELLED' &&
        (STOCK_RELEASING_STATUSES as readonly string[]).includes(existing.status)
      ) {
        for (const item of existing.items) {
          if (!item.variant) continue;

          await applyStockChange(tx, item.variant.id, item.quantity, 'CANCELLATION', {
            reference: existing.orderNumber,
            note: `Order ${existing.orderNumber} cancelled`,
            actorId: options.actorId,
          });
        }
      }

      await tx.order.update({
        where: { id },
        data: {
          status: nextStatus as never,
          ...(nextStatus === 'DELIVERED' ? { deliveredAt: new Date() } : {}),
          ...(nextStatus === 'CANCELLED' ? { cancelledAt: new Date() } : {}),
          ...(nextStatus === 'DELIVERED' && existing.paymentStatus === 'PENDING' && existing.payment?.method === 'CASH_ON_DELIVERY'
            ? { paymentStatus: 'PAID' as const }
            : {}),
          statusEvents: {
            create: {
              from: existing.status,
              to: nextStatus as never,
              note: options.note ?? null,
              actorId: options.actorId ?? null,
            },
          },
        },
      });

      if (nextStatus === 'CANCELLED') {
        await tx.payment.updateMany({
          where: { orderId: id, status: { not: 'REFUNDED' } },
          data: { status: 'FAILED' },
        });
      }

      // The row was just updated inside this transaction, so it cannot be missing;
      // the assertion is on the awaited value, not the promise.
      const updated = await tx.order.findUnique({ where: { id }, include: ORDER_INCLUDE });

      return updated!;
    },
    { timeout: 15_000 },
  ).then((order) => {
    if (nextStatus === 'SHIPPED') {
      void emailService.sendShippingNotification({
        to: order.user.email,
        firstName: order.user.firstName,
        orderNumber: order.orderNumber,
        status: nextStatus,
      });
    } else {
      void emailService.sendOrderStatusUpdate({
        to: order.user.email,
        firstName: order.user.firstName,
        orderNumber: order.orderNumber,
        status: nextStatus,
      });
    }

    return mapOrder(order, true);
  });
}