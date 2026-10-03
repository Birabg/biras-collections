import { prisma } from '../config/prisma';
import { NotFoundError, InsufficientStockError, ValidationError } from '../utils/errors';
import { mapCart } from '../utils/mappers';
import { MAX_CART_ITEMS, MAX_QUANTITY_PER_LINE, FREE_SHIPPING_THRESHOLD, SHIPPING_FEE } from '../constants';
import { round2 } from '../utils/http';

/*
 * Cart service.
 *
 * The cart is keyed by (productId, variantId), matching how the storefront
 * treats a "line" — same shirt in size M and size L are different lines.
 *
 * Prices are always read from the catalogue. `priceSnapshot` is a display
 * convenience only and is never used to compute a total.
 */

const CART_INCLUDE = {
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
} as const;

/** Every cart operation starts by guaranteeing a cart row exists. */
async function getOrCreateCart(userId: string) {
  return prisma.cart.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });
}

export async function getCart(userId: string) {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: CART_INCLUDE,
  });

  if (!cart) return { id: null, items: [], itemCount: 0, subtotal: 0 };

  return mapCart(cart);
}

export async function addItem(
  userId: string,
  input: { productId: string; variantId?: string | null; quantity: number },
) {
  const product = await prisma.product.findFirst({
    where: { id: input.productId, isActive: true, deletedAt: null },
    include: { variants: { where: { isActive: true } } },
  });

  if (!product) throw new NotFoundError('That piece is no longer available.');

  const variant = input.variantId
    ? product.variants.find((v) => v.id === input.variantId)
    : null;

  if (input.variantId && !variant) {
    throw new ValidationError('That size and colour combination is not available.', [
      { field: 'variantId', message: 'Unavailable variant' },
    ]);
  }

  const cart = await getOrCreateCart(userId);

  /*
 * `findFirst` rather than the compound-unique lookup: `variantId` is nullable, so
 * "the line with no variant" cannot be addressed through a unique where clause.
 * The database still enforces uniqueness via @@unique([cartId, productId, variantId]).
 */
const existing = await prisma.cartItem.findFirst({
    where: { cartId: cart.id, productId: product.id, variantId: variant?.id ?? null },
  });

  const requested = (existing?.quantity ?? 0) + input.quantity;

  if (requested > MAX_QUANTITY_PER_LINE) {
    throw new ValidationError(`You can order at most ${MAX_QUANTITY_PER_LINE} of one piece.`, [
      { field: 'quantity', message: `Maximum ${MAX_QUANTITY_PER_LINE} per piece` },
    ]);
  }

  if (variant && variant.stockQuantity < requested) {
    throw new InsufficientStockError(
      `Only ${variant.stockQuantity} left in that size and colour.`,
    );
  }

  const lineCount = await prisma.cartItem.count({ where: { cartId: cart.id } });

  if (!existing && lineCount >= MAX_CART_ITEMS) {
    throw new ValidationError(`Your bag can hold up to ${MAX_CART_ITEMS} different pieces.`);
  }

  const price = variant?.price ?? product.price;

  if (existing) {
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: requested, priceSnapshot: price },
    });
  } else {
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId: product.id,
        variantId: variant?.id ?? null,
        quantity: input.quantity,
        priceSnapshot: price,
      },
    });
  }

  return getCart(userId);
}

export async function updateItem(userId: string, itemId: string, quantity: number) {
  const cart = await getOrCreateCart(userId);

  const item = await prisma.cartItem.findFirst({
    where: { id: itemId, cartId: cart.id },
    include: { variant: true },
  });

  // Scoping the lookup by cartId is what prevents customer A from mutating
  // customer B's line item by guessing an id.
  if (!item) throw new NotFoundError('That item is not in your bag.');

  if (item.variant && item.variant.stockQuantity < quantity) {
    throw new InsufficientStockError(`Only ${item.variant.stockQuantity} left in that size and colour.`);
  }

  await prisma.cartItem.update({ where: { id: item.id }, data: { quantity } });

  return getCart(userId);
}

export async function removeItem(userId: string, itemId: string) {
  const cart = await getOrCreateCart(userId);

  const item = await prisma.cartItem.findFirst({ where: { id: itemId, cartId: cart.id } });

  if (!item) throw new NotFoundError('That item is not in your bag.');

  await prisma.cartItem.delete({ where: { id: item.id } });

  return getCart(userId);
}

export async function clearCart(userId: string) {
  const cart = await getOrCreateCart(userId);
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  return getCart(userId);
}

export async function removeProduct(userId: string, productId: string) {
  const cart = await getOrCreateCart(userId);
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id, productId } });
  return getCart(userId);
}

/**
 * Shipping figures for the bag, computed server-side so the cart page and the
 * order transaction cannot disagree.
 */
export function shippingFor(subtotal: number) {
  const fee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;

  return {
    shippingFee: fee,
    freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
    amountToFreeShipping: round2(Math.max(FREE_SHIPPING_THRESHOLD - subtotal, 0)),
    total: round2(subtotal + fee),
  };
}