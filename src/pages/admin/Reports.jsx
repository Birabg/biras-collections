import { useCallback, useEffect, useState } from 'react';
import { ChevronRight, Loader2, AlertCircle, BarChart3, Package } from 'lucide-react';
import { AdminPageHeader } from '../../components/admin/AdminLayout';
import AdminTable, { StatusPill } from '../../components/admin/AdminTable';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { adminApi } from '../../api/admin';
import { formatPrice } from '../../utils/currency';
import { statusLabel, PAYMENT_STATUS_LABEL } from '../../utils/orderStatus';

/*
 * Reports.
 *
 * Four real endpoints back this screen: sales over time, orders by status and
 * payment, product performance and category mix. The previous version rendered
 * the same placeholder chart for all five report types, including two (delivery
 * performance, returns) that no backend route exists for — those are gone rather
 * than left to render invented numbers.
 *
 * Revenue is scoped to paid orders server-side. Cancelled and unpaid orders show
 * up in the order breakdown with a zero revenue figure, which is the honest
 * reading: the order happened, the money did not.
 */

const REPORTS = [
  {
    key: 'sales',
    label: 'Sales by period',
    description: 'Revenue, order count and average order value over time.',
  },
  {
    key: 'orders',
    label: 'Order breakdown',
    description: 'Every order by fulfilment and payment status.',
  },
  {
    key: 'products',
    label: 'Product performance',
    description: 'Best and slowest selling lines by revenue.',
  },
  {
    key: 'categories',
    label: 'Category mix',
    description: 'Share of revenue by category.',
  },
];

const INTERVALS = [
  { value: 'day', label: 'Daily' },
  { value: 'week', label: 'Weekly' },
  { value: 'month', label: 'Monthly' },
];

function isoDay(date) {
  // `toISOString` on a date-only input shifts by the local offset, which moves
  // the range by a day either side of midnight. Formatting the local parts is
  // what the user actually typed.
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function defaultRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 29);
  return { from: isoDay(from), to: isoDay(to) };
}

