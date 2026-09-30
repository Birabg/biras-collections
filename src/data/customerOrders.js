/**
 * Demo customer orders.
 *
 * THERE IS NO ORDER SERVICE. Nothing here was ever placed, paid for, or
 * shipped. Tracking numbers, card digits and delivery scans are invented
 * sample data so the screens have something coherent to render — they must
 * never be presented to a shopper as real. Every surface that shows an order
 * states this plainly.
 *
 * When the real orders API lands, delete this file and swap the calls in
 * `src/api/orders.js` for the server response. The shape below is intended to
 * match a typical order API so that swap is mechanical.
 */

export const ORDER_STATUS = {
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  RETURNED: 'returned',
};

/** Label + colour per status, so three pages cannot disagree. */
export const STATUS_META = {
  [ORDER_STATUS.PROCESSING]: { label: 'Processing', tone: 'warning' },
  [ORDER_STATUS.SHIPPED]: { label: 'Shipped', tone: 'info' },
  [ORDER_STATUS.DELIVERED]: { label: 'Delivered', tone: 'success' },
  [ORDER_STATUS.CANCELLED]: { label: 'Cancelled', tone: 'neutral' },
  [ORDER_STATUS.RETURNED]: { label: 'Returned', tone: 'neutral' },
};

/** Tailwind classes per tone, kept beside STATUS_META on purpose. */
export const STATUS_TONE_CLASS = {
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  info: 'bg-sand text-ink-60',
  neutral: 'bg-line-soft text-ink-40',
};

const SAMPLE_ORDERS = [
  {
    id: 'DEMO-2601',
    placedAt: '2026-09-15T10:30:00.000Z',
    status: ORDER_STATUS.DELIVERED,
    items: [
      {
        productId: 1,
        slug: 'classic-linen-shirt',
        name: 'Classic Linen Shirt',
        size: 'M',
        color: 'White',
        quantity: 2,
        price: 1850,
      },
      {
        productId: 7,
        slug: 'minimalist-leather-belt',
        name: 'Minimalist Leather Belt',
        size: '90',
        color: 'Black',
        quantity: 1,
        price: 650,
      },
    ],
    subtotal: 4350,
    delivery: 0,
    tax: 0,
    total: 4350,
    payment: { method: 'Telebirr', reference: 'TXN-DEMO-4417' },
    shipping: {
      name: 'Demo Recipient',
      phone: '+251 900 000 000',
      address: 'Bole Sub-city, Kebele 12',
      city: 'Addis Ababa',
      region: 'Addis Ababa',
    },
    trackingNumber: null,
    estimatedDelivery: '2026-09-17T00:00:00.000Z',
  },
  {
    id: 'DEMO-2602',
    placedAt: '2026-09-20T14:05:00.000Z',
    status: ORDER_STATUS.SHIPPED,
    items: [
      {
        productId: 2,
        slug: 'elegant-summer-dress',
        name: 'Elegant Summer Dress',
        size: 'S',
        color: 'Sand',
        quantity: 1,
        price: 2950,
      },
    ],
    subtotal: 2950,
    delivery: 0,
    tax: 0,
    total: 2950,
    payment: { method: 'CBE Birr', reference: 'TXN-DEMO-8830' },
    shipping: {
      name: 'Demo Recipient',
      phone: '+251 900 000 000',
      address: 'Kirkos Sub-city, Woreda 07',
      city: 'Addis Ababa',
      region: 'Addis Ababa',
    },
    trackingNumber: 'DEMO-TRACK-0001',
    estimatedDelivery: '2026-09-26T00:00:00.000Z',
  },
];

/**
 * Stand-in for `GET /api/orders`. Resolves from the sample set so callers can
 * be written against a promise today and need no change when it is real.
 */
export function fetchOrders() {
  return Promise.resolve([...SAMPLE_ORDERS]);
}

/** Stand-in for `GET /api/orders/:id`. Resolves `null` when not found. */
export function fetchOrderById(id) {
  return Promise.resolve(SAMPLE_ORDERS.find((order) => order.id === id) ?? null);
}

/* --------------------------------------------------------------- formatters */

export function formatOrderDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatOrderDateTime(iso) {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Number of items, counting quantities. */
export function orderItemCount(order) {
  return order.items.reduce((sum, item) => sum + item.quantity, 0);
}

/**
 * Milestone trail. For a sample order we derive it from the status rather
 * than storing invented scan timestamps per order.
 */
export function orderMilestones(order) {
  const ordered = [
    { status: 'Order placed', at: order.placedAt, done: true },
    { status: 'Processing', at: null, done: order.status !== ORDER_STATUS.CANCELLED },
    { status: 'Shipped', at: null, done: [ORDER_STATUS.SHIPPED, ORDER_STATUS.DELIVERED].includes(order.status) },
    { status: 'Delivered', at: null, done: order.status === ORDER_STATUS.DELIVERED },
  ];

  // A cancelled or returned order never reached delivery.
  if ([ORDER_STATUS.CANCELLED, ORDER_STATUS.RETURNED].includes(order.status)) {
    const index = ordered.findIndex((step) => !step.done);
    if (index > 0) ordered[index - 1].done = false;
    return [...ordered.slice(0, Math.max(index, 1)), { status: 'Cancelled', at: null, done: true }];
  }

  return ordered;
}
