/**
 * Order status vocabulary, mirrored from `backend/src/constants.ts`.
 *
 * The backend is the authority: `updateOrderStatus` rejects any transition not in
 * `ORDER_TRANSITIONS` with a 400. Offering a status the server will refuse would
 * be worse than offering none, so the same map lives here and the UI derives the
 * available actions from the order's current status instead of hard-coding a
 * fixed dropdown.
 *
 * Note there is no "Packed" status. Earlier mock screens showed one; the schema
 * does not have it, so it could never have been written.
 */

export const ORDER_STATUS = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  PROCESSING: 'PROCESSING',
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
};

/** Allowed next statuses, mirroring `ORDER_TRANSITIONS`. */
export const ORDER_TRANSITIONS = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: [],
};

/** Human labels. The API speaks in enum names; people do not. */
export const ORDER_STATUS_LABEL = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  PROCESSING: 'Processing',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

/** The action an admin most likely wants next, used for the primary row button. */
export const PRIMARY_NEXT_STATUS = {
  PENDING: 'CONFIRMED',
  CONFIRMED: 'PROCESSING',
  PROCESSING: 'SHIPPED',
  SHIPPED: 'DELIVERED',
  DELIVERED: null,
  CANCELLED: null,
};

export const ORDER_STATUSES = Object.keys(ORDER_TRANSITIONS);

/**
 * Transitions that hand stock back. Cancelling an order after it has shipped is
 * not just a status change, so the UI says so rather than letting a surprised
 * admin find out from the inventory report.
 */
export const CANCELLATION_RETURNS_STOCK = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED'];

export const PAYMENT_STATUSES = ['PENDING', 'PAID', 'FAILED', 'REFUNDED'];

export const PAYMENT_STATUS_LABEL = {
  PENDING: 'Pending',
  PAID: 'Paid',
  FAILED: 'Failed',
  REFUNDED: 'Refunded',
};

export function statusLabel(status) {
  return ORDER_STATUS_LABEL[status] ?? status;
}

export function nextStatuses(status) {
  return ORDER_TRANSITIONS[status] ?? [];
}

export function isTerminal(status) {
  return nextStatuses(status).length === 0;
}

/** `in_stock` / `low_stock` / `out_of_stock`, from the backend enum. */
export const STOCK_LEVEL_LABEL = {
  in_stock: 'In stock',
  low_stock: 'Low stock',
  out_of_stock: 'Out of stock',
};

export const STOCK_LEVEL_TONE = {
  in_stock: 'success',
  low_stock: 'warning',
  out_of_stock: 'error',
};

export const INVENTORY_REASON_LABEL = {
  ADJUSTMENT: 'Correction',
  RESTOCK: 'Restock',
  DAMAGE: 'Damage',
};
