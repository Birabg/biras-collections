import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Trash2, X, ShoppingBag } from 'lucide-react';
import { formatPrice } from '../utils/currency';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../components/ui/Toast';
import EmptyState from '../components/ui/EmptyState';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import { getProductById } from '../data/products';

export default function Wishlist() {
  const { wishlist, removeItem, clearWishlist } = useWishlist();
  const { addItem } = useCart();
  const toast = useToast();
  const navigate = useNavigate();

  const [isClearOpen, setIsClearOpen] = useState(false);

  const handleRemove = (id, name) => {
    removeItem(id);
    toast.success('Removed from wishlist', { message: `${name} removed from your wishlist` });
  };

  /*
   * Only move to the bag when the catalogue still has the piece and it has no
   * size choice to make. Otherwise the shopper should open the product first.
   */
  const handleMoveToBag = (item) => {
    const product = getProductById(item.id);

    if (!product) {
      toast.error('No longer available', {
        message: `${item.name} is not in the current catalogue.`,
      });
      return;
    }

    if (product.stock === 0) {
      toast.error('Sold out', { message: `${item.name} is currently out of stock.` });
      return;
    }

    if (product.sizes?.length > 1) {
      toast.info('Choose a size first', {
        message: `Open ${item.name} to pick your size, then it will be in your bag.`,
      });
      return;
    }

    addItem(product, 1, product.sizes?.[0] ?? null, product.colors?.[0]?.name ?? null);
    removeItem(item.id);
    toast.success('Moved to bag', { message: `${item.name} added to your bag` });
  };

  const handleClear = () => {
    clearWishlist();
    setIsClearOpen(false);
    toast.success('Wishlist cleared', { message: 'All saved pieces removed' });
  };

  if (wishlist.length === 0) {
    return (
      <div className="shell section-y">
        <EmptyState
          icon={Heart}
          title="Nothing saved yet"
          description="Tap the heart on any piece to keep it here while you decide."
          actionLabel="Explore the collection"
          onAction={() => navigate('/shop')}
        />
      </div>
    );
  }

  return (
    <>
      <header className="border-b border-line">
        <div className="shell py-10 lg:py-14">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="t-eyebrow text-ink-40">Saved pieces</p>
              <h1 className="t-page mt-3">Wishlist</h1>
              <p className="t-body mt-2" role="status" aria-live="polite">
                {wishlist.length} {wishlist.length === 1 ? 'piece' : 'pieces'} saved
              </p>
            </div>

            <Button
              variant="tertiary"
              size="sm"
              onClick={() => setIsClearOpen(true)}
              iconLeft={<Trash2 size={14} strokeWidth={1.75} aria-hidden="true" />}
            >
              Clear all
            </Button>
          </div>
        </div>
      </header>

      <div className="shell py-10 lg:py-14">
        {/*
          A list, not a card grid: each row exposes its own remove and
          move-to-bag actions instead of hiding them behind hover.
        */}
        <ul role="list" className="flex flex-col divide-y divide-line">
          {wishlist.map((item) => {
            const product = getProductById(item.id);
            const image = product?.images?.[0] ?? product?.image ?? item.image;
            const price = product?.price ?? item.price;
            const compareAtPrice = product?.compareAtPrice ?? item.compareAtPrice;
            const onSale = Boolean(compareAtPrice && compareAtPrice > price);
            const href = product ? `/product/${product.slug}` : '#';

            return (
              <li key={item.id} className="flex gap-4 py-6 first:pt-0 sm:gap-6">
                {product ? (
                  <Link
                    to={href}
                    className="aspect-[3/4] w-24 shrink-0 overflow-hidden bg-sand sm:w-32"
                    tabIndex={-1}
                    aria-hidden="true"
                  >
                    <img
                      src={image}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="size-full object-cover"
                    />
                  </Link>
                ) : (
                  <div className="aspect-[3/4] w-24 shrink-0 bg-sand sm:w-32" aria-hidden="true" />
                )}

                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h2 className="t-card text-ink">
                        {product ? (
                          <Link to={href} className="transition-colors hover:text-ink-60">
                            {item.name}
                          </Link>
                        ) : (
                          item.name
                        )}
                      </h2>

                      {!product && (
                        <p className="t-caption mt-1.5 text-warning">
                          No longer in the catalogue
                        </p>
                      )}

                      {product && product.sizes?.length > 1 && (
                        <p className="t-caption mt-1.5">Size needed before adding</p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemove(item.id, item.name)}
                      aria-label={`Remove ${item.name} from wishlist`}
                      className="-mr-1 -mt-1 p-1 text-ink-25 transition-colors hover:text-error"
                    >
                      <X size={16} strokeWidth={1.6} aria-hidden="true" />
                    </button>
                  </div>

                  <div className="mt-auto flex flex-wrap items-end justify-between gap-4 pt-4">
                    <div className="flex items-baseline gap-2">
                      {onSale && (
                        <span className="text-[0.75rem] text-ink-25 line-through tabular-nums">
                          {formatPrice(compareAtPrice)}
                        </span>
                      )}
                      <span className={`text-[0.9375rem] tabular-nums ${onSale ? 'text-sale' : 'text-ink'}`}>
                        {formatPrice(price)}
                      </span>
                    </div>

                    {product && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleMoveToBag(item)}
                        iconLeft={<ShoppingBag size={14} strokeWidth={1.75} aria-hidden="true" />}
                      >
                        Move to bag
                      </Button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="mt-10 border-t border-line pt-8">
          <Link
            to="/shop"
            className="link-underline text-[0.8125rem] text-ink"
          >
            Keep browsing the collection
          </Link>
        </div>
      </div>

      <Modal isOpen={isClearOpen} onClose={() => setIsClearOpen(false)} title="Clear your wishlist?">
        <p className="t-body">
          This removes all {wishlist.length} saved{' '}
          {wishlist.length === 1 ? 'piece' : 'pieces'}. It cannot be undone.
        </p>

        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={() => setIsClearOpen(false)}>
            Keep them
          </Button>
          <Button variant="danger" onClick={handleClear}>
            Clear wishlist
          </Button>
        </div>
      </Modal>
    </>
  );
}
