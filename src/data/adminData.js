/**
 * PLACEHOLDER DATA — NOT REAL.
 *
 * There is no admin API. Every figure below is invented so the administrative
 * interface can be designed and reviewed. Replace this module with API calls;
 * the screens read only from the exported shapes.
 */

export const REVENUE_SERIES = [
  { label: 'Mon', value: 18400 },
  { label: 'Tue', value: 22600 },
  { label: 'Wed', value: 19800 },
  { label: 'Thu', value: 31200 },
  { label: 'Fri', value: 27400 },
  { label: 'Sat', value: 38900 },
  { label: 'Sun', value: 24100 },
];

export const KPI_CARDS = [
  { key: 'revenue', label: 'Revenue today', value: '182,450 ETB', delta: +12.4, hint: 'vs. last Sunday' },
  { key: 'orders', label: 'Orders today', value: '64', delta: +8.1, hint: '9 awaiting fulfilment' },
  { key: 'customers', label: 'New customers', value: '23', delta: -3.2, hint: 'this week' },
  { key: 'refunds', label: 'Open refunds', value: '7', delta: -11.5, hint: '3 need review' },
];

export const ORDER_STATUSES = ['Processing', 'Packed', 'Shipped', 'Delivered', 'Cancelled'];

export const ADMIN_ORDERS = [
  {
    id: 'ORD-2026-0141',
    customer: 'Selam Bekele',
    email: 'selam.bekele@example.com',
    date: '30 Sep 2026',
    total: 4350,
    status: 'Processing',
    items: 2,
  },
  {
    id: 'ORD-2026-0140',
    customer: 'Dawit Haile',
    email: 'dawit.haile@example.com',
    date: '30 Sep 2026',
    total: 2950,
    status: 'Packed',
    items: 1,
  },
  {
    id: 'ORD-2026-0139',
    customer: 'Marta Tesfaye',
    email: 'marta.tesfaye@example.com',
    date: '29 Sep 2026',
    total: 8600,
    status: 'Shipped',
    items: 4,
  },
  {
    id: 'ORD-2026-0138',
    customer: 'Yonas Girma',
    email: 'yonas.girma@example.com',
    date: '29 Sep 2026',
    total: 1250,
    status: 'Delivered',
    items: 1,
  },
  {
    id: 'ORD-2026-0137',
    customer: 'Hana Mekonnen',
    email: 'hana.mekonnen@example.com',
    date: '28 Sep 2026',
    total: 5400,
    status: 'Cancelled',
    items: 3,
  },
];

export const ADMIN_CUSTOMERS = [
  { id: 1, name: 'Selam Bekele', email: 'selam.bekele@example.com', orders: 12, spent: 48700, since: 'Mar 2025' },
  { id: 2, name: 'Dawit Haile', email: 'dawit.haile@example.com', orders: 8, spent: 21450, since: 'Jul 2025' },
  { id: 3, name: 'Marta Tesfaye', email: 'marta.tesfaye@example.com', orders: 5, spent: 17200, since: 'Jan 2026' },
  { id: 4, name: 'Yonas Girma', email: 'yonas.girma@example.com', orders: 3, spent: 6450, since: 'Apr 2026' },
  { id: 5, name: 'Hana Mekonnen', email: 'hana.mekonnen@example.com', orders: 1, spent: 5400, since: 'Sep 2026' },
];

/**
 * Inventory is derived from the real product catalogue so stock figures on the
 * admin screen are consistent with the storefront.
 */
export const INVENTORY_VIEWS = [
  { key: 'in_stock', label: 'In stock' },
  { key: 'low_stock', label: 'Low stock' },
  { key: 'out_of_stock', label: 'Out of stock' },
];

export const REPORTS = [
  { key: 'sales', label: 'Sales by period', description: 'Revenue, units and average order value.' },
  { key: 'products', label: 'Product performance', description: 'Best and worst performing lines.' },
  { key: 'categories', label: 'Category mix', description: 'Share of revenue by category.' },
  { key: 'delivery', label: 'Delivery performance', description: 'Transit times and failure rate.' },
  { key: 'returns', label: 'Returns and refunds', description: 'Rate, reasons and value.' },
];

export const SETTINGS_SECTIONS = [
  { key: 'store', label: 'Store details', description: 'Name, support contacts and hours.' },
  { key: 'delivery', label: 'Delivery', description: 'Fees, free-delivery threshold, regions.' },
  { key: 'payments', label: 'Payments', description: 'Enabled methods and currencies.' },
  { key: 'roles', label: 'Roles and permissions', description: 'Who can do what in the back office.' },
];
