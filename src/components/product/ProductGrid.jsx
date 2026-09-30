/*
 * ProductGrid — the single grid used by the homepage, shop and wishlist.
 * 2 columns on mobile, 3 on tablet, 4 on desktop.
 */
export default function ProductGrid({ products, renderItem, className = '' }) {
  return (
    <ul
      className={`grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 sm:gap-y-12 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-8 ${className}`}
    >
      {products.map((product) => (
        <li key={product.id ?? product.slug} className="min-w-0">
          {renderItem(product)}
        </li>
      ))}
    </ul>
  );
}
