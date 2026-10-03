import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  ArrowDownRight,
  Package,
  ShoppingCart,
  Users,
  AlertTriangle,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { AdminPageHeader } from '../../components/admin/AdminLayout';
import AdminTable, { StatusPill } from '../../components/admin/AdminTable';
import Button from '../../components/ui/Button';
import { useAuth } from '../../auth/AuthContext';
import { PERMISSIONS } from '../../auth/roles';
import { adminApi } from '../../api/admin';
import { formatPrice } from '../../utils/currency';
import { statusLabel, STOCK_LEVEL_LABEL } from '../../utils/orderStatus';

/*
 * Dashboard.
 *
 * Every figure here is aggregated by the database (`adminService.getDashboard`).
 * The previous version rendered invented numbers from `data/adminData.js` and
 * labelled the chart "Placeholder series" while presenting it as revenue.
 */

const KPI_ICONS = {
  revenue: ArrowUpRight,
  orders: ShoppingCart,
  customers: Users,
  inventory: AlertTriangle,
};

export default function AdminDashboard() {
  const { user, roleLabel, can } = useAuth();

  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      setData(await adminApi.dashboard());
    } catch (err) {
      setLoadError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (isLoading) {
    return (
      <div className="flex h-72 items-center justify-center">
        <Loader2 size={26} className="animate-spin text-ink-25" aria-label="Loading the dashboard" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex flex-col items-center gap-4 border border-error/25 bg-error-soft px-6 py-14 text-center">
        <AlertCircle size={24} className="text-error" aria-hidden="true" />
        <div>
          <p className="font-medium text-ink">The dashboard could not be loaded</p>
          <p className="mt-1 text-[0.8125rem] text-ink-60">{loadError.message}</p>
        </div>
        <Button size="sm" variant="secondary" onClick={load}>
          Try again
        </Button>
      </div>
    );
  }

  const series = data?.revenueSeries ?? [];
  const max = Math.max(...series.map((point) => point.revenue), 1);
  const totals = data?.totals ?? {};

  return (
    <>
      <AdminPageHeader
        title={`Good to see you, ${user?.name?.split(' ')[0] ?? 'there'}`}
        description={`Signed in as ${roleLabel}. Revenue counts orders that were actually paid for.`}
        actions={
          can(PERMISSIONS.ORDERS_READ) ? (
            <Link to="/admin/orders">
              <Button size="sm" variant="secondary">
                All orders
              </Button>
            </Link>
          ) : null
        }
      />

      {/* KPIs */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {(data?.kpis ?? []).map((card) => {
          const Icon = KPI_ICONS[card.key] ?? Package;
          // `delta` is null when there is no honest baseline to compare against,
          // so no arrow and no invented percentage.
          const hasDelta = typeof card.delta === 'number';
          const positive = card.delta >= 0;

          return (
            <div key={card.key} className="border border-line bg-paper p-5">
              <div className="flex items-start justify-between">
                <p className="t-eyebrow text-ink-40">{card.label}</p>
                <Icon size={15} strokeWidth={1.75} className="text-ink-25" aria-hidden="true" />
              </div>

              <p className="mt-3 text-2xl font-semibold tracking-tight tabular-nums text-ink">
                {card.key === 'revenue' ? formatPrice(card.value) : card.formatted}
              </p>

              <p className="mt-2 flex flex-wrap items-center gap-1.5 text-[0.75rem]">
                {hasDelta && (
                  <span
                    className={`inline-flex items-center gap-0.5 font-medium ${
                      positive ? 'text-success' : 'text-error'
                    }`}
                  >
                    {positive ? (
                      <ArrowUpRight size={12} strokeWidth={2.25} aria-hidden="true" />
                    ) : (
                      <ArrowDownRight size={12} strokeWidth={2.25} aria-hidden="true" />
                    )}
                    {positive ? '+' : ''}
                    {card.delta}%
                  </span>
                )}
                <span className="text-ink-40">{card.hint}</span>
              </p>
            </div>
          );
        })}
      </div>

      {/* Revenue + attention */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <section className="border border-line bg-paper p-5 lg:col-span-2" aria-labelledby="revenue-heading">
          <div className="flex items-baseline justify-between">
            <h2 id="revenue-heading" className="text-sm font-semibold text-ink">
              Revenue, last 7 days
            </h2>
            <span className="text-[0.75rem] text-ink-40">
              {formatPrice(series.reduce((sum, point) => sum + point.revenue, 0))} total
            </span>
          </div>

          {series.length === 0 ? (
            <p className="mt-8 py-12 text-center text-[0.8125rem] text-ink-40">
              No revenue recorded in this period.
            </p>
          ) : (
            <div
              className="mt-6 flex h-48 items-end gap-2"
              role="img"
              aria-label={`Daily revenue for the last ${series.length} days, peaking at ${formatPrice(max)}`}
            >
              {series.map((point) => (
                <div key={point.date} className="flex flex-1 flex-col items-center gap-2">
                  <span className="text-[0.6875rem] tabular-nums text-ink-40">
                    {point.revenue === 0 ? '—' : (point.revenue / 1000).toFixed(0) + 'k'}
                  </span>
                  <div
                    className="w-full bg-ink transition-[height,background-color] duration-300 hover:bg-ink-80"
                    style={{ height: `${Math.max((point.revenue / max) * 100, 1)}%` }}
                    title={`${point.label}: ${formatPrice(point.revenue)} across ${point.orders} order${point.orders === 1 ? '' : 's'}`}
                  />
                  <span className="text-[0.6875rem] text-ink-40">{point.label}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="border border-line bg-paper p-5" aria-labelledby="attention-heading">
          <h2 id="attention-heading" className="text-sm font-semibold text-ink">
            Attention needed
          </h2>

          <ul className="mt-4 flex flex-col divide-y divide-line-soft">
            {[
              { label: 'Orders awaiting fulfilment', value: totals.pendingOrders ?? 0 },
              { label: 'Products needing restock', value: totals.lowStockProducts ?? 0 },
              { label: 'Active products', value: totals.products ?? 0 },
              { label: 'Registered customers', value: totals.customers ?? 0 },
            ].map((row) => (
              <li key={row.label} className="flex items-center justify-between py-3">
                <span className="text-[0.8125rem] text-ink-60">{row.label}</span>
                <span className="text-[0.8125rem] font-semibold tabular-nums text-ink">
                  {row.value}
                </span>
              </li>
            ))}
          </ul>

          <Link
            to="/admin/inventory"
            className="mt-4 inline-flex items-center gap-1.5 text-[0.75rem] font-medium text-ink transition-colors hover:text-ink-60"
          >
            Review inventory
            <ArrowUpRight size={13} strokeWidth={2} aria-hidden="true" />
          </Link>
        </section>
      </div>

      {/* Low stock */}
      {data?.lowStockAlerts?.length > 0 && (
        <section className="mt-4 border border-warning/25 bg-warning-soft px-5 py-4" aria-labelledby="low-stock-heading">
          <h2 id="low-stock-heading" className="flex items-center gap-2 text-sm font-semibold text-ink">
            <AlertTriangle size={15} strokeWidth={1.75} className="text-warning" aria-hidden="true" />
            {data.lowStockAlerts.length} variant{data.lowStockAlerts.length === 1 ? '' : 's'} at or
            below threshold
          </h2>

          <ul className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2">
            {data.lowStockAlerts.slice(0, 6).map((alert) => (
              <li key={alert.id} className="flex items-center justify-between gap-3 text-[0.8125rem]">
                <span className="min-w-0 truncate text-ink-80">
                  {alert.product?.name}
                  {[alert.size, alert.color].filter(Boolean).length > 0 && (
                    <span className="text-ink-40">
                      {' '}
                      · {[alert.size, alert.color].filter(Boolean).join(' / ')}
                    </span>
                  )}
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <span
                    className={`font-medium tabular-nums ${
                      alert.level === 'out_of_stock' ? 'text-error' : 'text-warning'
                    }`}
                  >
                    {alert.stockQuantity}
                  </span>
                  <span className="text-[0.6875rem] uppercase tracking-[0.1em] text-ink-40">
                    {STOCK_LEVEL_LABEL[alert.level]}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Recent orders */}
      {can(PERMISSIONS.ORDERS_READ) && data?.recentOrders?.length > 0 && (
        <section className="mt-4" aria-labelledby="recent-orders-heading">
          <h2 id="recent-orders-heading" className="mb-3 text-sm font-semibold text-ink">
            Recent orders
          </h2>

          <AdminTable
            rows={data.recentOrders}
            rowKey={(row) => row.id}
            caption="Recent orders"
            columns={[
              {
                key: 'orderNumber',
                header: 'Order',
                render: (row) => <span className="font-medium text-ink">{row.orderNumber}</span>,
              },
              {
                key: 'customer',
                header: 'Customer',
                render: (row) => (
                  <span className="flex flex-col">
                    <span>{row.customer}</span>
                    <span className="text-[0.75rem] text-ink-40">{row.email}</span>
                  </span>
                ),
              },
              {
                key: 'date',
                header: 'Placed',
                render: (row) => (
                  <span className="text-ink-60">
                    {new Date(row.date).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                ),
              },
              {
                key: 'items',
                header: 'Items',
                render: (row) => <span className="tabular-nums">{row.items}</span>,
              },
              {
                key: 'total',
                header: 'Total',
                render: (row) => <span className="tabular-nums">{formatPrice(row.total)}</span>,
              },
              {
                key: 'status',
                header: 'Status',
                render: (row) => <StatusPill value={statusLabel(row.status)} />,
              },
            ]}
          />
        </section>
      )}

      {/* Best sellers */}
      {data?.topProducts?.length > 0 && (
        <section className="mt-4" aria-labelledby="top-products-heading">
          <h2 id="top-products-heading" className="mb-3 text-sm font-semibold text-ink">
            Best sellers by revenue
          </h2>

          <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.topProducts.map((product) => (
              <li
                key={product.productId}
                className="flex items-center gap-3 border border-line bg-paper p-3"
              >
                <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden border border-line bg-sand">
                  {product.image ? (
                    <img src={product.image} alt="" className="size-full object-cover" loading="lazy" />
                  ) : (
                    <Package size={15} strokeWidth={1.5} className="text-ink-25" aria-hidden="true" />
                  )}
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-[0.875rem] font-medium text-ink">{product.name}</span>
                  <span className="text-[0.75rem] text-ink-40">
                    {product.unitsSold} sold · {formatPrice(product.revenue)}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}
    </>
  );
}
