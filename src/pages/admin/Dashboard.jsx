import { Link } from 'react-router-dom';
import { ArrowUpRight, ArrowDownRight, Package, ShoppingCart, Users, RotateCcw } from 'lucide-react';
import { AdminPageHeader } from '../../components/admin/AdminLayout';
import AdminTable, { StatusPill } from '../../components/admin/AdminTable';
import Button from '../../components/ui/Button';
import { useAuth } from '../../auth/AuthContext';
import { PERMISSIONS } from '../../auth/roles';
import { KPI_CARDS, REVENUE_SERIES, ADMIN_ORDERS } from '../../data/adminData';
import { formatPrice } from '../../utils/currency';

const KPI_ICONS = {
  revenue: ArrowUpRight,
  orders: ShoppingCart,
  customers: Users,
  refunds: RotateCcw,
};

const MAX = Math.max(...REVENUE_SERIES.map((point) => point.value));

export default function AdminDashboard() {
  const { user, roleLabel, can } = useAuth();

  return (
    <>
      <AdminPageHeader
        title={`Good to see you, ${user?.name?.split(' ')[0] ?? 'there'}`}
        description={`Signed in as ${roleLabel}. Figures below are placeholder data pending an admin API.`}
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
        {KPI_CARDS.map((card) => {
          const Icon = KPI_ICONS[card.key] ?? Package;
          const positive = card.delta >= 0;

          return (
            <div key={card.key} className="border border-line bg-paper p-5">
              <div className="flex items-start justify-between">
                <p className="t-eyebrow text-ink-40">{card.label}</p>
                <Icon size={15} strokeWidth={1.75} className="text-ink-25" aria-hidden="true" />
              </div>

              <p className="mt-3 text-2xl font-semibold tracking-tight tabular-nums text-ink">
                {card.value}
              </p>

              <p className="mt-2 flex items-center gap-1.5 text-[0.75rem]">
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
                <span className="text-ink-40">{card.hint}</span>
              </p>
            </div>
          );
        })}
      </div>

      {/* Revenue + orders */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <section className="border border-line bg-paper p-5 lg:col-span-2" aria-labelledby="revenue-heading">
          <div className="flex items-baseline justify-between">
            <h2 id="revenue-heading" className="text-sm font-semibold text-ink">
              Revenue this week
            </h2>
            <span className="text-[0.75rem] text-ink-40">Placeholder series</span>
          </div>

          <div className="mt-6 flex h-48 items-end gap-2" role="img" aria-label="Bar chart of placeholder daily revenue">
            {REVENUE_SERIES.map((point) => (
              <div key={point.label} className="flex flex-1 flex-col items-center gap-2">
                <span className="text-[0.6875rem] tabular-nums text-ink-40">
                  {(point.value / 1000).toFixed(0)}k
                </span>
                <div
                  className="w-full bg-ink transition-[height,background-color] duration-300 hover:bg-ink-80"
                  style={{ height: `${Math.round((point.value / MAX) * 100)}%` }}
                />
                <span className="text-[0.6875rem] text-ink-40">{point.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="border border-line bg-paper p-5" aria-labelledby="low-stock-heading">
          <h2 id="low-stock-heading" className="text-sm font-semibold text-ink">
            Attention needed
          </h2>

          <ul className="mt-4 flex flex-col divide-y divide-line-soft">
            {[
              { label: 'Orders awaiting fulfilment', value: '9' },
              { label: 'Refunds to review', value: '3' },
              { label: 'Lines below 10 units', value: '4' },
              { label: 'Failed deliveries', value: '2' },
            ].map((row) => (
              <li key={row.label} className="flex items-center justify-between py-3">
                <span className="text-[0.8125rem] text-ink-60">{row.label}</span>
                <span className="text-[0.8125rem] font-semibold tabular-nums text-ink">{row.value}</span>
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

      {/* Recent orders */}
      {can(PERMISSIONS.ORDERS_READ) && (
        <section className="mt-4" aria-labelledby="recent-orders-heading">
          <h2 id="recent-orders-heading" className="mb-3 text-sm font-semibold text-ink">
            Recent orders
          </h2>

          <AdminTable
            rows={ADMIN_ORDERS.slice(0, 4)}
            columns={[
              {
                key: 'id',
                header: 'Order',
                render: (row) => <span className="font-medium text-ink">{row.id}</span>,
              },
              { key: 'customer', header: 'Customer' },
              { key: 'date', header: 'Date' },
              {
                key: 'total',
                header: 'Total',
                render: (row) => <span className="tabular-nums">{formatPrice(row.total)}</span>,
              },
              { key: 'status', header: 'Status', render: (row) => <StatusPill value={row.status} /> },
            ]}
          />
        </section>
      )}
    </>
  );
}
