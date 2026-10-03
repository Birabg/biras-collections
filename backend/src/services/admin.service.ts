import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { toNumber, round2 } from '../utils/http';
import { mapUser } from '../utils/mappers';
import { AuthorizationError, NotFoundError } from '../utils/errors';
import { CURRENCY } from '../constants';
import { classify } from './inventory.service';

/*
 * Admin reporting.
 *
 * Every figure is aggregated by the database. Sending raw orders to the browser
 * to total up in JavaScript would leak customer data and scale badly.
 *
 * Revenue is defined as orders that were actually paid for. `REVENUE_STATUSES`
 * alone is not enough: cash-on-delivery orders are CONFIRMED from the moment they
 * are placed, and an admin can confirm an unpaid order by hand, so status alone
 * would book money that has not arrived. `revenueWhere` therefore pairs the
 * status filter with the payment status, and cancelled/refunded orders never
 * count.
 */

const REVENUE_STATUSES = ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'] as const;

const revenueWhere: Prisma.OrderWhereInput = {
  status: { in: [...REVENUE_STATUSES] },
  OR: [{ paymentStatus: 'PAID' }, { paymentStatus: 'PENDING', status: 'DELIVERED' }],
};

/** `revenueWhere` narrowed to a date range, without dropping the payment rule. */
function revenueIn(from?: Date | null, to?: Date | null): Prisma.OrderWhereInput {
  if (!from && !to) return revenueWhere;

  return {
    ...revenueWhere,
    createdAt: { ...(from ? { gte: from } : {}), ...(to ? { lt: to } : {}) },
  };
}

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export async function getDashboard() {
  const now = new Date();
  const todayStart = startOfDay(now);
  const tomorrowStart = new Date(todayStart.getTime() + 86_400_000);
  const weekAgo = new Date(todayStart.getTime() - 7 * 86_400_000);

  const [
    revenueAgg,
    customersCount,
    productsCount,
    pendingOrders,
    todayRevenue,
    todayOrders,
    lastWeekRevenue,
    recentOrders,
    statusGroups,
  ] = await Promise.all([
    prisma.order.aggregate({
      where: revenueWhere,
      _sum: { total: true },
      _count: { _all: true },
    }),
    prisma.user.count({ where: { role: 'CUSTOMER' } }),
    prisma.product.count({ where: { isActive: true, deletedAt: null } }),
    prisma.order.count({ where: { status: { in: ['PENDING', 'CONFIRMED', 'PROCESSING'] } } }),
    prisma.order.aggregate({
      where: revenueIn(todayStart, null),
      _sum: { total: true },
      _count: { _all: true },
    }),
    prisma.order.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.order.aggregate({
      where: revenueIn(weekAgo, todayStart),
      _sum: { total: true },
    }),
    prisma.order.findMany({
      take: 8,
      orderBy: { createdAt: 'desc' },
      include: { items: true, user: { select: { id: true, firstName: true, lastName: true, email: true } } },
    }),
    prisma.order.groupBy({ by: ['status'], _count: { _all: true }, _sum: { total: true } }),
  ]);

  /*
   * Both of these need the variant rows, and "is this product at or below its own
   * threshold" is not expressible in SQL here, so classification happens in
   * application code over a single batch read rather than per-product queries.
   */
  const variants = await prisma.productVariant.findMany({
    where: { isActive: true, product: { isActive: true, deletedAt: null } },
    select: {
      id: true,
      productId: true,
      sku: true,
      size: true,
      color: true,
      stockQuantity: true,
      lowStockThreshold: true,
      isActive: true,
      product: {
        select: { name: true, slug: true, images: { orderBy: { sortOrder: 'asc' }, take: 1 } },
      },
    },
  });

  const lowStockCount = new Set(
    variants.filter((variant) => classify(variant.stockQuantity, variant.lowStockThreshold) !== 'in_stock')
      .map((variant) => variant.productId),
  ).size;

  const revenueToday = toNumber(todayRevenue._sum.total);
  const revenuePrevious = toNumber(lastWeekRevenue._sum.total);

  return {
    currency: CURRENCY,
    totals: {
      revenue: toNumber(revenueAgg._sum.total),
      orders: revenueAgg._count._all,
      customers: customersCount,
      products: productsCount,
      pendingOrders,
      lowStockProducts: lowStockCount,
    },
    kpis: [
      {
        key: 'revenue',
        label: 'Revenue today',
        value: revenueToday,
        formatted: `${revenueToday.toLocaleString()} ${CURRENCY}`,
        delta: percentageChange(revenueToday, revenuePrevious),
        hint: 'vs. the same day last week',
      },
      {
        key: 'orders',
        label: 'Orders today',
        value: todayOrders,
        formatted: String(todayOrders),
        // No meaningful "previous period" baseline for a single day count, so
        // the delta is omitted rather than shown as a misleading 100%.
        delta: null,
        hint: `${pendingOrders} awaiting fulfilment`,
      },
      {
        key: 'customers',
        label: 'Customers',
        value: customersCount,
        formatted: String(customersCount),
        delta: null,
        hint: 'registered accounts',
      },
      {
        key: 'inventory',
        label: 'Needs attention',
        value: lowStockCount,
        formatted: String(lowStockCount),
        delta: null,
        hint: 'products at or below threshold',
      },
    ],
    revenueSeries: await revenueOverTime({ from: weekAgo, to: tomorrowStart, interval: 'day' }),
    orderStatusDistribution: statusGroups.map((row) => ({
      status: row.status,
      count: row._count._all,
      revenue: toNumber(row._sum.total),
    })),
    topProducts: await topProducts(5),
    recentOrders: recentOrders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customer: `${order.user.firstName} ${order.user.lastName}`.trim(),
      email: order.user.email,
      date: order.createdAt.toISOString(),
      total: toNumber(order.total),
      status: order.status,
      paymentStatus: order.paymentStatus,
      items: order.items.reduce((sum, item) => sum + item.quantity, 0),
    })),
    lowStockAlerts: variants
      .filter((variant) => classify(variant.stockQuantity, variant.lowStockThreshold) !== 'in_stock')
      .slice(0, 10)
      .map((variant) => ({
        id: variant.id,
        sku: variant.sku,
        size: variant.size,
        color: variant.color,
        stockQuantity: variant.stockQuantity,
        level: classify(variant.stockQuantity, variant.lowStockThreshold),
        product: {
          name: variant.product.name,
          slug: variant.product.slug,
          image: variant.product.images[0]?.url ?? null,
        },
      })),
  };
}

function percentageChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return round2(((current - previous) / previous) * 100);
}

/** Best sellers by revenue, for the dashboard strip. */
async function topProducts(limit: number, from?: Date | null, to?: Date | null) {
  const grouped = await prisma.orderItem.groupBy({
    by: ['productId'],
    where: { order: revenueIn(from, to) },
    _sum: { quantity: true, subtotal: true },
    orderBy: { _sum: { subtotal: 'desc' } },
    take: limit,
  });

  const products = await prisma.product.findMany({
    where: { id: { in: grouped.map((row) => row.productId) } },
    include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 } },
  });

  const byId = new Map(products.map((product) => [product.id, product]));

  return grouped.map((row) => {
    const product = byId.get(row.productId);

    return {
      productId: row.productId,
      name: product?.name ?? 'Unknown product',
      slug: product?.slug ?? null,
      image: product?.images[0]?.url ?? null,
      unitsSold: row._sum.quantity ?? 0,
      revenue: toNumber(row._sum.subtotal),
    };
  });
}

/* ---------------------------------------------------------------- reports --*/

export async function revenueOverTime({
  from,
  to,
  interval,
}: {
  from?: Date;
  to?: Date;
  interval: 'day' | 'week' | 'month';
}) {
  const start = from ?? startOfDay(new Date(Date.now() - 29 * 86_400_000));
  const end = to ?? new Date();

  const orders = await prisma.order.findMany({
    where: revenueIn(start, end),
    select: { createdAt: true, total: true },
  });

  // Buckets are generated for the whole range, so gaps read as zero revenue
  // rather than disappearing from the chart.
  const buckets = new Map<string, { revenue: number; orders: number }>();

  const cursor = new Date(start);
  while (cursor <= end) {
    buckets.set(bucketKey(cursor, interval), { revenue: 0, orders: 0 });
    advance(cursor, interval);
  }

  for (const order of orders) {
    const key = bucketKey(order.createdAt, interval);
    const bucket = buckets.get(key);

    if (!bucket) continue;

    bucket.revenue = round2(bucket.revenue + toNumber(order.total));
    bucket.orders += 1;
  }

  return [...buckets.entries()].map(([key, value]) => ({
    date: key,
    label: bucketLabel(key, interval),
    revenue: value.revenue,
    orders: value.orders,
  }));
}

