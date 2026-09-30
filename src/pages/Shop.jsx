import { useState, useMemo, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X, ArrowRight, SearchX } from 'lucide-react';
import ProductCard from '../components/product/ProductCard';
import ProductGrid from '../components/product/ProductGrid';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../components/ui/Toast';
import { products, categories, searchProducts } from '../data/products';

const ALL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

const SORTS = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'rating', label: 'Top rated' },
];

const PRICE_CEILING = Math.max(...products.map((product) => product.price));
const PRICE_FLOOR = Math.floor(Math.min(...products.map((product) => product.price)) / 100) * 100;

const CATEGORY_TABS = [
  { label: 'All', to: '/shop', isActive: () => true },
  ...categories.map((category) => ({
    label: category.name,
    to: `/shop?category=${category.id}`,
    isActive: (state) => state.category === category.id,
  })),
  { label: 'New Arrivals', to: '/shop?new=true', isActive: (state) => state.isNew },
];

/* ------------------------------------------------------------------ filters */

function FilterGroup({ title, children }) {
  return (
    <fieldset className="border-b border-line py-6 first:pt-0 last:border-0">
      <legend className="t-eyebrow text-ink-40">{title}</legend>
      <div className="mt-4">{children}</div>
    </fieldset>
  );
}

function FilterPanel({ state, onChange, onClear, resultCount }) {
  const activeCount =
    (state.category ? 1 : 0) +
    state.sizes.length +
    (state.onSale ? 1 : 0) +
    (state.maxPrice < PRICE_CEILING ? 1 : 0) +
    (state.inStockOnly ? 1 : 0);

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <h2 className="text-[0.9375rem] font-medium text-ink">Filters</h2>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="link-underline text-[0.75rem] text-ink-60 hover:text-ink"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="mt-2">
        <FilterGroup title="Category">
          <ul className="flex flex-col gap-2.5">
            {[{ id: null, name: 'All categories' }, ...categories].map((category) => (
              <li key={category.id ?? 'all'}>
                <label className="flex cursor-pointer items-center gap-3 text-[0.875rem] text-ink-60 transition-colors hover:text-ink">
                  <input
                    type="radio"
                    name="category"
                    checked={state.category === (category.id ?? null)}
                    onChange={() => onChange({ category: category.id })}
                    className="size-4 accent-ink"
                  />
                  {category.name}
                </label>
              </li>
            ))}
          </ul>
        </FilterGroup>

        <FilterGroup title="Size">
          <div className="flex flex-wrap gap-2">
            {ALL_SIZES.map((size) => {
              const selected = state.sizes.includes(size);
              return (
                <button
                  key={size}
                  type="button"
                  aria-pressed={selected}
                  onClick={() =>
                    onChange({
                      sizes: selected
                        ? state.sizes.filter((s) => s !== size)
                        : [...state.sizes, size],
                    })
                  }
                  className={`h-10 min-w-11 border px-3 text-[0.8125rem] transition-colors ${
                    selected
                      ? 'border-ink bg-ink text-paper'
                      : 'border-line text-ink-60 hover:border-ink'
                  }`}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </FilterGroup>

        <FilterGroup title="Price">
          <div className="flex items-center justify-between text-[0.8125rem] tabular-nums text-ink-60">
            <span>{PRICE_FLOOR.toLocaleString()} ETB</span>
            <span className="font-medium text-ink">
              up to {state.maxPrice.toLocaleString()} ETB
            </span>
          </div>

          <label htmlFor="price-range" className="sr-only">
            Maximum price
          </label>
          <input
            id="price-range"
            type="range"
            min={PRICE_FLOOR}
            max={PRICE_CEILING}
            step={50}
            value={state.maxPrice}
            onChange={(event) => onChange({ maxPrice: Number(event.target.value) })}
            className="mt-4 w-full accent-ink"
          />
        </FilterGroup>

        <FilterGroup title="Availability">
          <div className="flex flex-col gap-2.5">
            <label className="flex cursor-pointer items-center gap-3 text-[0.875rem] text-ink-60 transition-colors hover:text-ink">
              <input
                type="checkbox"
                checked={state.onSale}
                onChange={(event) => onChange({ onSale: event.target.checked })}
                className="size-4 accent-ink"
              />
              On sale only
            </label>

            <label className="flex cursor-pointer items-center gap-3 text-[0.875rem] text-ink-60 transition-colors hover:text-ink">
              <input
                type="checkbox"
                checked={state.inStockOnly}
                onChange={(event) => onChange({ inStockOnly: event.target.checked })}
                className="size-4 accent-ink"
              />
              In stock only
            </label>
          </div>
        </FilterGroup>
      </div>

      <p className="mt-6 text-[0.75rem] text-ink-40" role="status" aria-live="polite">
        {resultCount} {resultCount === 1 ? 'product' : 'products'}
      </p>
    </div>
  );
}

/* --------------------------------------------------------------------- page */

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { addItem } = useCart();
  const { isInWishlist, toggleItem } = useWishlist();
  const toast = useToast();

  const [isSheetOpen, setIsSheetOpen] = useState(false);

  /* The URL is the source of truth, so header links and the address bar work. */
  const urlState = useMemo(
    () => ({
      category: searchParams.get('category'),
      q: searchParams.get('q') ?? '',
      isNew: searchParams.get('new') === 'true',
    }),
    [searchParams],
  );

  const [searchDraft, setSearchDraft] = useState(urlState.q);
  const [lastQuery, setLastQuery] = useState(urlState.q);

  /*
   * The URL is the source of truth, so header search and the address bar both
   * work. When the query changes elsewhere, realign the input during render
   * rather than in an effect, which would cause a second render pass.
   */
  if (lastQuery !== urlState.q) {
    setLastQuery(urlState.q);
    setSearchDraft(urlState.q);
  }

  const [filters, setFilters] = useState({
    sizes: [],
    onSale: false,
    inStockOnly: false,
    maxPrice: PRICE_CEILING,
  });

  const patchFilters = useCallback((partial) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({ sizes: [], onSale: false, inStockOnly: false, maxPrice: PRICE_CEILING });
  }, []);

  const results = useMemo(() => {
    let list = urlState.q ? searchProducts(urlState.q) : [...products];

    if (urlState.category) {
      list = list.filter((product) => product.category === urlState.category);
    }

    if (urlState.isNew) {
      list = list.filter((product) => product.isNew);
    }

    if (filters.sizes.length) {
      list = list.filter((product) =>
        product.sizes?.some((size) => filters.sizes.includes(size)),
      );
    }

    if (filters.onSale) {
      list = list.filter((product) => product.compareAtPrice > product.price);
    }

    if (filters.inStockOnly) {
      list = list.filter((product) => product.stock > 0);
    }

    list = list.filter((product) => product.price <= filters.maxPrice);

    const sort = searchParams.get('sort') ?? 'featured';
    const sorted = [...list];

    switch (sort) {
      case 'price-asc':
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        sorted.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        sorted.sort((a, b) => Number(b.isNew) - Number(a.isNew));
        break;
      case 'rating':
        sorted.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
        break;
      default:
        sorted.sort((a, b) => Number(b.isFeatured ?? false) - Number(a.isFeatured ?? false));
    }

    return sorted;
  }, [urlState, filters, searchParams]);

  const handleAdd = (product) => {
    if (product.sizes?.length > 1) {
      toast.info('Choose a size', { message: `Open ${product.name} to pick your size.` });
      return;
    }
    addItem(product, 1, product.sizes?.[0] ?? null, product.colors?.[0]?.name ?? null);
    toast.success('Added to bag', { message: `${product.name} added to your bag` });
  };

  const handleToggle = (product) => {
    const wasSaved = isInWishlist(product.id);
    toggleItem(product);
    toast.success(wasSaved ? 'Removed from wishlist' : 'Saved to wishlist', {
      message: wasSaved
        ? `${product.name} removed from your wishlist`
        : `${product.name} saved to your wishlist`,
    });
  };

  const submitSearch = (event) => {
    event.preventDefault();
    const next = new URLSearchParams(searchParams);
    const value = searchDraft.trim();

    if (value) next.set('q', value);
    else next.delete('q');

    setSearchParams(next, { replace: true });
  };

  const setSort = (value) => {
    const next = new URLSearchParams(searchParams);
    if (value === 'featured') next.delete('sort');
    else next.set('sort', value);
    setSearchParams(next, { replace: true });
  };

  const activeFilterCount =
    filters.sizes.length +
    Number(filters.onSale) +
    Number(filters.inStockOnly) +
    Number(filters.maxPrice < PRICE_CEILING);

  const heading = urlState.isNew
    ? 'New Arrivals'
    : urlState.category
      ? (categories.find((c) => c.id === urlState.category)?.name ?? 'Shop')
      : urlState.q
        ? `Results for “${urlState.q}”`
        : 'Shop';

  const description = urlState.q
    ? `${results.length} ${results.length === 1 ? 'match' : 'matches'} in the collection.`
    : 'Considered womenswear, menswear and accessories, made in small runs.';

  return (
    <>
      {/* Page head */}
      <header className="border-b border-line">
        <div className="shell py-10 lg:py-16">
          <p className="t-eyebrow text-ink-40">Collection</p>
          <h1 className="t-page mt-3">{heading}</h1>
          <p className="t-body mt-3 max-w-lg">{description}</p>
        </div>
      </header>

      {/*
        Tabs and toolbar share one sticky block. Two separate sticky bars
        would need offsets that drift apart at every breakpoint.
      */}
      <div className="sticky top-16 z-30 border-b border-line bg-paper/95 backdrop-blur supports-[backdrop-filter]:bg-paper/85 md:top-20">
        <nav aria-label="Product categories" className="border-b border-line-soft">
          <div className="shell">
            <ul className="-mx-5 flex gap-6 overflow-x-auto px-5 md:mx-0 md:px-0">
              {CATEGORY_TABS.map((tab) => {
                const isActive = tab.isActive(urlState);
                return (
                  <li key={tab.label} className="shrink-0">
                    <Link
                      to={tab.to}
                      aria-current={isActive ? 'page' : undefined}
                      className={`inline-flex h-12 items-center border-b-2 text-[0.8125rem] transition-colors ${
                        isActive
                          ? 'border-ink text-ink'
                          : 'border-transparent text-ink-40 hover:text-ink'
                      }`}
                    >
                      {tab.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        <div className="shell flex h-16 items-center gap-3">
          {/* Mobile filter trigger */}
          <button
            type="button"
            onClick={() => setIsSheetOpen(true)}
            className="-ml-1 inline-flex h-10 shrink-0 items-center gap-2 px-3 text-[0.8125rem] text-ink transition-colors hover:bg-sand lg:hidden"
            aria-haspopup="dialog"
            aria-expanded={isSheetOpen}
          >
            <SlidersHorizontal size={16} strokeWidth={1.75} aria-hidden="true" />
            Filter
            {activeFilterCount > 0 && (
              <span className="flex size-5 items-center justify-center rounded-full bg-ink text-[0.625rem] font-semibold text-paper">
                {activeFilterCount}
              </span>
            )}
          </button>

          <form onSubmit={submitSearch} role="search" className="min-w-0 flex-1 lg:max-w-xs">
            <label htmlFor="shop-search" className="sr-only">
              Search products
            </label>
            <div className="relative">
              <Search
                size={16}
                strokeWidth={1.75}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-25"
                aria-hidden="true"
              />
              <input
                id="shop-search"
                type="search"
                value={searchDraft}
                onChange={(event) => setSearchDraft(event.target.value)}
                placeholder="Search the collection"
                className="h-10 w-full border border-line pl-9 pr-3 text-[0.8125rem] outline-none transition-colors placeholder:text-ink-25 focus:border-ink"
              />
            </div>
          </form>

          <div className="ml-auto flex shrink-0 items-center gap-3">
            <label htmlFor="shop-sort" className="t-eyebrow hidden text-ink-40 sm:block">
              Sort
            </label>
            <select
              id="shop-sort"
              value={searchParams.get('sort') ?? 'featured'}
              onChange={(event) => setSort(event.target.value)}
              className="h-10 max-w-[9.5rem] border border-line bg-paper px-3 text-[0.8125rem] text-ink outline-none transition-colors hover:border-ink focus:border-ink"
            >
              {SORTS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Grid + desktop sidebar */}
      <div className="shell py-10 lg:py-14">
        <div className="lg:grid lg:grid-cols-[15rem_1fr] lg:gap-14">
          <aside className="hidden lg:block">
            <div className="sticky top-40">
              <FilterPanel
                state={{ ...filters, category: urlState.category }}
                onChange={({ category, ...rest }) => {
                  if (category !== undefined) {
                    const next = new URLSearchParams(searchParams);
                    if (category) next.set('category', category);
                    else next.delete('category');
                    setSearchParams(next, { replace: true });
                  }
                  patchFilters(rest);
                }}
                onClear={() => {
                  clearFilters();
                  const next = new URLSearchParams(searchParams);
                  next.delete('category');
                  setSearchParams(next, { replace: true });
                }}
                resultCount={results.length}
              />
            </div>
          </aside>

          <div className="min-w-0">
            {results.length === 0 ? (
              <EmptyState
                icon={SearchX}
                title="Nothing matches those filters"
                description="Try widening the price range, removing a size, or browsing everything."
                actionLabel="Clear all filters"
                onAction={() => {
                  clearFilters();
                  setSearchParams({}, { replace: true });
                }}
              />
            ) : (
              <>
                <p className="t-caption mb-6 lg:hidden" role="status" aria-live="polite">
                  {results.length} {results.length === 1 ? 'product' : 'products'}
                </p>

                <ProductGrid
                  products={results}
                  renderItem={(product) => (
                    <ProductCard
                      product={product}
                      onAddToCart={handleAdd}
                      onToggleWishlist={handleToggle}
                      inWishlist={isInWishlist(product.id)}
                      priority={results.indexOf(product) < 4}
                    />
                  )}
                />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter sheet — a single sheet, never duplicated inline */}
      {isSheetOpen && (
        <div className="fixed inset-0 z-[70] lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
          <div
            className="absolute inset-0 bg-ink/40 animate-fade-in"
            onClick={() => setIsSheetOpen(false)}
            aria-hidden="true"
          />

          <div className="absolute inset-x-0 bottom-0 flex max-h-[88dvh] flex-col bg-paper animate-fade-up">
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-line px-5">
              <h2 className="text-[0.9375rem] font-medium text-ink">Filters</h2>
              <button
                type="button"
                onClick={() => setIsSheetOpen(false)}
                aria-label="Close filters"
                className="-mr-2 p-2 text-ink-40"
              >
                <X size={20} strokeWidth={1.75} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-2">
              <FilterPanel
                state={{ ...filters, category: urlState.category }}
                onChange={({ category, ...rest }) => {
                  if (category !== undefined) {
                    const next = new URLSearchParams(searchParams);
                    if (category) next.set('category', category);
                    else next.delete('category');
                    setSearchParams(next, { replace: true });
                  }
                  patchFilters(rest);
                }}
                onClear={() => {
                  clearFilters();
                  const next = new URLSearchParams(searchParams);
                  next.delete('category');
                  setSearchParams(next, { replace: true });
                }}
                resultCount={results.length}
              />
            </div>

            <div className="shrink-0 border-t border-line p-4">
              <Button fullWidth size="lg" onClick={() => setIsSheetOpen(false)} iconRight={<ArrowRight size={15} strokeWidth={2} />}>
                Show {results.length} {results.length === 1 ? 'product' : 'products'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
