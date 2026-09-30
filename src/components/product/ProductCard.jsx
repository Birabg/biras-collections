import { Link } from 'react-router-dom';
import { Heart, Plus } from 'lucide-react';
import { formatPrice } from '../../utils/currency';

/*
 * ProductCard — the image is the product.
 * No card chrome: no border, no shadow, no rounded container.
 *
 * `onToggleWishlist` / `onAddToCart` are optional. When they are not supplied
 * we do NOT render the control, so the card never shows a button that does
 * nothing.
 */
export default function ProductCard({
  product,
  onAddToCart,
  onToggleWishlist,
  inWishlist = false,
  priority = false,
  className = '',
}) {
  const image = product.images?.[0] ?? product.image;
  const badge = product.badge ?? (product.isNew ? 'New' : product.isBestSeller ? 'Bestseller' : null);
  const onSale = Boolean(product.compareAtPrice && product.compareAtPrice > product.price);
  const canWishlist = typeof onToggleWishlist === 'function';
  const canQuickAdd = typeof onAddToCart === 'function';
  const soldOut = product.stock === 0 || product.inStock === false;

  return (
    <article className={`group relative flex flex-col ${className}`}>
      <Link
        to={`/product/${product.slug}`}
        className="relative block overflow-hidden bg-sand focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
      >
        <div className="relative aspect-[3/4] w-full overflow-hidden">
          <img
            src={image}
            alt={product.name}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            className="size-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
          />

          {/* Badges — top left, quiet */}
          <div className="pointer-events-none absolute left-0 top-4 flex flex-col items-start gap-1.5">
            {badge && (
              <span className="bg-paper/95 px-2.5 py-1 text-[0.625rem] font-medium uppercase tracking-[0.16em] text-ink">
                {badge}
              </span>
            )}
            {onSale && (
              <span className="bg-paper/95 px-2.5 py-1 text-[0.625rem] font-medium uppercase tracking-[0.16em] text-sale">
                Sale
              </span>
            )}
            {soldOut && (
              <span className="bg-ink px-2.5 py-1 text-[0.625rem] font-medium uppercase tracking-[0.16em] text-paper">
                Sold out
              </span>
            )}
          </div>

          {/* Quick add — desktop hover, always reachable on touch */}
          {canQuickAdd && !soldOut && (
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onAddToCart(product);
              }}
              className="absolute inset-x-3 bottom-3 hidden h-11 items-center justify-center gap-2 bg-paper/95 text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-ink opacity-0 backdrop-blur-sm transition-[opacity,background-color] duration-300 hover:bg-paper focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink group-hover:opacity-100 md:flex"
              aria-label={`Quick add ${product.name} to bag`}
            >
              <Plus size={14} strokeWidth={2} aria-hidden="true" />
              Quick add
            </button>
          )}
        </div>
      </Link>

      {/* Wishlist — small, circular, always visible on mobile */}
      {canWishlist && (
        <button
          type="button"
          onClick={() => onToggleWishlist(product)}
          aria-pressed={inWishlist}
          aria-label={inWishlist ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
          className="absolute right-2.5 top-3 flex size-9 items-center justify-center rounded-full bg-paper/90 text-ink-60 backdrop-blur-sm transition-[color,background-color] duration-200 hover:bg-paper hover:text-ink md:right-3 md:top-4"
        >
          <Heart
            size={16}
            strokeWidth={1.6}
            className={inWishlist ? 'fill-ink text-ink animate-heart-pop' : ''}
            aria-hidden="true"
          />
        </button>
      )}

      {/* Details */}
      <div className="mt-4 flex flex-1 flex-col">
        {product.category && (
          <p className="t-eyebrow text-ink-40">{product.category}</p>
        )}

        <h3 className="t-card mt-1.5 text-ink">
          <Link
            to={`/product/${product.slug}`}
            className="transition-colors duration-200 hover:text-ink-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            {product.name}
          </Link>
        </h3>

        <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
          {onSale && (
            <span className="text-[0.8125rem] text-ink-25 line-through">
              {formatPrice(product.compareAtPrice)}
            </span>
          )}
          <span
            className={`text-[0.875rem] tabular-nums ${onSale ? 'text-sale' : 'text-ink'}`}
          >
            {formatPrice(product.price)}
          </span>
        </div>

        {/* Mobile quick add — hover is not available on touch */}
        {canQuickAdd && !soldOut && (
          <button
            type="button"
            onClick={() => onAddToCart(product)}
            className="mt-3 h-10 w-full border border-line text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-ink transition-colors hover:border-ink hover:bg-sand md:hidden"
            aria-label={`Add ${product.name} to bag`}
          >
            Add to bag
          </button>
        )}
      </div>
    </article>
  );
}