function bucketKey(date: Date, interval: 'day' | 'week' | 'month'): string {
  const copy = new Date(date);

  if (interval === 'month') {
    return `${copy.getFullYear()}-${String(copy.getMonth() + 1).padStart(2, '0')}`;
  }

  if (interval === 'week') {
    copy.setDate(copy.getDate() - copy.getDay());
    return copy.toISOString().slice(0, 10);
  }

  return copy.toISOString().slice(0, 10);
}

function bucketLabel(key: string, interval: 'day' | 'week' | 'month'): string {
  const date = new Date(`${key}T00:00:00`);

  if (interval === 'month') {
    return date.toLocaleString('en-GB', { month: 'short', year: '2-digit' });
  }

  return date.toLocaleString('en-GB', { day: 'numeric', month: 'short' });
}

function advance(date: Date, interval: 'day' | 'week' | 'month') {
  if (interval === 'month') date.setMonth(date.getMonth() + 1);
  else if (interval === 'week') date.setDate(date.getDate() + 7);
  else date.setDate(date.getDate() + 1);
}

export async function salesReport(query: { from?: string; to?: string; interval: 'day' | 'week' | 'month' }) {
  const from = query.from ? new Date(query.from) : undefined;
  const to = query.to ? new Date(query.to) : undefined;

  const series = await revenueOverTime({ from, to, interval: query.interval });

  const totalRevenue = round2(series.reduce((sum, point) => sum + point.revenue, 0));
  const totalOrders = series.reduce((sum, point) => sum + point.orders, 0);

  return {
    currency: CURRENCY,
    series,
    totals: {
      revenue: totalRevenue,
      orders: totalOrders,
      averageOrderValue: totalOrders === 0 ? 0 : round2(totalRevenue / totalOrders),
    },
  };
}

/*
 * Order breakdown by status and payment status.
 *
 * The counts deliberately include cancelled and unpaid orders — this report
 * exists to show what happened to every order. The `revenue` figure is summed
 * separately from the qualifying rows only, so a cancelled order adds to the
 * count without adding money to the total.
 */
export async function ordersReport(query: { from?: string; to?: string }) {
  const from = query.from ? new Date(query.from) : null;
  const to = query.to ? new Date(query.to) : null;

  const where: Prisma.OrderWhereInput = {
    ...(from || to
      ? {
          createdAt: {
            ...(from ? { gte: from } : {}),
            ...(to ? { lte: to } : {}),
          },
        }
      : {}),
  };

  const [grouped, revenueRows] = await Promise.all([
    prisma.order.groupBy({
      by: ['status', 'paymentStatus'],
      where,
      _count: { _all: true },
    }),
    prisma.order.groupBy({
      by: ['status', 'paymentStatus'],
      where: revenueIn(from, to),
      _sum: { total: true },
    }),
  ]);

  const revenueByKey = new Map(
    revenueRows.map((row) => [`${row.status}:${row.paymentStatus}`, toNumber(row._sum.total)]),
  );

  return grouped.map((row) => {
    const key = `${row.status}:${row.paymentStatus}`;

    return {
      status: row.status,
      paymentStatus: row.paymentStatus,
      count: row._count._all,
      revenue: revenueByKey.get(key) ?? 0,
    };
  });
}

