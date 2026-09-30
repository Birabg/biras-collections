import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, X, ChevronDown, ChevronUp } from 'lucide-react';
import { products, categories, searchProducts, getProductsByCategory } from '../data/products';
import { formatPrice } from '../utils/currency';
import { ProductGridSkeleton } from '../components/ui/LoadingState';
import EmptyState from '../components/ui/EmptyState';
import ProductCard from '../components/product/ProductCard';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../components/ui/Toast';

const sortOptions = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
];

const priceRanges = [
  { label: 'Under 1,000 ETB', min: 0, max: 1000 },
  { label: '1,000 - 2,500 ETB', min: 1000, max: 2500 },
  { label: '2,500 - 5,000 ETB', min: 2500, max: 5000 },
  { label: 'Over 5,000 ETB', min: 5000, max: Infinity },
];

const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '30', '32', '34', '36', '38', '40', 'One Size'];

export default function Shop() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceRange, setPriceRange] = useState(null);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [sortBy, setSortBy] = useState('featured');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { toggleItem, isInWishlist } = useWishlist();
  const { addItem: addToCart } = useCart();
  const toast = useToast();

  // Simulate loading for demo
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory, priceRange, selectedSizes, sortBy]);

  const filteredProducts = useMemo(() => {
    let result = products;

    if (searchQuery) {
      result = searchProducts(searchQuery);
    }

    if (selectedCategory !== 'all') {
      result = result.filter((p) => p.category === selectedCategory);
    }

    if (priceRange) {
      result = result.filter((p) => p.price >= priceRange.min && p.price <= priceRange.max);
    }

    if (selectedSizes.length > 0) {
      result = result.filter((p) => p.sizes.some((s) => selectedSizes.includes(s)));
    }

    switch (sortBy) {
      case 'newest':
        result = [...result].sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
        break;
      case 'price-asc':
        result = [...result].sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result = [...result].sort((a, b) => b.price - a.price);
        break;
      case 'featured':
      default:
        result = [...result].sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
        break;
    }

    return result;
  }, [searchQuery, selectedCategory, priceRange, selectedSizes, sortBy]);

  const hasActiveFilters = selectedCategory !== 'all' || priceRange || selectedSizes.length > 0;

  const clearFilters = () => {
    setSelectedCategory('all');
    setPriceRange(null);
    setSelectedSizes([]);
  };

  const handleAddToCart = (product) => {
    addToCart(product, 1);
    toast.success('Added to bag', { message: `${product.name} added to your bag` });
  };

  const handleToggleWishlist = (product) => {
    toggleItem(product);
    const nowInWishlist = isInWishlist(product.id);
    toast.success(
      nowInWishlist ? 'Added to wishlist' : 'Removed from wishlist',
      { message: nowInWishlist ? `${product.name} added to wishlist` : `${product.name} removed from wishlist` }
    );
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Page Header */}
      <header className="border-b border-gray-100 bg-gray-50">
        <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8 lg:py-16">
          <h1 className="text-4xl font-medium tracking-tight">Shop</h1>
          <p className="mt-2 text-gray-500">Explore our latest collection</p>
        </div>
      </header>

      {/* Search & Filters */}
      <div className="border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-5 py-4 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" aria-hidden="true" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full h-11 pl-12 pr-4 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                aria-label="Search products"
              />
            </div>

            {/* Desktop Filters */}
            <div className="hidden flex-1 sm:flex sm:justify-end gap-3">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-11 px-4 pr-10 text-sm border border-gray-200 rounded-lg bg-white appearance-none bg-no-repeat bg-right bg-[length:16px] bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%236b7280%22 stroke-width=%222%22%3E%3Cpath d=%22m6 9 6 6 6-6%22/%3E%3C/svg%3E')]"
                aria-label="Sort products"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>

              <button
                onClick={() => setFiltersOpen(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                aria-expanded={filtersOpen}
                aria-controls="mobile-filters"
              >
                <Filter size={18} strokeWidth={1.7} />
                Filters
                {hasActiveFilters && (
                  <span className="flex h-5 w-5 items-center justify-center text-xs font-semibold text-white bg-black rounded-full">
                    {selectedSizes.length + (priceRange ? 1 : 0) + (selectedCategory !== 'all' ? 1 : 0)}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Active Filters Bar */}
        {hasActiveFilters && (
          <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 sm:hidden">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Filters applied</span>
              <button onClick={clearFilters} className="text-sm font-medium text-gray-600 hover:text-black">Clear all</button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {selectedCategory !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-white border border-gray-200 rounded-full">
                  {categories.find(c => c.id === selectedCategory)?.name}
                  <button onClick={() => setSelectedCategory('all')} className="text-gray-400 hover:text-black" aria-label="Remove category filter"><X size={12} /></button>
                </span>
              )}
              {priceRange && (
                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-white border border-gray-200 rounded-full">
                  {priceRange.label}
                  <button onClick={() => setPriceRange(null)} className="text-gray-400 hover:text-black" aria-label="Remove price filter"><X size={12} /></button>
                </span>
              )}
              {selectedSizes.map((size) => (
                <span key={size} className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-white border border-gray-200 rounded-full">
                  {size}
                  <button onClick={() => setSelectedSizes(selectedSizes.filter(s => s !== size))} className="text-gray-400 hover:text-black" aria-label={`Remove size ${size}`}><X size={12} /></button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Product Grid */}
      <main className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Mobile Filters Sidebar */}
          <aside id="mobile-filters" className={filtersOpen ? 'block' : 'hidden lg:block'} aria-label="Product filters">
            <div className="lg:sticky lg:top-24 lg:self-start space-y-6 w-full lg:w-64 flex-shrink-0">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4 lg:hidden">
                <h2 className="text-lg font-medium">Filters</h2>
                <button onClick={() => setFiltersOpen(false)} className="p-2 text-gray-400 hover:text-black" aria-label="Close filters"><X size={20} /></button>
              </div>

              {/* Category Filter */}
              <fieldset>
                <legend className="text-sm font-medium mb-3">Category</legend>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="category"
                      value="all"
                      checked={selectedCategory === 'all'}
                      onChange={() => setSelectedCategory('all')}
                      className="h-4 w-4 text-black border-gray-300 focus:ring-black"
                    />
                    <span className="text-sm text-gray-700">All</span>
                  </label>
                  {categories.map((cat) => (
                    <label key={cat.id} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="category"
                        value={cat.id}
                        checked={selectedCategory === cat.id}
                        onChange={() => setSelectedCategory(cat.id)}
                        className="h-4 w-4 text-black border-gray-300 focus:ring-black"
                      />
                      <span className="text-sm text-gray-700">{cat.name}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              {/* Price Filter */}
              <fieldset>
                <legend className="text-sm font-medium mb-3">Price</legend>
                <div className="space-y-2">
                  {priceRanges.map((range) => (
                    <label key={range.label} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="price"
                        checked={priceRange?.min === range.min && priceRange?.max === range.max}
                        onChange={() => setPriceRange(range)}
                        className="h-4 w-4 text-black border-gray-300 focus:ring-black"
                      />
                      <span className="text-sm text-gray-700">{range.label}</span>
                    </label>
                  ))}
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="price"
                      checked={!priceRange}
                      onChange={() => setPriceRange(null)}
                      className="h-4 w-4 text-black border-gray-300 focus:ring-black"
                    />
                    <span className="text-sm text-gray-700">All prices</span>
                  </label>
                </div>
              </fieldset>

              {/* Size Filter */}
              <fieldset>
                <legend className="text-sm font-medium mb-3">Size</legend>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((size) => (
                    <label key={size} className="cursor-pointer">
                      <input
                        type="checkbox"
                        value={size}
                        checked={selectedSizes.includes(size)}
                        onChange={(e) => setSelectedSizes(e.target.checked ? [...selectedSizes, size] : selectedSizes.filter(s => s !== size))}
                        className="sr-only peer"
                      />
                      <span className={`inline-flex h-8 w-8 items-center justify-center text-xs font-medium rounded-md border transition-colors peer-checked:bg-black peer-checked:text-white peer-checked:border-black ${selectedSizes.includes(size) ? '' : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'}`}>
                        {size}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              {hasActiveFilters && (
                <button onClick={clearFilters} className="w-full text-sm font-medium text-gray-600 hover:text-black">Clear all filters</button>
              )}
            </div>
          </aside>

          {/* Products */}
          <div className="flex-1">
            <div className="hidden lg:flex items-center justify-between mb-6">
              <p className="text-sm text-gray-500">
                Showing <span className="font-medium">{filteredProducts.length}</span> products
              </p>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-10 px-4 pr-10 text-sm border border-gray-200 rounded-lg bg-white appearance-none bg-no-repeat bg-right bg-[length:16px] bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%236b7280%22 stroke-width=%222%22%3E%3Cpath d=%22m6 9 6 6 6-6%22/%3E%3C/svg%3E')]"
                aria-label="Sort products"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {isLoading ? (
              <ProductGridSkeleton count={8} />
            ) : filteredProducts.length > 0 ? (
              <ProductGrid products={filteredProducts} onAddToCart={handleAddToCart} onToggleWishlist={handleToggleWishlist} isInWishlist={isInWishlist} />
            ) : (
              <EmptyState
                icon={Search}
                title="No products found"
                description="Try adjusting your search or filters to find what you're looking for."
                action={<button onClick={clearFilters} className="text-sm font-medium text-black underline">Clear all filters</button>}
              />
            )}
          </div>
        </div>
      </main>

      {/* Mobile Filters Bottom Sheet */}
      {filtersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-labelledby="filters-title">
          <div className="fixed inset-0 bg-black/50" onClick={() => setFiltersOpen(false)} aria-hidden="true" />
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 id="filters-title" className="text-lg font-medium">Filters</h2>
              <button onClick={() => setFiltersOpen(false)} className="p-2 text-gray-400 hover:text-black" aria-label="Close filters"><X size={20} /></button>
            </div>
            <div className="p-4 space-y-6">
              <div>
                <h3 className="text-sm font-medium mb-3">Category</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="radio" name="category-m" value="all" checked={selectedCategory === 'all'} onChange={() => setSelectedCategory('all')} className="h-4 w-4 text-black border-gray-300 focus:ring-black" />
                    <span className="text-sm text-gray-700">All</span>
                  </label>
                  {categories.map((cat) => (
                    <label key={cat.id} className="flex items-center gap-3 cursor-pointer">
                      <input type="radio" name="category-m" value={cat.id} checked={selectedCategory === cat.id} onChange={() => setSelectedCategory(cat.id)} className="h-4 w-4 text-black border-gray-300 focus:ring-black" />
                      <span className="text-sm text-gray-700">{cat.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-3">Price</h3>
                <div className="space-y-2">
                  {priceRanges.map((range) => (
                    <label key={range.label} className="flex items-center gap-3 cursor-pointer">
                      <input type="radio" name="price-m" checked={priceRange?.min === range.min && priceRange?.max === range.max} onChange={() => setPriceRange(range)} className="h-4 w-4 text-black border-gray-300 focus:ring-black" />
                      <span className="text-sm text-gray-700">{range.label}</span>
                    </label>
                  ))}
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="radio" name="price-m" checked={!priceRange} onChange={() => setPriceRange(null)} className="h-4 w-4 text-black border-gray-300 focus:ring-black" />
                    <span className="text-sm text-gray-700">All prices</span>
                  </label>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-3">Size</h3>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((size) => (
                    <label key={size} className="cursor-pointer">
                      <input type="checkbox" value={size} checked={selectedSizes.includes(size)} onChange={(e) => setSelectedSizes(e.target.checked ? [...selectedSizes, size] : selectedSizes.filter(s => s !== size))} className="sr-only peer" />
                      <span className={`inline-flex h-10 w-10 items-center justify-center text-xs font-medium rounded-md border transition-colors peer-checked:bg-black peer-checked:text-white peer-checked:border-black ${selectedSizes.includes(size) ? '' : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'}`}>
                        {size}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {hasActiveFilters && (
                <button onClick={clearFilters} className="w-full py-3 text-sm font-medium text-gray-600 hover:text-black border-t border-gray-100 pt-4 mt-4">Clear all filters</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProductGrid({ products, onAddToCart, onToggleWishlist, isInWishlist }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4 md:gap-6">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onAddToCart={onAddToCart}
          onToggleWishlist={onToggleWishlist}
          inWishlist={isInWishlist(product.id)}
        />
      ))}
    </div>
  );
}