export default function AdminReports() {
  const [selected, setSelected] = useState('sales');
  const active = REPORTS.find((report) => report.key === selected);

  const [range, setRange] = useState(defaultRange);
  const [interval, setInterval] = useState('day');

  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    // The schema wants datetimes. `to` is inclusive on the backend, so it is
    // pushed to the end of the chosen day or the last day is dropped.
    const params = {
      from: range.from ? new Date(`${range.from}T00:00:00`).toISOString() : undefined,
      to: range.to ? new Date(`${range.to}T23:59:59.999`).toISOString() : undefined,
    };

    try {
      switch (selected) {
        case 'sales':
          setData(await adminApi.salesReport({ ...params, interval }));
          break;
        case 'orders':
          setData(await adminApi.ordersReport(params));
          break;
        case 'products':
          setData(await adminApi.productsReport({ ...params, limit: 10 }));
          break;
        case 'categories':
          setData(await adminApi.categoriesReport(params));
          break;
        default:
          setData(null);
      }
    } catch (err) {
      setLoadError(err);
    } finally {
      setIsLoading(false);
    }
  }, [selected, range.from, range.to, interval]);

  useEffect(() => {
    load();
  }, [load]);

  const presets = [
    { label: '7 days', days: 7 },
    { label: '30 days', days: 30 },
    { label: '90 days', days: 90 },
  ];

  const series = data?.series ?? [];
  const max = Math.max(...series.map((point) => point.revenue), 1);

  return (
    <>
      <AdminPageHeader
        title="Reports"
        description="Aggregated in the database. Revenue counts orders that were actually paid for."
      />

      <div className="grid gap-4 lg:grid-cols-[18rem_1fr]">
        <nav aria-label="Available reports">
          <ul className="flex flex-col gap-1">
            {REPORTS.map((report) => (
              <li key={report.key}>
                <button
                  type="button"
                  onClick={() => setSelected(report.key)}
                  aria-current={selected === report.key ? 'true' : undefined}
                  className={`group flex w-full items-center gap-3 border px-4 py-3 text-left transition-colors ${
                    selected === report.key
                      ? 'border-ink bg-paper'
                      : 'border-line bg-paper/60 hover:border-ink-25 hover:bg-paper'
                  }`}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-[0.8125rem] font-medium text-ink">{report.label}</span>
                    <span className="mt-0.5 block text-[0.75rem] leading-relaxed text-ink-40">
                      {report.description}
                    </span>
                  </span>
                  <ChevronRight
                    size={15}
                    strokeWidth={1.75}
                    className="shrink-0 text-ink-25 transition-transform duration-200 group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <section className="border border-line bg-paper p-6" aria-labelledby="report-heading">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 id="report-heading" className="text-sm font-semibold text-ink">
                {active.label}
              </h2>
              <p className="mt-1 text-[0.8125rem] text-ink-60">{active.description}</p>
            </div>

            {selected === 'sales' && (
              <Select
                label="Interval"
                value={interval}
                onChange={(event) => setInterval(event.target.value)}
                className="w-32"
                aria-label="Grouping interval"
              >
                {INTERVALS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            )}
          </div>

          {/* Date range */}
          <div className="mt-6 flex flex-wrap items-end gap-3 border-y border-line-soft py-4">
            <div className="w-36">
              <Input
                type="date"
                label="From"
                value={range.from}
                max={range.to || undefined}
                onChange={(event) => setRange((prev) => ({ ...prev, from: event.target.value }))}
              />
            </div>
            <div className="w-36">
              <Input
                type="date"
                label="To"
                value={range.to}
                min={range.from || undefined}
                onChange={(event) => setRange((prev) => ({ ...prev, to: event.target.value }))}
              />
            </div>

            <div className="flex gap-1">
              {presets.map((preset) => (
                <Button
                  key={preset.days}
                  size="sm"
                  variant="tertiary"
                  onClick={() => {
                    const to = new Date();
                    const from = new Date();
                    from.setDate(from.getDate() - (preset.days - 1));
                    setRange({ from: isoDay(from), to: isoDay(to) });
                  }}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="flex h-56 items-center justify-center">
              <Loader2 size={24} className="animate-spin text-ink-25" aria-label="Building the report" />
            </div>
          ) : loadError ? (
            <div className="flex flex-col items-center gap-4 py-12 text-center">
              <AlertCircle size={24} className="text-error" aria-hidden="true" />
              <div>
                <p className="font-medium text-ink">The report could not be built</p>
                <p className="mt-1 text-[0.8125rem] text-ink-60">{loadError.message}</p>
              </div>
              <Button size="sm" variant="secondary" onClick={load}>
                Try again
              </Button>
            </div>
          ) : selected === 'sales' ? (
            <div className="mt-6">
              <dl className="grid gap-3 sm:grid-cols-3">
                {[
                  { label: 'Revenue', value: formatPrice(data?.totals?.revenue ?? 0) },
                  { label: 'Orders', value: String(data?.totals?.orders ?? 0) },
                  { label: 'Average order', value: formatPrice(data?.totals?.averageOrderValue ?? 0) },
                ].map((item) => (
                  <div key={item.label} className="border border-line bg-sand/40 px-4 py-3">
                    <dt className="t-eyebrow text-ink-40">{item.label}</dt>
                    <dd className="mt-1.5 text-lg font-medium tabular-nums text-ink">{item.value}</dd>
                  </div>
                ))}
              </dl>

              {series.length === 0 ? (
                <p className="mt-8 py-10 text-center text-[0.8125rem] text-ink-40">
                  No revenue in this period.
                </p>
              ) : (
                <div
                  className="mt-8 flex h-56 items-end gap-1.5"
                  role="img"
                  aria-label={`Revenue over ${series.length} ${interval} periods, peaking at ${formatPrice(max)}`}
                >
                  {series.map((point) => (
                    <div key={point.date} className="flex flex-1 flex-col items-center gap-2">
                      <div
                        className="w-full bg-ink/80 transition-[height,background-color] duration-300 hover:bg-ink"
                        style={{ height: `${Math.max((point.revenue / max) * 100, 1)}%` }}
                        title={`${point.label}: ${formatPrice(point.revenue)} · ${point.orders} order${point.orders === 1 ? '' : 's'}`}
                      />
                      <span className="text-[0.625rem] text-ink-40">{point.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : selected === 'orders' ? (
            (data?.length ?? 0) === 0 ? (
              <p className="mt-8 py-10 text-center text-[0.8125rem] text-ink-40">
                No orders in this period.
              </p>
            ) : (
              <div className="mt-6">
                <AdminTable
                  rows={data}
                  rowKey={(row) => `${row.status}-${row.paymentStatus}`}
                  caption="Orders by status"
                  columns={[
                    {
                      key: 'status',
                      header: 'Fulfilment',
                      render: (row) => <StatusPill value={statusLabel(row.status)} />,
                    },
                    {
                      key: 'paymentStatus',
                      header: 'Payment',
                      render: (row) => (
                        <StatusPill value={PAYMENT_STATUS_LABEL[row.paymentStatus] ?? row.paymentStatus} />
                      ),
                    },
                    {
                      key: 'count',
                      header: 'Orders',
                      align: 'right',
                      render: (row) => <span className="tabular-nums">{row.count}</span>,
                    },
                    {
                      key: 'revenue',
                      header: 'Revenue counted',
                      align: 'right',
                      render: (row) => <span className="tabular-nums text-ink">{formatPrice(row.revenue)}</span>,
                    },
                  ]}
                />
                <p className="mt-4 flex items-start gap-2 text-[0.75rem] leading-relaxed text-ink-40">
                  <BarChart3 size={14} strokeWidth={1.75} className="mt-px shrink-0" aria-hidden="true" />
                  Orders that were cancelled or never paid for appear here with no revenue counted.
                </p>
              </div>
            )
          ) : selected === 'products' ? (
            (data?.top?.length ?? 0) === 0 ? (
              <p className="mt-8 py-10 text-center text-[0.8125rem] text-ink-40">
                Nothing sold in this period.
              </p>
            ) : (
              <div className="mt-6 flex flex-col gap-8">
                <section>
                  <h3 className="t-eyebrow mb-3 text-ink-40">Top by revenue</h3>
                  <AdminTable
                    rows={data.top}
                    rowKey={(row) => row.productId}
                    caption="Best sellers"
                    columns={[
                      {
                        key: 'name',
                        header: 'Product',
                        render: (row) => (
                          <span className="flex items-center gap-3">
                            <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden border border-line bg-sand">
                              {row.image ? (
                                <img src={row.image} alt="" className="size-full object-cover" loading="lazy" />
                              ) : (
                                <Package size={14} strokeWidth={1.5} className="text-ink-25" aria-hidden="true" />
                              )}
                            </span>
                            <span className="font-medium text-ink">{row.name}</span>
                          </span>
                        ),
                      },
                      {
                        key: 'unitsSold',
                        header: 'Units',
                        align: 'right',
                        render: (row) => <span className="tabular-nums">{row.unitsSold}</span>,
                      },
                      {
                        key: 'revenue',
                        header: 'Revenue',
                        align: 'right',
                        render: (row) => <span className="tabular-nums text-ink">{formatPrice(row.revenue)}</span>,
                      },
                    ]}
                  />
                </section>

                {data.worst?.length > 0 && (
                  <section>
                    <h3 className="t-eyebrow mb-3 text-ink-40">Slowest selling</h3>
                    <ul className="flex flex-col divide-y divide-line-soft border-y border-line-soft">
                      {data.worst.map((row) => (
                        <li key={row.productId} className="flex items-center justify-between py-2.5 text-[0.8125rem]">
                          <span className="text-ink-60">
                            {data.top.find((p) => p.productId === row.productId)?.name ??
                              row.productId.slice(0, 8)}
                          </span>
                          <span className="tabular-nums text-ink-80">{row.unitsSold} units</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
              </div>
            )
          ) : (data?.length ?? 0) === 0 ? (
            <p className="mt-8 py-10 text-center text-[0.8125rem] text-ink-40">
              No revenue to attribute in this period.
            </p>
          ) : (
            <div className="mt-6 flex flex-col gap-3">
              {data.map((row) => (
                <div key={row.categoryId} className="border border-line px-4 py-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[0.875rem] font-medium text-ink">{row.name}</span>
                    <span className="text-[0.8125rem] tabular-nums text-ink-80">
                      {formatPrice(row.revenue)}
                      <span className="ml-2 text-[0.75rem] text-ink-40">{row.share}%</span>
                    </span>
                  </div>
                  <div
                    className="mt-2 h-1 w-full bg-sand"
                    role="img"
                    aria-label={`${row.name}: ${row.share} percent of revenue`}
                  >
                    <div className="h-full bg-ink" style={{ width: `${Math.min(row.share, 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
