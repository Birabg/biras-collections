import { Prisma, InventoryReason } from '@prisma/client';
import { prisma } from '../config/prisma';
import { NotFoundError, InsufficientStockError } from '../utils/errors';
import { STOCK_LEVEL, type StockLevel } from '../constants';

/*
 * Inventory service.
 *
 * Two rules drive the design:
 *   1. Stock can never go negative. Every decrement is a guarded
 *      `UPDATE ... WHERE stockQuantity >= n`, and a zero-row result means
 *      someone else took the units first.
 *   2. Every change is recorded in inventory_movements with the resulting
 *      balance, so the stock figure can always be explained.
 */

const VARIANT_INCLUDE = { product: { select: { id: true, name: true, slug: true } } };

export interface StockCheck {
  variantId: string;
  requested: number;
  available: number;
  ok: boolean;
}

type Transaction = Prisma.TransactionClient;

/* -------------------------------------------------------------- reading --*/

export async function listInventoryVariants({
  page,
  limit,
  skip,
  search,
  level,
}: {
  page: number;
  limit: number;
  skip: number;
  search?: string;
  level?: StockLevel;
}) {
  const where: Prisma.ProductVariantWhereInput = {
    isActive: true,
    product: { isActive: true, deletedAt: null },
    /*
     * A top-level OR rather than one nested inside the `product` relation: the
     * two branches search different tables (this variant's sku, its product's
     * name), and Prisma cannot mix scalar and relation fields in one relation
     * filter.
     */
    ...(search
      ? {
          OR: [
            { sku: { contains: search, mode: 'insensitive' as const } },
            { product: { name: { contains: search, mode: 'insensitive' as const } } },
          ],
        }
      : {}),
  };

  /*
   * Level filtering happens after the stock arithmetic, which Prisma cannot
   * express ("at or below its own threshold") — so the three buckets are queried
   * and classified in application code, still bounded by pagination.
   */
  const all = await prisma.productVariant.findMany({
    where,
    include: VARIANT_INCLUDE,
    orderBy: [{ product: { name: 'asc' } }, { size: 'asc' }, { color: 'asc' }],
  });

  const classified = all.map((variant) => ({
    ...variant,
    level: classify(variant.stockQuantity, variant.lowStockThreshold),
  }));

  const filtered = level ? classified.filter((variant) => variant.level === level) : classified;

  const total = filtered.length;
  const rows = filtered.slice(skip, skip + limit);

  return {
    data: rows.map((variant) => ({
      id: variant.id,
      sku: variant.sku,
      size: variant.size,
      color: variant.color,
      colorHex: variant.colorHex,
      stockQuantity: variant.stockQuantity,
      lowStockThreshold: variant.lowStockThreshold,
      level: variant.level,
      inStock: variant.stockQuantity > 0,
      product: {
        id: variant.productId,
        name: variant.product.name,
        slug: variant.product.slug,
      },
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
    },
    summary: {
      inStock: classified.filter((v) => v.level === STOCK_LEVEL.IN_STOCK).length,
      lowStock: classified.filter((v) => v.level === STOCK_LEVEL.LOW_STOCK).length,
      outOfStock: classified.filter((v) => v.level === STOCK_LEVEL.OUT_OF_STOCK).length,
    },
  };
}

export function classify(stock: number, threshold: number): StockLevel {
  if (stock <= 0) return STOCK_LEVEL.OUT_OF_STOCK;
  if (stock <= threshold) return STOCK_LEVEL.LOW_STOCK;
  return STOCK_LEVEL.IN_STOCK;
}

export async function getInventoryMovements(variantId: string, take = 50) {
  return prisma.inventoryMovement.findMany({
    where: { variantId },
    orderBy: { createdAt: 'desc' },
    take,
  });
}

/* -------------------------------------------------------------- writing --*/

/**
 * Applies a stock delta inside an existing transaction and appends an audit row.
 *
 * The guard `stockQuantity: { gte: -delta }` (for a decrement) is what makes
 * concurrent checkouts safe: Postgres evaluates the WHERE clause against the
 * locked row, so the second of two simultaneous buyers is rejected rather than
 * driving the count negative.
 */
export async function applyStockChange(
  tx: Transaction,
  variantId: string,
  delta: number,
  reason: InventoryReason,
  options: { reference?: string; note?: string; actorId?: string } = {},
) {
  const variant = await tx.productVariant.findUnique({
    where: { id: variantId },
    select: { id: true, stockQuantity: true },
  });

  if (!variant) throw new NotFoundError('That product variant could not be found.');

  /*
   * A relative UPDATE rather than `SET stockQuantity = <computed value>`.
   * Postgres applies `stockQuantity + delta` to the row it locked, so two
   * concurrent writers can never overwrite each other's arithmetic. The `gte`
   * guard is evaluated against that same locked row, which is what makes an
   * oversell impossible rather than merely unlikely.
   */
  const guard: Prisma.ProductVariantWhereInput =
    delta < 0 ? { id: variantId, stockQuantity: { gte: -delta } } : { id: variantId };

  const updated = await tx.productVariant.updateMany({
    where: guard,
    data: { stockQuantity: { increment: delta } },
  });

  if (updated.count === 0) {
    throw new InsufficientStockError(
      `Only ${variant.stockQuantity} unit${variant.stockQuantity === 1 ? '' : 's'} of this piece are left.`,
    );
  }

  // Re-read rather than computing the new balance locally, so the audit row
  // records exactly what the database holds.
  const fresh = await tx.productVariant.findUnique({
    where: { id: variantId },
    select: { stockQuantity: true },
  });

  const balanceAfter = fresh?.stockQuantity ?? variant.stockQuantity + delta;

  await tx.inventoryMovement.create({
    data: {
      variantId,
      reason,
      quantity: delta,
      balanceAfter,
      reference: options.reference ?? null,
      note: options.note ?? null,
      actorId: options.actorId ?? null,
    },
  });

  return balanceAfter;
}

/** Admin correction. Can move stock up (restock) or down (damage, recount). */
export async function adjustStock(
  variantId: string,
  delta: number,
  reason: InventoryReason,
  options: { note?: string; actorId?: string } = {},
) {
  return prisma.$transaction(async (tx) => {
    const balance = await applyStockChange(tx, variantId, delta, reason, options);

    return { variantId, stockQuantity: balance, delta };
  });
}

export async function setStock(variantId: string, absolute: number, actorId?: string) {
  return prisma.$transaction(async (tx) => {
    const variant = await tx.productVariant.findUnique({ where: { id: variantId } });

    if (!variant) throw new NotFoundError('That product variant could not be found.');

    const delta = absolute - variant.stockQuantity;

    if (delta === 0) {
      return { variantId, stockQuantity: absolute, delta: 0 };
    }

    const balance = await applyStockChange(
      tx,
      variantId,
      delta,
      InventoryReason.ADJUSTMENT,
      { note: 'Absolute stock set by an administrator', actorId },
    );

    return { variantId, stockQuantity: balance, delta };
  });
}

/* ------------------------------------------------------------ validation --*/

/**
 * Verifies that every requested line can actually be fulfilled. Used by the
 * checkout summary so a shopper learns about a shortfall before submitting,
 * rather than after the transaction fails.
 */
export async function checkAvailability(
  lines: Array<{ variantId: string | null; productId: string; quantity: number }>,
): Promise<AvailabilityResult> {
  return checkAvailabilityWith(prisma, lines);
}

/**
 * The same check, but reading through a transaction client.
 *
 * Checkout must use this rather than the convenience wrapper above: reading stock
 * through a different connection would observe a state the surrounding
 * transaction cannot see, which defeats the point of validating inside it.
 */
export async function checkAvailabilityInTransaction(
  tx: Transaction,
  lines: Array<{ variantId: string | null; productId: string; quantity: number }>,
): Promise<AvailabilityResult> {
  return checkAvailabilityWith(tx, lines);
}

export interface AvailabilityResult {
  checks: StockCheck[];
  issues: StockIssue[];
}

export interface StockIssue {
  productId: string;
  variantId: string | null;
  available: number;
  requested: number;
}

async function checkAvailabilityWith(
  client: Transaction,
  lines: Array<{ variantId: string | null; productId: string; quantity: number }>,
): Promise<AvailabilityResult> {
  const checks: StockCheck[] = [];
  const issues: StockIssue[] = [];

  for (const line of lines) {
    if (!line.variantId) {
      /*
       * No variant means the product tracks stock across its variants — the
       * accessory path. The storefront always supplies a variant for a sized
       * product.
       */
      const product = await client.product.findFirst({
        where: { id: line.productId, isActive: true, deletedAt: null },
        include: { variants: { where: { isActive: true } } },
      });

      if (!product) {
        checks.push({ variantId: '', requested: line.quantity, available: 0, ok: false });
        issues.push({ productId: line.productId, variantId: null, available: 0, requested: line.quantity });
        continue;
      }

      const available = product.variants.reduce((sum, v) => sum + v.stockQuantity, 0);
      const ok = available >= line.quantity;

      checks.push({ variantId: '', requested: line.quantity, available, ok });

      if (!ok) issues.push({ productId: line.productId, variantId: null, available, requested: line.quantity });
      continue;
    }

    const variant = await client.productVariant.findFirst({
      where: { id: line.variantId, isActive: true, product: { isActive: true, deletedAt: null } },
    });

    if (!variant) {
      checks.push({ variantId: line.variantId, requested: line.quantity, available: 0, ok: false });
      issues.push({ productId: line.productId, variantId: line.variantId, available: 0, requested: line.quantity });
      continue;
    }

    const ok = variant.stockQuantity >= line.quantity;

    checks.push({ variantId: variant.id, requested: line.quantity, available: variant.stockQuantity, ok });

    if (!ok) {
      issues.push({
        productId: line.productId,
        variantId: line.variantId,
        available: variant.stockQuantity,
        requested: line.quantity,
      });
    }
  }

  return { checks, issues };
}

export function assertAllAvailable(issues: Array<{ available: number }>) {
  if (issues.length === 0) return;

  throw new InsufficientStockError(
    issues.length === 1
      ? 'One piece in your bag is no longer available in that quantity.'
      : `${issues.length} pieces in your bag are no longer available in that quantity.`,
  );
}