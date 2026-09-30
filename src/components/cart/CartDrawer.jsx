import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { X, Minus, Plus, ShoppingBag, ArrowRight, Trash2 } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useUI } from '../../context/UIContext';
import { useToast } from '../ui/Toast';
import { formatPrice } from '../../utils/currency';
import Button from '../ui/Button';
import EmptyState from '../ui/EmptyState';

const FREE_DELIVERY_THRESHOLD = 5000;

function QuantityStepper({ item, onChange }) {
  return (
    <div className="inline-flex h-9 items-stretch border border-line" role="group" aria-label={`Quantity for ${item.name}`}>
      <button
        type="button"
        onClick={() => onChange(item.quantity - 1)}
        className="flex w-9 items-center justify-center text-ink-60 transition-colors hover:bg-sand hover:text-ink"
        aria-label={`Decrease quantity of ${item.name}`}
      >
        <Minus size={13} strokeWidth={2} />
      </button>

      <span className="flex w-9 items-center justify-center border-x border-line text-[0.8125rem] tabular-nums text-ink">
        {item.quantity}
      </span>

      <button
        type="button"
        onClick={() => onChange(item.quantity + 1)}
        className="flex w-9 items-center justify-center text-ink-60 transition-colors hover:bg-sand hover:text-ink"
        aria-label={`Increase quantity of ${item.name}`}
      >
        <Plus size={13} strokeWidth={2} />
      </button>
    </div>
  );
}

export default function CartDrawer() {
  const { isCartOpen, closeCart } = useUI();
  const { cart, getItemCount, getSubtotal, updateQuantity, removeItem } = useCart();
  const toast = useToast();
  const panelRef = useRef(null);

  const count = getItemCount();
  const subtotal = getSubtotal();
  const remaining = Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal);
  const qualifiesFree = subtotal >= FREE_DELIVERY_THRESHOLD;

  // Lock scroll, close on Escape, restore focus
  useEffect(() => {
    if (!isCartOpen) return undefined;

    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    const onKey = (event) => {
      if (event.key === 'Escape') closeCart();
    };
    document.addEventListener('keydown', onKey);

    const raf = requestAnimationFrame(() => panelRef.current?.focus());

    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', onKey);
      cancelAnimationFrame(raf);
    };
  }, [isCartOpen, closeCart]);

  if (!isCartOpen) return null;

  const handleQuantity = (item, quantity) => {
    updateQuantity(item.id, quantity, item.selectedSize, item.selectedColor);
  };

  const handleRemove = (item) => {
    removeItem(item.id, item.selectedSize, item.selectedColor);
    toast.success('Removed from bag', { message: `${item.name} removed from your bag` });
  };

  return (
    <div className="fixed inset-0 z-[75]">
      <div
        className="absolute inset-0 bg-ink/40 animate-fade-in"
        onClick={closeCart}
        aria-hidden="true"
      />

      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping bag"
        tabIndex={-1}
        className="absolute inset-y-0 right-0 flex w-full max-w-[26rem] flex-col bg-paper outline-none animate-slide-left"
      >
        {/* Header */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-5">
          <h2 className="flex items-baseline gap-2 text-[0.9375rem] font-medium text-ink">
            Your Bag
            <span className="text-[0.8125rem] tabular-nums text-ink-40">
              {count} {count === 1 ? 'item' : 'items'}
            </span>
          </h2>

          <button
            type="button"
            onClick={closeCart}
            aria-label="Close bag"
            className="-mr-2 p-2 text-ink-40 transition-colors hover:text-ink"
          >
            <X size={20} strokeWidth={1.6} />
          </button>
        </div>

        {cart.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            title="Your bag is empty"
            description="Explore the collection and save the pieces you love here."
            actionLabel="Explore Collection"
            onAction={closeCart}
            className="flex-1 py-16"
          />
        ) : (
          <>
            {/* Free delivery progress */}
            <div className="shrink-0 border-b border-line bg-sand px-5 py-3">
              <p className="text-[0.75rem] text-ink-60">
                {qualifiesFree ? (
                  <>
                    <span className="font-medium text-ink">Free delivery unlocked.</span> Nice
                    choice.
                  </>
                ) : (
                  <>
                    Add <span className="font-medium text-ink">{formatPrice(remaining)}</span> more
                    for free delivery.
                  </>
                )}
              </p>

              <div className="mt-2 h-px w-full bg-line" role="presentation">
                <div
                  className="h-px bg-ink transition-[width] duration-500"
                  style={{
                    width: `${Math.min(100, (subtotal / FREE_DELIVERY_THRESHOLD) * 100)}%`,
                  }}
                />
              </div>
            </div>

            {/* Items */}
            <ul className="min-h-0 flex-1 divide-y divide-line-soft overflow-y-auto">
              {cart.map((item) => (
                <li key={`${item.id}-${item.selectedSize}-${item.selectedColor}`} className="flex gap-4 px-5 py-5">
                  <Link
                    to={`/product/${item.slug}`}
                    onClick={closeCart}
                    className="size-24 shrink-0 overflow-hidden bg-sand"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="size-full object-cover"
                      loading="lazy"
                    />
                  </Link>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <Link
                        to={`/product/${item.slug}`}
                        onClick={closeCart}
                        className="text-[0.875rem] leading-snug text-ink transition-colors hover:text-ink-60"
                      >
                        {item.name}
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleRemove(item)}
                        aria-label={`Remove ${item.name} from bag`}
                        className="-mr-1 -mt-1 shrink-0 p-1 text-ink-25 transition-colors hover:text-error"
                      >
                        <Trash2 size={15} strokeWidth={1.75} />
                      </button>
                    </div>

                    {(item.selectedSize || item.selectedColor) && (
                      <p className="mt-1 text-[0.75rem] text-ink-40">
                        {[item.selectedSize, item.selectedColor].filter(Boolean).join(' · ')}
                      </p>
                    )}

                    <div className="mt-auto flex items-center justify-between gap-3 pt-3">
                      <QuantityStepper item={item} onChange={(quantity) => handleQuantity(item, quantity)} />
                      <span className="text-[0.875rem] tabular-nums text-ink">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {/* Summary */}
            <div className="shrink-0 border-t border-line px-5 py-5">
              <dl className="flex items-baseline justify-between">
                <dt className="text-[0.8125rem] text-ink-60">Subtotal</dt>
                <dd className="text-[1.0625rem] tabular-nums text-ink">
                  {formatPrice(subtotal)}
                </dd>
              </dl>

              <p className="mt-1.5 text-[0.75rem] text-ink-40">
                Delivery and taxes calculated at checkout.
              </p>

              <div className="mt-5 flex flex-col gap-2">
                <Link to="/checkout" onClick={closeCart} className="block">
                  <Button size="lg" fullWidth iconRight={<ArrowRight size={15} strokeWidth={2} />}>
                    Checkout
                  </Button>
                </Link>

                <Link to="/cart" onClick={closeCart} className="block">
                  <Button size="lg" fullWidth variant="secondary">
                    View Bag
                  </Button>
                </Link>
              </div>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
