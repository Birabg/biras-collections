import { useCallback, useEffect, useState } from 'react';
import {
  Search,
  PackageSearch,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  MapPin,
  CreditCard,
  Phone,
} from 'lucide-react';
import { AdminPageHeader } from '../../components/admin/AdminLayout';
import AdminTable, { StatusPill } from '../../components/admin/AdminTable';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';
import Textarea from '../../components/ui/Textarea';
import EmptyState from '../../components/ui/EmptyState';
import { useToast } from '../../components/ui/Toast';
import { adminApi } from '../../api/admin';
import { formatPrice } from '../../utils/currency';
import { useAuth } from '../../auth/AuthContext';
import { PERMISSIONS } from '../../auth/roles';
import {
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  PAYMENT_STATUS_LABEL,
  PRIMARY_NEXT_STATUS,
  statusLabel,
  nextStatuses,
  isTerminal,
} from '../../utils/orderStatus';

/*
 * Order queue.
 *
 * Status changes are driven by the same transition map the API enforces, so the
 * button offered is always one the server will accept — an order cannot jump
 * from pending straight to delivered, and a delivered or cancelled order offers
 * nothing at all.
 */

const PAGE_SIZE = 20;

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function AdminOrders() {
  const { can } = useAuth();
  const toast = useToast();

  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 0, total: 0 });
  const [summary, setSummary] = useState({});

  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [payment, setPayment] = useState('');
  const [page, setPage] = useState(1);

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [detail, setDetail] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  const [pendingId, setPendingId] = useState(null);
  const [pendingStatus, setPendingStatus] = useState(null);

  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelNote, setCancelNote] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  const canUpdate = can(PERMISSIONS.ORDERS_UPDATE);

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const payload = await adminApi.listOrders({
        page,
        limit: PAGE_SIZE,
        search: query.trim() || undefined,
        status: status || undefined,
        paymentStatus: payment || undefined,
      });

      setRows(payload?.data ?? []);
      setPagination(payload?.pagination ?? { page: 1, totalPages: 0, total: 0 });
      setSummary(payload?.summary ?? {});
    } catch (err) {
      setRows([]);
      setLoadError(err);
    } finally {
      setIsLoading(false);
    }
  }, [page, query, status, payment]);

  useEffect(() => {
    load();
  }, [load]);

  /** Filtering starts a new result set, so page 1 is the only sensible page. */
  const applyFilter = (setter) => (value) => {
    setter(value);
    setPage(1);
  };

  const openDetail = async (row) => {
    setDetail(null);
    setIsDetailOpen(true);
    setIsDetailLoading(true);

    try {
      const order = await adminApi.getOrder(row.id);
      setDetail(order);
    } catch (err) {
      setIsDetailOpen(false);
      toast.error('Could not open the order', { message: err.message });
    } finally {
      setIsDetailLoading(false);
    }
  };

  const move = async (row, nextStatus, note) => {
    setPendingId(row.id);
    setPendingStatus(nextStatus);

    try {
      await adminApi.updateOrderStatus(row.id, { status: nextStatus, note: note || undefined });
      toast.success(`Order ${row.orderNumber} is now ${statusLabel(nextStatus).toLowerCase()}`);
      await load();
    } catch (err) {
      toast.error('Could not update the order', { message: err.message });
    } finally {
      setPendingId(null);
      setPendingStatus(null);
    }
  };

  const confirmCancel = async () => {
    setIsCancelling(true);

    try {
      await move(cancelTarget, 'CANCELLED', cancelNote);
      setCancelTarget(null);
      setCancelNote('');
    } finally {
      setIsCancelling(false);
    }
  };

  /* ---------------------------------------------------------------- render --*/

  const columns = [
    {
      key: 'orderNumber',
      header: 'Order',
      render: (row) => (
        <span className="flex flex-col">
          <span className="font-medium text-ink">{row.orderNumber}</span>
          <span className="text-[0.75rem] text-ink-40">{formatDate(row.placedAt ?? row.createdAt)}</span>
        </span>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (row) => (
        <span className="flex flex-col">
          <span>{row.customer?.name ?? '—'}</span>
          <span className="text-[0.75rem] text-ink-40">{row.customer?.email}</span>
        </span>
      ),
    },
    {
      key: 'items',
      header: 'Items',
      render: (row) => (
        <span className="flex flex-col">
          <span className="tabular-nums">{row.itemCount}</span>
          {row.paymentStatus && (
            <span className="text-[0.75rem] text-ink-40">
              {PAYMENT_STATUS_LABEL[row.paymentStatus] ?? row.paymentStatus}
            </span>
          )}
        </span>
      ),
    },
    {
      key: 'total',
      header: 'Total',
      render: (row) => <span className="font-medium tabular-nums text-ink">{formatPrice(row.total)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <span className="flex flex-wrap gap-1">
          <StatusPill value={statusLabel(row.status)} />
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (row) => {
        const next = PRIMARY_NEXT_STATUS[row.status];

        return (
          <span className="flex items-center justify-end gap-2">
            <Button size="sm" variant="tertiary" onClick={() => openDetail(row)}>
              View
            </Button>

            {canUpdate && next && (
              <Button
                size="sm"
                disabled={pendingId === row.id}
                loading={pendingId === row.id && pendingStatus === next}
                onClick={() => move(row, next)}
              >
                {statusLabel(next)}
              </Button>
            )}

            {canUpdate && nextStatuses(row.status).includes('CANCELLED') && (
              <Button size="sm" variant="tertiary" onClick={() => setCancelTarget(row)}>
                Cancel
              </Button>
            )}
          </span>
        );
      },
    },
  ];

  const showFrom = pagination.total === 0 ? 0 : (pagination.page - 1) * PAGE_SIZE + 1;
  const showTo = Math.min(pagination.page * PAGE_SIZE, pagination.total);

  return (
    <>
      <AdminPageHeader
        title="Orders"
        description="Every order from the storefront, newest first."
        actions={
          <span className="flex flex-wrap gap-4 text-[0.75rem] text-ink-40">
            {Object.entries(summary).map(([key, value]) => (
              <span key={key}>
                {statusLabel(key)}{' '}
                <strong className="font-medium tabular-nums text-ink-80">{value.count}</strong>
              </span>
            ))}
          </span>
        }
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_13rem_13rem]">
        <Input
          type="search"
          value={query}
          onChange={(event) => applyFilter(setQuery)(event.target.value)}
          placeholder="Search order number, name or email"
          icon={<Search size={15} strokeWidth={1.75} />}
          aria-label="Search orders"
        />

        <Select
          value={status}
          onChange={(event) => applyFilter(setStatus)(event.target.value)}
          aria-label="Filter by fulfilment status"
        >
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((option) => (
            <option key={option} value={option}>
              {statusLabel(option)}
            </option>
          ))}
        </Select>

        <Select
          value={payment}
          onChange={(event) => applyFilter(setPayment)(event.target.value)}
          aria-label="Filter by payment status"
        >
          <option value="">All payments</option>
          {PAYMENT_STATUSES.map((option) => (
            <option key={option} value={option}>
              {PAYMENT_STATUS_LABEL[option]}
            </option>
          ))}
        </Select>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 size={26} className="animate-spin text-ink-25" aria-label="Loading orders" />
        </div>
      ) : loadError ? (
        <div className="flex flex-col items-center gap-4 border border-error/25 bg-error-soft px-6 py-12 text-center">
          <AlertCircle size={24} className="text-error" aria-hidden="true" />
          <div>
            <p className="font-medium text-ink">Orders could not be loaded</p>
            <p className="mt-1 text-[0.8125rem] text-ink-60">{loadError.message}</p>
          </div>
          <Button size="sm" variant="secondary" onClick={load}>
            Try again
          </Button>
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={PackageSearch}
          title="No orders match"
          description="Try a different search term, or clear the status filters."
          className="border border-line"
        />
      ) : (
        <>
          <AdminTable rows={rows} rowKey={(row) => row.id} columns={columns} caption="Orders" />

          <div className="mt-5 flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[0.8125rem] text-ink-40">
              {showFrom}–{showTo} of {pagination.total}
            </p>

            {pagination.totalPages > 1 && (
              <nav className="flex items-center gap-3" aria-label="Pagination">
                <Button
                  size="sm"
                  variant="tertiary"
                  iconLeft={<ChevronLeft size={14} strokeWidth={2} />}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={pagination.page <= 1}
                >
                  Previous
                </Button>
                <span className="text-[0.8125rem] text-ink-60">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <Button
                  size="sm"
                  variant="tertiary"
                  iconRight={<ChevronRight size={14} strokeWidth={2} />}
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={pagination.page >= pagination.totalPages}
                >
                  Next
                </Button>
              </nav>
            )}
          </div>
        </>
      )}

      {/* Order detail */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={detail ? `Order ${detail.orderNumber}` : 'Order'}
        size="lg"
      >
        {isDetailLoading || !detail ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 size={24} className="animate-spin text-ink-25" aria-label="Loading order" />
          </div>
        ) : (
          <div className="flex flex-col gap-7">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill value={statusLabel(detail.status)} />
              {detail.paymentStatus && (
                <StatusPill value={PAYMENT_STATUS_LABEL[detail.paymentStatus] ?? detail.paymentStatus} />
              )}
              {isTerminal(detail.status) && (
                <span className="text-[0.75rem] text-ink-40">
                  This order has reached a final state.
                </span>
              )}
            </div>

            <section>
              <h3 className="t-eyebrow mb-3 text-ink-40">Items</h3>
              <ul className="flex flex-col divide-y divide-line-soft border-y border-line-soft">
                {detail.items.map((item) => (
                  <li key={item.id} className="flex items-center gap-4 py-3">
                    <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden border border-line bg-sand">
                      {item.image ? (
                        <img src={item.image} alt="" className="size-full object-cover" loading="lazy" />
                      ) : (
                        <PackageSearch size={16} className="text-ink-25" aria-hidden="true" />
                      )}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate font-medium text-ink">{item.name}</span>
                      <span className="text-[0.75rem] text-ink-40">
                        {[item.size, item.color].filter(Boolean).join(' · ') || item.sku}
                      </span>
                    </span>
                    <span className="shrink-0 text-right text-[0.8125rem] tabular-nums text-ink-60">
                      {item.quantity} × {formatPrice(item.price)}
                      <span className="block font-medium text-ink">{formatPrice(item.subtotal)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="flex justify-end">
              <dl className="w-full max-w-xs flex flex-col gap-1.5 text-[0.8125rem]">
                <div className="flex justify-between">
                  <dt className="text-ink-60">Subtotal</dt>
                  <dd className="tabular-nums text-ink-80">{formatPrice(detail.subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-60">Delivery</dt>
                  <dd className="tabular-nums text-ink-80">
                    {detail.shippingFee > 0 ? formatPrice(detail.shippingFee) : 'Free'}
                  </dd>
                </div>
                {detail.discount > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-ink-60">Discount</dt>
                    <dd className="tabular-nums text-success">−{formatPrice(detail.discount)}</dd>
                  </div>
                )}
                <div className="mt-1 flex justify-between border-t border-line pt-2 font-medium">
                  <dt className="text-ink">Total</dt>
                  <dd className="tabular-nums text-ink">{formatPrice(detail.total)}</dd>
                </div>
              </dl>
            </section>

            <section className="grid gap-5 border-t border-line pt-6 sm:grid-cols-2">
              <div>
                <h3 className="t-eyebrow mb-3 text-ink-40">Deliver to</h3>
                <address className="flex flex-col gap-1 text-[0.8125rem] not-italic text-ink-80">
                  <span className="font-medium text-ink">{detail.shippingAddress?.fullName}</span>
                  {detail.shippingAddress?.phone && (
                    <span className="flex items-center gap-1.5 text-ink-60">
                      <Phone size={13} strokeWidth={1.75} aria-hidden="true" />
                      {detail.shippingAddress.phone}
                    </span>
                  )}
                  <span className="flex items-start gap-1.5 text-ink-60">
                    <MapPin size={13} strokeWidth={1.75} className="mt-1 shrink-0" aria-hidden="true" />
                    <span>
                      {[detail.shippingAddress?.streetAddress, detail.shippingAddress?.kebele]
                        .filter(Boolean)
                        .join(', ')}
                      <br />
                      {[detail.shippingAddress?.subCity, detail.shippingAddress?.city]
                        .filter(Boolean)
                        .join(', ')}
                      {detail.shippingAddress?.region ? `, ${detail.shippingAddress.region}` : ''}
                    </span>
                  </span>
                </address>
              </div>

              <div>
                <h3 className="t-eyebrow mb-3 text-ink-40">Payment</h3>
                {detail.payment ? (
                  <div className="flex flex-col gap-1 text-[0.8125rem] text-ink-80">
                    <span className="flex items-center gap-1.5">
                      <CreditCard size={13} strokeWidth={1.75} aria-hidden="true" />
                      {detail.payment.provider} · {detail.payment.method}
                    </span>
                    <span className="tabular-nums">{formatPrice(detail.payment.amount)}</span>
                    {detail.payment.reference && (
                      <span className="text-[0.75rem] text-ink-40">
                        Reference {detail.payment.reference}
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="text-[0.8125rem] text-ink-40">No payment recorded yet.</p>
                )}

                {detail.customerNote && (
                  <p className="mt-4 border-l-2 border-line pl-3 text-[0.8125rem] text-ink-60">
                    “{detail.customerNote}”
                  </p>
                )}
              </div>
            </section>

            {canUpdate && nextStatuses(detail.status).length > 0 && (
              <div className="flex flex-wrap justify-end gap-3 border-t border-line pt-6">
                {nextStatuses(detail.status).includes('CANCELLED') && (
                  <Button
                    variant="tertiary"
                    onClick={() => {
                      setCancelTarget(detail);
                      setIsDetailOpen(false);
                    }}
                  >
                    Cancel order
                  </Button>
                )}
                {PRIMARY_NEXT_STATUS[detail.status] && (
                  <Button
                    loading={pendingId === detail.id}
                    onClick={() => move(detail, PRIMARY_NEXT_STATUS[detail.status])}
                  >
                    Mark as {statusLabel(PRIMARY_NEXT_STATUS[detail.status]).toLowerCase()}
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Cancellation is destructive: it puts stock back and refunds. */}
      <Modal
        isOpen={Boolean(cancelTarget)}
        onClose={() => {
          if (!isCancelling) {
            setCancelTarget(null);
            setCancelNote('');
          }
        }}
        title={`Cancel ${cancelTarget?.orderNumber ?? 'order'}`}
        size="sm"
      >
        <div className="flex flex-col gap-5">
          <p className="text-[0.875rem] leading-relaxed text-ink-60">
            Cancelling is final. Any stock held for this order is returned to inventory in the same
            operation, and the customer is notified.
          </p>

          <Textarea
            label="Reason"
            value={cancelNote}
            onChange={(event) => setCancelNote(event.target.value)}
            rows={3}
            maxLength={300}
            hint="Optional, but recorded against the order."
            placeholder="Customer changed their mind."
          />

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="tertiary" onClick={() => setCancelTarget(null)} disabled={isCancelling}>
              Keep order
            </Button>
            <Button variant="danger" loading={isCancelling} onClick={confirmCancel}>
              Cancel order
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
