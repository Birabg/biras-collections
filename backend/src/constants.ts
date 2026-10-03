/*
 * Business constants. Anything a calculator or a validator needs to agree on
 * lives here, so the checkout summary and the order transaction can never
 * disagree about a fee.
 */

/** Free delivery above this subtotal, in ETB. Matches the storefront copy. */
export const FREE_SHIPPING_THRESHOLD = 5000;

/** Flat delivery fee below the threshold, in ETB. */
export const SHIPPING_FEE = 150;

export const MAX_QUANTITY_PER_LINE = 20;
export const MAX_CART_ITEMS = 50;

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

/**
 * Upper bound on `page`. Offset pagination has to make the database walk and
 * discard every skipped row, so an unbounded page number is a cheap way to make
 * the database do unbounded work. Past this, a client should filter or use a
 * cursor instead.
 */
export const MAX_PAGE_NUMBER = 10_000;

/** Health of a variant relative to its own threshold. */
export const STOCK_LEVEL = {
  IN_STOCK: 'in_stock',
  LOW_STOCK: 'low_stock',
  OUT_OF_STOCK: 'out_of_stock',
} as const;

export type StockLevel = (typeof STOCK_LEVEL)[keyof typeof STOCK_LEVEL];

/**
 * Allowed order status transitions. The API rejects anything not listed here,
 * so an order cannot jump from PENDING straight to DELIVERED or leave a
 * terminal state.
 */
export const ORDER_TRANSITIONS: Record<string, readonly string[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: [],
};

export function canTransition(from: string, to: string): boolean {
  return ORDER_TRANSITIONS[from]?.includes(to) ?? false;
}

/** Statuses from which stock must be returned to inventory on cancellation. */
export const STOCK_RELEASING_STATUSES = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED'] as const;

/**
 * Statuses a customer may cancel from. SHIPPED is deliberately absent: the
 * goods are with the courier by then, so the customer needs a return, not a
 * cancellation.
 */
export const CUSTOMER_CANCELLABLE_STATUSES = ['PENDING', 'CONFIRMED'] as const;

export const CURRENCY = 'ETB';