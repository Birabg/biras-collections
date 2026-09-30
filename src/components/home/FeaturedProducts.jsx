import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, ArrowRight } from 'lucide-react';
import { formatPrice } from '../../utils/currency';
import { getFeaturedProducts } from '../../data/products';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useToast } from '../../components/ui/Toast';

export default function FeaturedProducts() {
  const products = getFeaturedProducts();
  const { addItem: addToCart } = useCart();
  const { toggleItem, isInWishlist } = useWishlist();
  const toast = useToast();

  const handleAddToCart = (product) => {
    addToCart(product, 1);
    toast.success('Added to bag', { message: `${product.name} has been added to your bag` });
  };

  const handleToggleWishlist = (product) => {
    toggleItem(product);
    const isNowInWishlist = isInWishlist(product.id);
    toast.success(
      isNowInWishlist ? 'Added to wishlist' : 'Removed from wishlist',
      { message: isNowInWishlist ? `${product.name} added to your wishlist` : `${product.name} removed from your wishlist` }
    );
  };

  return (
    <section className="bg-gray-50 py-20" aria-labelledby="featured-heading">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500">
              Curated for you
            </p>
            <h2 id="featured-heading" className="mt-2 text-3xl font-medium tracking-tight">
              Featured pieces
            </h2>
          </div>

          <Link to="/shop" className="hidden items-center gap-2 text-sm font-medium sm:flex">
            Shop all
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 md:gap-6">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={handleAddToCart}
              onToggleWishlist={handleToggleWishlist}
              inWishlist={isInWishlist(product.id)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductCard({ product, onAddToCart, onToggleWishlist, inWishlist }) {
  const badge = product.badge || (product.isNew ? 'New' : null);

  return (
    <article className="group">
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
              onToggleWishlist(product);
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
              onAddToCart(product);
            }}
            className="absolute bottom-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity px-4 py-2 bg-white text-sm font-medium rounded-md hover:bg-gray-100"
            aria-label={`Add ${product.name} to bag`}
          >
            <ShoppingBag size={15} className="mr-1.5" strokeWidth={1.7} />
            Quick Add
          </button>
        </div>

        <div className="pt-4">
          <p className="text-xs text-gray-500">{product.category.charAt(0).toUpperCase() + product.category.slice(1)}</p>
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