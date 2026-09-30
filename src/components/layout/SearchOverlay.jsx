import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, ArrowRight } from 'lucide-react';
import { useUI } from '../../context/UIContext';
import { searchProducts, products, categories } from '../../data/products';
import { formatPrice } from '../../utils/currency';
import Button from '../ui/Button';
import EmptyState from '../ui/EmptyState';

const SUGGESTIONS = ['Linen shirt', 'Dress', 'Leather belt', 'Accessories'];
const LOW_RESULTS = 6;

/**
 * Full-screen search.
 * Uses router navigation (not a hard reload) and searches the real catalogue,
 * so results are genuine rather than a "coming soon" placeholder.
 */
export default function SearchOverlay() {
  const { isSearchOpen, closeSearch } = useUI();
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  // Reset each time it opens so stale results never flash
  useEffect(() => {
    if (!isSearchOpen) return;
    setQuery('');
    const raf = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(raf);
  }, [isSearchOpen]);

  // Lock scroll and close on Escape
  useEffect(() => {
    if (!isSearchOpen) return undefined;

    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    const onKey = (event) => {
      if (event.key === 'Escape') closeSearch();
    };
    document.addEventListener('keydown', onKey);

    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', onKey);
    };
  }, [isSearchOpen, closeSearch]);

  const trimmed = query.trim();

  const results = useMemo(
    () => (trimmed ? searchProducts(trimmed).slice(0, LOW_RESULTS) : []),
    [trimmed],
  );

  const totalMatches = useMemo(
    () => (trimmed ? searchProducts(trimmed).length : 0),
    [trimmed],
  );

  if (!isSearchOpen) return null;

  const submit = (value) => {
    const next = value.trim();
    if (!next) return;
    closeSearch();
    navigate(`/shop?q=${encodeURIComponent(next)}`);
  };

  const goToShop = (to) => {
    closeSearch();
    navigate(to);
  };

  const popular = products.filter((product) => product.isFeatured).slice(0, 4);

  return (
    <div
      className="fixed inset-0 z-[70] flex flex-col bg-paper"
      role="dialog"
      aria-modal="true"
      aria-label="Search products"
    >
      {/* Input row */}
      <div className="shrink-0 border-b border-line">
        <div className="mx-auto flex h-16 max-w-[90rem] items-center gap-3 px-5 md:h-20 lg:px-12">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              submit(query);
            }}
            role="search"
            className="flex flex-1 items-center gap-3"
          >
            <label htmlFor="site-search" className="sr-only">
              Search products
            </label>
            <Search size={20} strokeWidth={1.6} className="shrink-0 text-ink-25" aria-hidden="true" />
            <input
              ref={inputRef}
              id="site-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search for shirts, dresses, accessories…"
              autoComplete="off"
              className="h-full flex-1 bg-transparent text-[1.0625rem] text-ink outline-none placeholder:text-ink-25 md:text-lg"
            />

            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Clear search"
                className="p-1 text-ink-40 transition-colors hover:text-ink"
              >
                <X size={17} strokeWidth={1.75} />
              </button>
            )}
          </form>

          <button
            type="button"
            onClick={closeSearch}
            className="-mr-2 shrink-0 p-2 text-ink transition-colors hover:text-ink-60"
            aria-label="Close search"
          >
            <X size={22} strokeWidth={1.6} />
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[90rem] px-5 py-10 lg:px-12 lg:py-14">
          {!trimmed ? (
            <>
              <h2 className="t-eyebrow text-ink-40">Popular searches</h2>
              <ul className="mt-5 flex flex-wrap gap-2">
                {SUGGESTIONS.map((term) => (
                  <li key={term}>
                    <button
                      type="button"
                      onClick={() => submit(term)}
                      className="border border-line px-4 py-2 text-[0.8125rem] text-ink-60 transition-colors hover:border-ink hover:text-ink"
                    >
                      {term}
                    </button>
                  </li>
                ))}
              </ul>

              <h2 className="t-eyebrow mt-12 text-ink-40">Shop by category</h2>
              <ul className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {categories.map((category) => (
                  <li key={category.id}>
                    <button
                      type="button"
                      onClick={() => goToShop(`/shop?category=${category.id}`)}
                      className="group flex w-full items-center justify-between border border-line px-4 py-4 text-left transition-colors hover:border-ink hover:bg-sand"
                    >
                      <span>
                        <span className="block text-[0.9375rem] text-ink">{category.name}</span>
                        <span className="mt-0.5 block text-[0.75rem] text-ink-40">
                          {category.description}
                        </span>
                      </span>
                      <ArrowRight
                        size={15}
                        strokeWidth={1.75}
                        className="shrink-0 text-ink-25 transition-transform duration-200 group-hover:translate-x-0.5"
                        aria-hidden="true"
                      />
                    </button>
                  </li>
                ))}
              </ul>

              <h2 className="t-eyebrow mt-12 text-ink-40">Featured</h2>
              <ul className="mt-5 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4 md:gap-x-6">
                {popular.map((product) => (
                  <li key={product.id}>
                    <button
                      type="button"
                      onClick={() => goToShop(`/product/${product.slug}`)}
                      className="group block w-full text-left"
                    >
                      <span className="block aspect-[3/4] overflow-hidden bg-sand">
                        <img
                          src={product.images?.[0]}
                          alt=""
                          loading="lazy"
                          className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </span>
                      <span className="mt-3 block text-[0.8125rem] text-ink">{product.name}</span>
                      <span className="mt-1 block text-[0.8125rem] tabular-nums text-ink-60">
                        {formatPrice(product.price)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : totalMatches === 0 ? (
            <EmptyState
              icon={Search}
              title={`No results for "${trimmed}"`}
              description="Try a different term, or browse the full collection."
              actionLabel="Browse all products"
              onAction={() => goToShop('/shop')}
              className="py-16"
            />
          ) : (
            <>
              <p className="t-caption">
                {totalMatches} {totalMatches === 1 ? 'result' : 'results'} for &ldquo;{trimmed}&rdquo;
              </p>

              <ul className="mt-7 grid grid-cols-2 gap-x-4 gap-y-9 md:grid-cols-4 md:gap-x-6">
                {results.map((product) => (
                  <li key={product.id}>
                    <button
                      type="button"
                      onClick={() => goToShop(`/product/${product.slug}`)}
                      className="group block w-full text-left"
                    >
                      <span className="block aspect-[3/4] overflow-hidden bg-sand">
                        <img
                          src={product.images?.[0]}
                          alt=""
                          loading="lazy"
                          className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </span>
                      <span className="mt-3 block text-[0.8125rem] text-ink">{product.name}</span>
                      <span className="mt-1 block text-[0.8125rem] tabular-nums text-ink-60">
                        {formatPrice(product.price)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>

              {totalMatches > LOW_RESULTS && (
                <div className="mt-12 flex justify-center">
                  <Button size="lg" variant="secondary" onClick={() => submit(trimmed)}>
                    See all {totalMatches} results
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
