import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import ProductCard from '../product/ProductCard';
import ProductGrid from '../product/ProductGrid';
import { getFeaturedProducts, getNewArrivals } from '../../data/products';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useToast } from '../ui/Toast';

/**
 * Featured / new-arrivals rows.
 * One reusable section so the two rows cannot drift apart visually.
 */
function ProductRow({ id, eyebrow, title, description, products, onAdd, inWishlist, onToggle, viewAllTo }) {
  if (!products.length) return null;

  return (
    <section className="section-y" aria-labelledby={id}>
      <div className="shell">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            {eyebrow && <p className="t-eyebrow text-ink-40">{eyebrow}</p>}
            <h2 id={id} className={`${eyebrow ? 'mt-3' : ''} t-section`}>
              {title}
            </h2>
            {description && <p className="t-body mt-3 max-w-lg">{description}</p>}
          </div>

          <Link
            to={viewAllTo}
            className="link-underline inline-flex items-center gap-2 self-start text-[0.8125rem] font-medium text-ink transition-colors sm:self-auto"
          >
            View all
            <ArrowRight size={14} strokeWidth={2} aria-hidden="true" />
          </Link>
        </header>

        <div className="mt-10 lg:mt-14">
          <ProductGrid
            products={products}
            renderItem={(product) => (
              <ProductCard
                product={product}
                onAddToCart={onAdd}
                onToggleWishlist={onToggle}
                inWishlist={inWishlist(product)}
              />
            )}
          />
        </div>
      </div>
    </section>
  );
}

export default function FeaturedProducts() {
  const { addItem } = useCart();
  const { isInWishlist, toggleItem } = useWishlist();
  const toast = useToast();

  const handleAdd = (product) => {
    // Quick add from a grid has no size choice, so only add when unambiguous
    if (product.sizes?.length > 1) {
      toast.info('Choose a size', {
        message: `Open ${product.name} to pick your size.`,
      });
      return;
    }

    addItem(product, 1, product.sizes?.[0] ?? null, product.colors?.[0]?.name ?? null);
    toast.success('Added to bag', { message: `${product.name} added to your bag` });
  };

  const handleToggle = (product) => {
    // Read the current state before toggling so the message is not inverted
    const wasSaved = isInWishlist(product.id);
    toggleItem(product);
    toast.success(wasSaved ? 'Removed from wishlist' : 'Saved to wishlist', {
      message: wasSaved
        ? `${product.name} removed from your wishlist`
        : `${product.name} saved to your wishlist`,
    });
  };

  const inWishlist = (product) => isInWishlist(product.id);

  return (
    <>
      <div className="border-t border-line">
        <ProductRow
          id="featured-heading"
          eyebrow="Curated for you"
          title="Featured pieces"
          description="The pieces our stylists return to, season after season."
          products={getFeaturedProducts()}
          onAdd={handleAdd}
          onToggle={handleToggle}
          inWishlist={inWishlist}
          viewAllTo="/shop"
        />
      </div>

      <div className="border-t border-line bg-sand/50">
        <ProductRow
          id="new-arrivals-heading"
          eyebrow="Just landed"
          title="New arrivals"
          products={getNewArrivals()}
          onAdd={handleAdd}
          onToggle={handleToggle}
          inWishlist={inWishlist}
          viewAllTo="/shop?new=true"
        />
      </div>
    </>
  );
}
