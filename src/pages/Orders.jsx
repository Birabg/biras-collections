import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, ChevronRight, SearchX, ChevronLeft } from 'lucide-react';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import { formatPrice } from '../utils/currency';
import { getProductBySlug } from '../data/products';
import {
  fetchOrders,
  STATUS_META,
  STATUS_TONE_CLASS,
  formatOrderDate,
  orderItemCount,
  ORDER_STATUS,
} from '../data/customerOrders';

/**
 * Resolves the real catalogue image for an order line. Falls back to the
 * product's own image rather than a hard-coded photo, so the thumbnail can
 * never drift from the product page.
 */
function ProductThumb({ slug, name }) {
  const product = getProductBySlug(slug);
  const image = product?.images?.[0] ?? product?.image;

  if (!image) return null;

  return (
    <img
      src={image}
      alt={name}
      loading="lazy"
      decoding="async"
      className="size-full object-cover"
    />
  );
}

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: ORDER_STATUS.PROCESSING, label: STATUS_META[ORDER_STATUS.PROCESSING].label },
  { value: ORDER_STATUS.SHIPPED, label: STATUS_META[ORDER_STATUS.SHIPPED].label },
  { value: ORDER_STATUS.DELIVERED, label: STATUS_META[ORDER_STATUS.DELIVERED].label },
];

export default function Orders() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);

  const PAGE_SIZE = 5;

  useEffect(() => {
    let cancelled = false;
    fetchOrders().then((result) => {
      if (!cancelled) setOrders(result);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = status === 'all' ? orders : orders.filter((order) => order.status === status);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const visible = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // Changing the filter should return the shopper to the first page.
  const changeFilter = (value) => {
    setStatus(value);
    setPage(1);
  };

  return (
    <>
      <header className="border-b border-line">
        <div className="shell py-10 lg:py-14">
          <p className="t-eyebrow text-ink-40">Your account</p>
          <h1 className="t-page mt-3">Orders</h1>
          <p className="t-body mt-2" role="status" aria-live="polite">
            {filtered.length === 0
              ? 'No orders'
              : `${filtered.length} ${filtered.length === 1 ? 'order' : 'orders'}`}
          </p>
        </div>
      </header>

      <div className="shell py-10 lg:py-14">
        {orders.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-b border-line pb-5">
            {FILTERS.map((filter) => {
              const count =
                filter.value === 'all'
                  ? orders.length
                  : orders.filter((order) => order.status === filter.value).length;

              // Hide filters that would always return nothing.
              if (count === 0) return null;

              const isActive = status === filter.value;

              return (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => changeFilter(filter.value)}
                  aria-pressed={isActive}
                  className={`h-9 border px-4 text-[0.75rem] transition-colors ${
                    isActive
                      ? 'border-ink bg-ink text-paper'
                      : 'border-line text-ink-60 hover:border-ink'
                  }`}
                >
                  {filter.label}
                  <span className="ml-1.5 tabular-nums opacity-60">{count}</span>
                </button>
              );
            })}
          </div>
        )}

        {visible.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title={status === 'all' ? 'No orders yet' : `No ${STATUS_META[status]?.label.toLowerCase()} orders`}
            description={
              status === 'all'
                ? 'When you place an order it will appear here with its status and tracking.'
                : 'Try a different status filter to see your other orders.'
            }
            actionLabel={status === 'all' ? 'Browse the collection' : undefined}
            onAction={status === 'all' ? () => navigate('/shop') : undefined}
          />
        ) : (
          <>
            <ul className="mt-8 flex flex-col gap-5">
              {visible.map((order) => {
                const meta = STATUS_META[order.status];
                const count = orderItemCount(order);

                return (
                  <li key={order.id} className="border border-line">
                    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-line bg-sand/50 px-5 py-4">
                      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                        <h2 className="text-[0.9375rem] font-medium text-ink">{order.id}</h2>
                        <p className="text-[0.8125rem] text-ink-40">
                          Placed {formatOrderDate(order.placedAt)}
                        </p>
                      </div>

                      <span
                        className={`px-2.5 py-1 text-[0.6875rem] font-medium uppercase tracking-[0.1em] ${STATUS_TONE_CLASS[meta.tone]}`}
                      >
                        {meta.label}
                      </span>
                    </div>

                    <div className="px-5 py-5">
                      <ul className="flex flex-col gap-4 sm:flex-row sm:flex-wrap">
                        {order.items.map((item) => (
                          <li key={`${order.id}-${item.slug}-${item.size}`} className="min-w-0">
                            <Link
                              to={`/product/${item.slug}`}
                              className="group flex items-center gap-3"
                            >
                              <span className="block h-20 w-16 shrink-0 overflow-hidden bg-sand">
                                <ProductThumb slug={item.slug} name={item.name} />
                              </span>
                              <span className="min-w-0">
                                <span className="block truncate text-[0.875rem] text-ink group-hover:text-ink-60">
                                  {item.name}
                                </span>
                                <span className="t-caption">
                                  {[item.color, item.size, `Qty ${item.quantity}`]
                                    .filter(Boolean)
                                    .join(' · ')}
                                </span>
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>

                      <div className="mt-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-t border-line pt-4">
                        <p className="t-caption">
                          {count} {count === 1 ? 'item' : 'items'} ·{' '}
                          {order.delivery === 0 ? 'Free delivery' : `${formatPrice(order.delivery)} delivery`}
                        </p>

                        <div className="flex items-center gap-6">
                          <p className="text-[1.0625rem] tabular-nums text-ink">
                            {formatPrice(order.total)}
                          </p>
                          <Link
                            to={`/account/orders/${order.id}`}
                            className="link-underline inline-flex items-center gap-1.5 text-[0.8125rem] text-ink"
                          >
                            View details
                            <ChevronRight size={14} strokeWidth={2} aria-hidden="true" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            {pageCount > 1 && (
              <nav
                className="mt-10 flex items-center justify-center gap-3"
                aria-label="Order pages"
              >
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={safePage === 1}
                  aria-label="Previous page"
                  iconLeft={<ChevronLeft size={14} strokeWidth={2} aria-hidden="true" />}
                >
                  Prev
                </Button>

                <p className="t-caption tabular-nums" aria-live="polite">
                  Page {safePage} of {pageCount}
                </p>

                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setPage((prev) => Math.min(pageCount, prev + 1))}
                  disabled={safePage === pageCount}
                  aria-label="Next page"
                  iconRight={<ChevronRight size={14} strokeWidth={2} aria-hidden="true" />}
                >
                  Next
                </Button>
              </nav>
            )}
          </>
        )}

        <div className="mt-10 border-t border-line pt-8">
          <Button
            variant="secondary"
            onClick={() => navigate('/shop')}
            iconLeft={<Package size={15} strokeWidth={1.75} aria-hidden="true" />}
          >
            Continue shopping
          </Button>
        </div>
      </div>
    </>
  );
}
