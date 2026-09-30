import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Minus, Trash2, ArrowLeft, ChevronRight, ShoppingBag, Truck } from 'lucide-react';
import { formatPrice } from '../utils/currency';
import { useCart } from '../context/CartContext';
import { useToast } from '../components/ui/Toast';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';

const FREE_DELIVERY_THRESHOLD = 5000;

export default function Cart() {
  const { cart, getSubtotal, updateQuantity, removeItem, clearCart } = useCart();
  const toast = useToast();
  const navigate = useNavigate();

  const [isClearOpen, setIsClearOpen] = useState(false);

  const subtotal = getSubtotal();
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const remainingForFreeDelivery = Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal);

  const setQuantity = (item, next) => {
    const clamped = Math.max(1, next);
    updateQuantity(item.id, clamped, item.selectedSize, item.selectedColor);
  };

  const handleRemove = (item) => {
    removeItem(item.id, item.selectedSize, item.selectedColor);
    toast.success('Removed from bag', { message: `${item.name} removed from your bag` });
  };

  const handleClear = () => {
    clearCart();
    setIsClearOpen(false);
    toast.success('Bag cleared', { message: 'All items removed from your bag' });
  };

  if (cart.length === 0) {
    return (
      <div className="shell section-y">
        <EmptyState
          icon={ShoppingBag}
          title="Your bag is empty"
          description="Nothing here yet. Have a look through the collection — most pieces restock quickly."
          actionLabel="Continue shopping"
          onAction={() => navigate('/shop')}
        />
      </div>
    );
  }

  return (
    <>
      <header className="border-b border-line">
        <div className="shell py-10 lg:py-14">
          <p className="t-eyebrow text-ink-40">Your selection</p>
          <h1 className="t-page mt-3">Shopping bag</h1>
          <p className="t-body mt-2" role="status" aria-live="polite">
            {itemCount} {itemCount === 1 ? 'item' : 'items'}
          </p>
        </div>
      </header>

      <div className="shell py-10 lg:py-14">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-16">
          {/* Line items */}
          <section aria-label="Bag contents">
            {/* Free-delivery progress */}
            <div className="mb-8 border border-line bg-sand px-5 py-4">
              {remainingForFreeDelivery > 0 ? (
                <>
                  <p className="flex items-start gap-2.5 text-[0.8125rem] leading-relaxed text-ink-60">
                    <Truck size={16} strokeWidth={1.6} className="mt-0.5 shrink-0" aria-hidden="true" />
                    <span>
                      Add {formatPrice(remainingForFreeDelivery)} more for free delivery.
                    </span>
                  </p>
                  <div
                    className="mt-3 h-px w-full bg-line"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={FREE_DELIVERY_THRESHOLD}
                    aria-valuenow={subtotal}
                    aria-label="Progress towards free delivery"
                  >
                    <div
                      className="h-px bg-ink transition-[width] duration-500"
                      style={{
                        width: `${Math.min(100, (subtotal / FREE_DELIVERY_THRESHOLD) * 100)}%`,
                      }}
                    />
                  </div>
                </>
              ) : (
                <p className="flex items-start gap-2.5 text-[0.8125rem] text-ink">
                  <Truck size={16} strokeWidth={1.6} className="mt-0.5 shrink-0" aria-hidden="true" />
                  <span>This order qualifies for free delivery.</span>
                </p>
              )}
            </div>

            <ul role="list" className="flex flex-col divide-y divide-line">
              {cart.map((item) => {
                const key = `${item.id}-${item.selectedSize ?? ''}-${item.selectedColor ?? ''}`;
                const lineTotal = item.price * item.quantity;

                return (
                  <li key={key} className="flex gap-4 py-6 first:pt-0 sm:gap-6">
                    <Link
                      to={`/product/${item.slug}`}
                      className="aspect-[3/4] w-24 shrink-0 overflow-hidden bg-sand sm:w-32"
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        loading="lazy"
                        decoding="async"
                        className="size-full object-cover"
                      />
                    </Link>

                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <h2 className="t-card text-ink">
                            <Link
                              to={`/product/${item.slug}`}
                              className="transition-colors hover:text-ink-60"
                            >
                              {item.name}
                            </Link>
                          </h2>

                          {(item.selectedSize || item.selectedColor) && (
                            <p className="t-caption mt-1.5">
                              {[item.selectedColor, item.selectedSize].filter(Boolean).join(' · ')}
                            </p>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemove(item)}
                          aria-label={`Remove ${item.name} from bag`}
                          className="-mr-1 -mt-1 p-1 text-ink-25 transition-colors hover:text-error"
                        >
                          <Trash2 size={16} strokeWidth={1.6} aria-hidden="true" />
                        </button>
                      </div>

                      <div className="mt-auto flex flex-wrap items-end justify-between gap-4 pt-4">
                        <div className="inline-flex items-center border border-line">
                          <button
                            type="button"
                            onClick={() => setQuantity(item, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            aria-label={`Decrease quantity of ${item.name}`}
                            className="flex size-10 items-center justify-center text-ink-60 transition-colors hover:text-ink disabled:opacity-30"
                          >
                            <Minus size={14} strokeWidth={1.75} aria-hidden="true" />
                          </button>

                          <label htmlFor={`qty-${key}`} className="sr-only">
                            Quantity of {item.name}
                          </label>
                          <input
                            id={`qty-${key}`}
                            type="number"
                            inputMode="numeric"
                            min={1}
                            value={item.quantity}
                            onChange={(event) => {
                              const next = Number.parseInt(event.target.value, 10);
                              if (!Number.isNaN(next)) setQuantity(item, next);
                            }}
                            className="h-10 w-12 border-x border-line text-center text-[0.8125rem] tabular-nums outline-none"
                          />

                          <button
                            type="button"
                            onClick={() => setQuantity(item, item.quantity + 1)}
                            aria-label={`Increase quantity of ${item.name}`}
                            className="flex size-10 items-center justify-center text-ink-60 transition-colors hover:text-ink"
                          >
                            <Plus size={14} strokeWidth={1.75} aria-hidden="true" />
                          </button>
                        </div>

                        <p className="text-[0.9375rem] tabular-nums text-ink">
                          {formatPrice(lineTotal)}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
              <Link
                to="/shop"
                className="link-underline inline-flex items-center gap-2 text-[0.8125rem] text-ink"
              >
                <ArrowLeft size={15} strokeWidth={1.75} aria-hidden="true" />
                Continue shopping
              </Link>

              <button
                type="button"
                onClick={() => setIsClearOpen(true)}
                className="link-underline text-[0.75rem] text-ink-40 hover:text-error"
              >
                Clear bag
              </button>
            </div>
          </section>

          {/* Summary */}
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="border border-line p-6">
              <h2 className="t-eyebrow text-ink-40">Summary</h2>

              <dl className="mt-5 flex flex-col gap-3 text-[0.875rem]">
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-ink-60">Subtotal</dt>
                  <dd className="tabular-nums text-ink">{formatPrice(subtotal)}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-ink-60">Delivery</dt>
                  <dd className="text-right text-ink-40">Calculated at checkout</dd>
                </div>
              </dl>

              <div className="mt-5 flex items-baseline justify-between gap-4 border-t border-line pt-5">
                <dt className="text-[0.9375rem] font-medium text-ink">Total</dt>
                <dd className="text-[1.0625rem] tabular-nums text-ink">{formatPrice(subtotal)}</dd>
              </div>

              <Button
                fullWidth
                size="lg"
                className="mt-6"
                onClick={() => navigate('/checkout')}
                iconRight={<ChevronRight size={15} strokeWidth={2} aria-hidden="true" />}
              >
                Checkout
              </Button>

              <p className="mt-4 text-[0.75rem] leading-relaxed text-ink-40">
                Delivery and any duties are confirmed at checkout based on your region.
              </p>

              <div className="mt-6 border-t border-line pt-5">
                <h3 className="t-eyebrow text-ink-40">Payment methods</h3>
                <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5 text-[0.75rem] text-ink-60">
                  {['Telebirr', 'CBE Birr', 'Chapa', 'Cash on delivery'].map((method) => (
                    <li key={method}>{method}</li>
                  ))}
                </ul>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <Modal
        isOpen={isClearOpen}
        onClose={() => setIsClearOpen(false)}
        title="Clear your bag?"
      >
        <p className="t-body">
          You have {itemCount} {itemCount === 1 ? 'item' : 'items'} in your bag worth{' '}
          {formatPrice(subtotal)}. This cannot be undone.
        </p>

        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={() => setIsClearOpen(false)}>
            Keep items
          </Button>
          <Button variant="danger" onClick={handleClear}>
            Clear bag
          </Button>
        </div>
      </Modal>
    </>
  );
}