export async function productsReport(query: { from?: string; to?: string; limit: number }) {
  const from = query.from ? new Date(query.from) : null;
  const to = query.to ? new Date(query.to) : null;
  const where: Prisma.OrderItemWhereInput = { order: revenueIn(from, to) };

  const grouped = await prisma.orderItem.groupBy({
    by: ['productId'],
    where,
    _sum: { quantity: true, subtotal: true },
    orderBy: { _sum: { subtotal: 'desc' } },
    take: query.limit,
  });

  const products = await prisma.product.findMany({
    where: { id: { in: grouped.map((row) => row.productId) } },
    include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 } },
  });

  const byId = new Map(products.map((product) => [product.id, product]));

  const rows = grouped.map((row) => {
    const product = byId.get(row.productId);

    return {
      productId: row.productId,
      name: product?.name ?? 'Unknown product',
      slug: product?.slug ?? null,
      image: product?.images[0]?.url ?? null,
      unitsSold: row._sum.quantity ?? 0,
      revenue: toNumber(row._sum.subtotal),
    };
  });

  const worst = await prisma.orderItem.groupBy({
    by: ['productId'],
    where,
    _sum: { quantity: true, subtotal: true },
    orderBy: { _sum: { quantity: 'asc' } },
    take: query.limit,
  });

  return { top: rows, worst: worst.map((row) => ({ productId: row.productId, unitsSold: row._sum.quantity ?? 0 })) };
}

/*
 * Revenue by category.
 *
 * Like the other revenue figures this is scoped to orders that were actually
 * paid for — otherwise a category could show sales that were cancelled or never
 * collected. It also accepts a date range, which the other reports take, so the
 * admin UI does not need a special case.
 */
export async function categoriesReport(query: { from?: string; to?: string } = {}) {
  const from = query.from ? new Date(query.from) : null;
  const to = query.to ? new Date(query.to) : null;

  const rows = await prisma.orderItem.groupBy({
    by: ['productId'],
    where: { order: revenueIn(from, to) },
    _sum: { subtotal: true },
  });

  const products = await prisma.product.findMany({
    where: { id: { in: rows.map((row) => row.productId) } },
    select: { id: true, categoryId: true },
  });

  const categoryByProduct = new Map(products.map((p) => [p.id, p.categoryId]));

  const perCategory = new Map<string, number>();

  for (const row of rows) {
    const categoryId = categoryByProduct.get(row.productId);
    if (!categoryId) continue;
    perCategory.set(categoryId, round2((perCategory.get(categoryId) ?? 0) + toNumber(row._sum.subtotal)));
  }

  const categories = await prisma.category.findMany({ where: { id: { in: [...perCategory.keys()] } } });
  const total = [...perCategory.values()].reduce((sum, value) => sum + value, 0);

  return categories
    .map((category) => {
      const revenue = perCategory.get(category.id) ?? 0;

      return {
        categoryId: category.id,
        name: category.name,
        slug: category.slug,
        revenue,
        share: total === 0 ? 0 : round2((revenue / total) * 100),
      };
    })
    .sort((a, b) => b.revenue - a.revenue);
}

/* -------------------------------------------------------------- customers --*/

