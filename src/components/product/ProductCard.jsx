import { Link } from 'react-router-dom';
import { Heart, ShoppingBag } from 'lucide-react';
import { formatPrice } from '../../utils/currency';

export default function ProductCard({ product, onAddToCart, onToggleWishlist, inWishlist, className = '' }) {
  const badge = product.badge || (product.isNew ? 'New' : product.isBestSeller ? 'Bestseller' : null);

  return (
    <article className={`group ${className}`}>
      <Link to={`/product/${product.slug}`} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2">
        <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
          <img
            src={product.images?.[0] || product.image}
            alt={product.name}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
            loading="lazy"
          />

          {badge && (
            <span className="absolute left-3 top-3 text-xs font-semibold uppercase tracking-[0.1em] px-2 py-1 bg-black text-white rounded-sm">
              {badge}
            </span>
          )}

          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleWishlist?.(product);
            }}
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 backdrop-blur transition-colors hover:bg-white"
            aria-label={inWishlist ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
            aria-pressed={inWishlist}
          >
            <Heart size={17} strokeWidth={inWishlist ? 3 : 1.7} className={inWishlist ? 'text-red-500 fill-red-500' : ''} />
          </button>

          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onAddToCart?.(product);
            }}
            className="absolute bottom-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity px-4 py-2 bg-white text-sm font-medium rounded-md hover:bg-gray-100"
            aria-label={`Add ${product.name} to bag`}
          >
            <ShoppingBag size={15} className="mr-1.5" strokeWidth={1.7} />
            Quick Add
          </button>
        </div>

        <div className="pt-4">
          <p className="text-xs text-gray-500 capitalize">{product.category}</p>
          <h3 className="mt-1 text-sm font-medium line-clamp-1">{product.name}</h3>
          <p className="mt-2 text-sm font-semibold">
            {product.compareAtPrice ? (
              <>
                <span className="text-gray-400 line-through mr-2">{formatPrice(product.compareAtPrice)}</span>
                {formatPrice(product.price)}
              </>
            ) : (
              formatPrice(product.price)
            )}
          </p>
        </div>
      </Link>
    </article>
  );
}