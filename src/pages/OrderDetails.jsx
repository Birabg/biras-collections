import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Package,
  MapPin,
  CreditCard,
  Check,
  Circle,
  RotateCcw,
  LifeBuoy,
} from 'lucide-react';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import { formatPrice } from '../utils/currency';
import { getProductBySlug } from '../data/products';
import {
  fetchOrderById,
  STATUS_META,
  STATUS_TONE_CLASS,
  formatOrderDate,
  formatOrderDateTime,
  orderItemCount,
  orderMilestones,
} from '../data/customerOrders';

function Panel({ title, icon: Icon, children }) {
  return (
    <section className="border border-line p-6">
      {title && (
        <h2 className="t-eyebrow flex items-center gap-2.5 text-ink-40">
          {Icon && <Icon size={15} strokeWidth={1.6} aria-hidden="true" />}
          {title}
        </h2>
      )}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function OrderThumb({ slug }) {
  const product = getProductBySlug(slug);
  const image = product?.images?.[0] ?? product?.image;
  if (!image) return null;

  return (
    <img
      src={image}
      alt=""
      loading="lazy"
      decoding="async"
      className="size-full object-cover"
    />
  );
}

export default function OrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  /*
   * The two states this can be in are "still resolving" (undefined) and
   * "resolved" (an order or null), so an in-flight request needs its own flag
   * rather than reusing the order value.
   */
  const [request, setRequest] = useState({ id, order: undefined, isLoading: true });

  useEffect(() => {
    let cancelled = false;

    fetchOrderById(id).then((order) => {
      if (!cancelled) setRequest({ id, order, isLoading: false });
    });

    return () => {
      cancelled = true;
    };
  }, [id]);

  // Ignore a response that arrived after the shopper moved to another order.
  const order = request.id === id ? request.order : undefined;
  const isLoading = request.id === id && request.isLoading;

  if (isLoading) {
    return (
      <div className="shell py-20">
        <p className="t-body" role="status">
          Loading order…
        </p>
      </div>
    );
  }

  if (order === null) {
    return (
      <div className="shell section-y">
        <EmptyState
          icon={Package}
          title="Order not found"
          description={`We could not find an order with the reference ${id}.`}
          actionLabel="View all orders"
          onAction={() => navigate('/account/orders')}
        />
      </div>
    );
  }

  const meta = STATUS_META[order.status];
  const milestones = orderMilestones(order);
  const count = orderItemCount(order);
  const isFinal = ['delivered', 'cancelled', 'returned'].includes(order.status);

  return (
    <>
      <header className="border-b border-line">
        <div className="shell py-8 lg:py-12">
          <Link
            to="/account/orders"
            className="link-underline inline-flex items-center gap-1.5 text-[0.8125rem] text-ink-60"
          >
            <ChevronLeft size={14} strokeWidth={2} aria-hidden="true" />
            All orders
          </Link>

          <div className="mt-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
            <div>
              <p className="t-eyebrow text-ink-40">Order {order.id}</p>
              <h1 className="t-page mt-3">Order details</h1>
              <p className="t-body mt-2">
                Placed {formatOrderDateTime(order.placedAt)}
              </p>
            </div>

            <span
              className={`px-3 py-1.5 text-[0.6875rem] font-medium uppercase tracking-[0.1em] ${STATUS_TONE_CLASS[meta.tone]}`}
            >
              {meta.label}
            </span>
          </div>
        </div>
      </header>

      <div className="shell py-10 lg:py-14">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-10">
          <div className="min-w-0 space-y-8">
            {/* Progress */}
            <section aria-labelledby="progress-heading">
              <h2 id="progress-heading" className="sr-only">
                Order progress
              </h2>

              {isFinal && order.status === 'delivered' ? (
                <div className="flex items-start gap-3 border border-success/25 bg-success-soft px-5 py-4">
                  <Check size={16} strokeWidth={2} className="mt-0.5 shrink-0 text-success" aria-hidden="true" />
                  <p className="text-[0.875rem] leading-relaxed text-success">
                    Delivered {formatOrderDate(order.estimatedDelivery)}. Returns are open for 14 days
                    from delivery.
                  </p>
                </div>
              ) : (
                <ol className="flex flex-col gap-0">
                  {milestones.map((step, index) => (
                    <li key={step.status} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <span
                          className={`flex size-8 shrink-0 items-center justify-center rounded-full border ${
                            step.done ? 'border-ink bg-ink text-paper' : 'border-line text-ink-25'
                          }`}
                          aria-hidden="true"
                        >
                          {step.done ? (
                            <Check size={14} strokeWidth={2.5} />
                          ) : (
                            <Circle size={8} strokeWidth={2} />
                          )}
                        </span>
                        {index < milestones.length - 1 && (
                          <span
                            className={`w-px flex-1 ${step.done ? 'bg-ink' : 'bg-line'}`}
                            aria-hidden="true"
                          />
                        )}
                      </div>

                      <div className="pb-7">
                        <p className={`text-[0.875rem] ${step.done ? 'text-ink' : 'text-ink-40'}`}>
                          {step.status}
                        </p>
                        {step.at && (
                          <p className="t-caption mt-0.5">{formatOrderDateTime(step.at)}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </section>

            {/* Items */}
            <section aria-labelledby="items-heading">
              <h2 id="items-heading" className="t-eyebrow text-ink-40">
                Items · {count} {count === 1 ? 'piece' : 'pieces'}
              </h2>

              <ul className="mt-4 flex flex-col divide-y divide-line border-y border-line">
                {order.items.map((item) => (
                  <li key={`${item.slug}-${item.size}-${item.color}`} className="py-4">
                    <Link to={`/product/${item.slug}`} className="group flex items-center gap-4">
                      <span className="block h-24 w-20 shrink-0 overflow-hidden bg-sand">
                        <OrderThumb slug={item.slug} name={item.name} />
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block text-[0.9375rem] text-ink group-hover:text-ink-60">
                          {item.name}
                        </span>
                        <span className="t-caption mt-1 block">
                          {[item.color, item.size].filter(Boolean).join(' · ')}
                        </span>
                        <span className="t-caption mt-0.5 block">
                          {formatPrice(item.price)} × {item.quantity}
                        </span>
                      </span>

                      <span className="shrink-0 text-[0.9375rem] tabular-nums text-ink">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>

            {/* Totals */}
            <Panel title="Totals">
              <dl className="flex flex-col gap-3 text-[0.875rem]">
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-ink-60">Subtotal</dt>
                  <dd className="tabular-nums text-ink">{formatPrice(order.subtotal)}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-ink-60">Delivery</dt>
                  <dd className="tabular-nums text-ink">
                    {order.delivery === 0 ? 'Free' : formatPrice(order.delivery)}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-4 border-t border-line pt-3">
                  <dt className="font-medium text-ink">Total</dt>
                  <dd className="text-[1.0625rem] tabular-nums text-ink">
                    {formatPrice(order.total)}
                  </dd>
                </div>
              </dl>
            </Panel>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            <Panel title="Delivering to" icon={MapPin}>
              <address className="not-italic text-[0.875rem] leading-relaxed text-ink-60">
                <span className="block text-ink">{order.shipping.name}</span>
                <span className="block">{order.shipping.phone}</span>
                <span className="block">{order.shipping.address}</span>
                <span className="block">
                  {order.shipping.city}, {order.shipping.region}
                </span>
              </address>
            </Panel>

            <Panel title="Payment" icon={CreditCard}>
              <p className="text-[0.875rem] text-ink">{order.payment.method}</p>
              {order.payment.reference && (
                <p className="t-caption mt-1 break-all">Reference {order.payment.reference}</p>
              )}
            </Panel>

            {order.trackingNumber && (
              <Panel title="Tracking">
                <p className="break-all text-[0.875rem] text-ink">{order.trackingNumber}</p>
                <p className="t-caption mt-1.5">
                  Estimated {formatOrderDate(order.estimatedDelivery)}
                </p>
              </Panel>
            )}

            <div className="flex flex-col gap-3">
              {order.status === 'delivered' && (
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => navigate('/returns')}
                  iconLeft={<RotateCcw size={15} strokeWidth={1.75} aria-hidden="true" />}
                >
                  Start a return
                </Button>
              )}

              <Button
                variant="secondary"
                fullWidth
                onClick={() => navigate('/shop')}
                iconLeft={<Package size={15} strokeWidth={1.75} aria-hidden="true" />}
              >
                Continue shopping
              </Button>

              <Button
                variant="tertiary"
                fullWidth
                onClick={() => navigate('/contact')}
                iconLeft={<LifeBuoy size={15} strokeWidth={1.75} aria-hidden="true" />}
              >
                Get help
              </Button>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