export async function listCustomers(query: {
  page: number;
  limit: number;
  skip: number;
  search?: string;
  role?: string;
  isActive?: boolean;
}) {
  const where: Prisma.UserWhereInput = {
    ...(query.role ? { role: query.role as never } : {}),
    ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
    ...(query.search
      ? {
          OR: [
            { email: { contains: query.search, mode: 'insensitive' } },
            { firstName: { contains: query.search, mode: 'insensitive' } },
            { lastName: { contains: query.search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [total, users] = await prisma.$transaction([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: query.skip,
      take: query.limit,
      // passwordHash is never selected anywhere in this service.
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        lastLoginAt: true,
        _count: { select: { orders: true } },
      },
    }),
  ]);

  // Lifetime spend per customer, aggregated rather than per-row N+1.
  const spend = await prisma.order.groupBy({
    by: ['userId'],
    where: { userId: { in: users.map((u) => u.id) }, ...revenueIn() },
    _sum: { total: true },
  });

  const spendByUser = new Map(spend.map((row) => [row.userId, toNumber(row._sum.total)]));

  return {
    data: users.map((user) => ({
      ...mapUser(user),
      orders: user._count.orders,
      spent: spendByUser.get(user.id) ?? 0,
      lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
      since: user.createdAt.toISOString(),
    })),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / query.limit),
    },
  };
}

export async function getCustomer(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      role: true,
      isActive: true,
      emailVerified: true,
      createdAt: true,
      lastLoginAt: true,
      addresses: { orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }] },
      _count: { select: { orders: true } },
    },
  });

  if (!user) throw new NotFoundError('That customer could not be found.');

  const [orders, spend] = await Promise.all([
    prisma.order.findMany({
      where: { userId: id },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    prisma.order.aggregate({
      where: { userId: id, ...revenueIn() },
      _sum: { total: true },
      _count: { _all: true },
    }),
  ]);

  return {
    ...mapUser(user),
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    addresses: user.addresses,
    statistics: {
      // `orderCount` covers every order ever placed; `paidOrders` and `spent`
      // only count the ones that actually turned into revenue.
      orders: user._count ? user._count.orders : spend._count._all,
      paidOrders: spend._count._all,
      spent: toNumber(spend._sum.total),
    },
    orders: orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      total: toNumber(order.total),
      status: order.status,
      paymentStatus: order.paymentStatus,
      itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
      createdAt: order.createdAt.toISOString(),
    })),
  };
}

export async function setCustomerActive(id: string, isActive: boolean) {
  const user = await prisma.user.update({
    where: { id },
    data: { isActive },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      role: true,
      isActive: true,
      emailVerified: true,
      createdAt: true,
    },
  });

  /*
   * Deactivating must also end live sessions, otherwise a disabled account keeps
   * a valid refresh token until it expires.
   */
  if (!isActive) {
    await prisma.refreshToken.updateMany({
      where: { userId: id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  return mapUser(user);
}

/**
 * Role change. Enforced here rather than trusted from the request body: an admin
 * may not change their own role, and only a SUPER_ADMIN may grant or revoke
 * SUPER_ADMIN. Without these two checks any admin could mint a peer with more
 * authority than their own.
 */
export async function updateUserRole(
  targetId: string,
  nextRole: string,
  actor: { id: string; role: string },
) {
  // Read the target first so a missing user is a 404, not a 403.
  const target = await prisma.user.findUnique({
    where: { id: targetId },
    select: { id: true, role: true },
  });

  if (!target) throw new NotFoundError('That customer could not be found.');

  if (targetId === actor.id && nextRole !== actor.role) {
    throw new AuthorizationError('You cannot change your own role.');
  }

  // Only a super administrator may hand out or take away the top role.
  const touchesSuperAdmin = target.role === 'SUPER_ADMIN' || nextRole === 'SUPER_ADMIN';

  if (touchesSuperAdmin && actor.role !== 'SUPER_ADMIN') {
    throw new AuthorizationError('Only a super administrator can change that role.');
  }

  const user = await prisma.user.update({
    where: { id: targetId },
    data: { role: nextRole as never },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      role: true,
      isActive: true,
      emailVerified: true,
      createdAt: true,
    },
  });

  // A role change must not leave the old privilege level cached in a live token.
  await prisma.refreshToken.updateMany({
    where: { userId: targetId, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  return mapUser(user);
}