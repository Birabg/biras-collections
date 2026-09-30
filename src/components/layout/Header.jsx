import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Heart, ShoppingBag, Menu, X, User } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'Shop', href: '/shop' },
  { label: 'Women', href: '/shop?category=women' },
  { label: 'Men', href: '/shop?category=men' },
  { label: 'Accessories', href: '/shop?category=accessories' },
  { label: 'New Arrivals', href: '/shop?new=true' },
];

const mobileAccountItems = [
  { label: 'Login', href: '/login' },
  { label: 'My Account', href: '/account' },
  { label: 'Wishlist', href: '/wishlist' },
  { label: 'Orders', href: '/account/orders' },
];

const mobileHelpItems = [
  { label: 'Contact', href: '/contact' },
  { label: 'Shipping', href: '/shipping' },
  { label: 'Returns', href: '/returns' },
  { label: 'FAQ', href: '/faq' },
];

export default function Header() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const mobileMenuRef = useRef(null);
  const { getItemCount } = useCart();
  const { wishlist } = useWishlist();
  const cartCount = getItemCount();
  const wishlistCount = wishlist.length;

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const isActive = (href) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 lg:px-8">

          {/* Logo */}
          <Link to="/" className="text-xl font-semibold tracking-tight" aria-label="Bira's Collections Home">
            Bira's <span className="font-normal">Collections</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-8 md:flex" aria-label="Main navigation">
            {navItems.map((item) => (
              <Link
                key={item.label}
                to={item.href}
                className={`text-sm font-medium transition-colors ${isActive(item.href) ? 'text-black' : 'text-gray-600 hover:text-black'}`}
                aria-current={isActive(item.href) ? 'page' : undefined}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden items-center gap-2 md:flex">
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2 rounded-full text-gray-500 hover:text-black hover:bg-gray-100 transition-colors"
              aria-label="Search"
              aria-expanded={searchOpen}
            >
              <Search size={20} strokeWidth={1.7} />
            </button>

            <Link
              to="/wishlist"
              className="p-2 rounded-full text-gray-500 hover:text-black hover:bg-gray-100 transition-colors relative"
              aria-label={`Wishlist${wishlistCount > 0 ? `, ${wishlistCount} items` : ''}`}
            >
              <Heart size={20} strokeWidth={1.7} />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center text-xs font-semibold text-white bg-black rounded-full">
                  {wishlistCount > 9 ? '9+' : wishlistCount}
                </span>
              )}
            </Link>

            <Link
              to="/account"
              className="p-2 rounded-full text-gray-500 hover:text-black hover:bg-gray-100 transition-colors"
              aria-label="My Account"
            >
              <User size={20} strokeWidth={1.7} />
            </Link>

            <Link
              to="/cart"
              className="p-2 rounded-full text-gray-500 hover:text-black hover:bg-gray-100 transition-colors relative"
              aria-label={`Shopping bag${cartCount > 0 ? `, ${cartCount} items` : ''}`}
            >
              <ShoppingBag size={20} strokeWidth={1.7} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center text-xs font-semibold text-white bg-black rounded-full">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </Link>
          </div>

          {/* Mobile Actions */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2 rounded-full text-gray-500 hover:text-black hover:bg-gray-100 transition-colors"
              aria-label="Search"
            >
              <Search size={20} strokeWidth={1.7} />
            </button>

            <Link
              to="/wishlist"
              className="p-2 rounded-full text-gray-500 hover:text-black hover:bg-gray-100 transition-colors relative"
              aria-label={`Wishlist${wishlistCount > 0 ? `, ${wishlistCount} items` : ''}`}
            >
              <Heart size={20} strokeWidth={1.7} />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center text-xs font-semibold text-white bg-black rounded-full">
                  {wishlistCount > 9 ? '9+' : wishlistCount}
                </span>
              )}
            </Link>

            <Link
              to="/cart"
              className="p-2 rounded-full text-gray-500 hover:text-black hover:bg-gray-100 transition-colors relative"
              aria-label={`Shopping bag${cartCount > 0 ? `, ${cartCount} items` : ''}`}
            >
              <ShoppingBag size={20} strokeWidth={1.7} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center text-xs font-semibold text-white bg-black rounded-full">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </Link>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-full text-gray-500 hover:text-black hover:bg-gray-100 transition-colors"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
            >
              {mobileMenuOpen ? <X size={22} strokeWidth={2} /> : <Menu size={22} strokeWidth={2} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div
          ref={mobileMenuRef}
          id="mobile-menu"
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            mobileMenuOpen ? 'max-h-96 opacity-100 visible' : 'max-h-0 opacity-0 invisible'
          }`}
          role="navigation"
          aria-label="Mobile navigation"
        >
          <div className="border-t border-gray-100 bg-white px-5 pb-6">
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  onClick={closeMobileMenu}
                  className={`px-3 py-3 text-base font-medium border-l-4 transition-colors ${
                    isActive(item.href)
                      ? 'border-black bg-gray-50 text-black'
                      : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-black'
                  }`}
                  aria-current={isActive(item.href) ? 'page' : undefined}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="mt-6 pt-6 border-t border-gray-100">
              <h3 className="px-3 text-xs font-semibold uppercase tracking-[0.15em] text-gray-500 mb-3">
                Account
              </h3>
              <nav className="flex flex-col gap-1">
                {mobileAccountItems.map((item) => (
                  <Link
                    key={item.label}
                    to={item.href}
                    onClick={closeMobileMenu}
                    className="px-3 py-3 text-base font-medium text-gray-600 hover:bg-gray-50 hover:text-black transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-100">
              <h3 className="px-3 text-xs font-semibold uppercase tracking-[0.15em] text-gray-500 mb-3">
                Help
              </h3>
              <nav className="flex flex-col gap-1">
                {mobileHelpItems.map((item) => (
                  <Link
                    key={item.label}
                    to={item.href}
                    onClick={closeMobileMenu}
                    className="px-3 py-3 text-base font-medium text-gray-600 hover:bg-gray-50 hover:text-black transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </div>
      </header>

      {/* Search Modal */}
      {searchOpen && (
        <SearchModal onClose={() => setSearchOpen(false)} />
      )}
    </>
  );
}

function SearchModal({ onClose }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') onClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      onClose();
      // Navigate to shop with search query
      window.location.href = `/shop?q=${encodeURIComponent(query.trim())}`;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-white flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-label="Search"
      onKeyDown={handleKeyDown}
    >
      <div className="flex h-20 items-center px-5 border-b border-gray-100">
        <form onSubmit={handleSubmit} className="w-full flex-1 max-w-2xl mx-auto">
          <label htmlFor="search-input" className="sr-only">Search products</label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" strokeWidth={1.7} aria-hidden="true" />
            <input
              ref={inputRef}
              id="search-input"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full h-12 pl-12 pr-16 text-base bg-gray-50 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              autoComplete="off"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label="Clear search"
              >
                <X size={18} strokeWidth={2} />
              </button>
            )}
          </div>
        </form>
        <button
          onClick={onClose}
          className="p-2 ml-4 text-gray-500 hover:text-black transition-colors"
          aria-label="Close search"
        >
          <X size={22} strokeWidth={2} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-8">
        {query.trim() ? (
          <SearchResults query={query} />
        ) : (
          <RecentSearches onClose={onClose} />
        )}
      </div>
    </div>
  );
}

function RecentSearches({ onClose }) {
  const recentSearches = ['dresses', 'leather bags', 'linen shirts', 'accessories'];

  return (
    <div className="max-w-2xl mx-auto">
      <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-gray-500 mb-4">Recent searches</h3>
      <div className="flex flex-wrap gap-2">
        {recentSearches.map((search) => (
          <button
            key={search}
            onClick={() => {
              window.location.href = `/shop?q=${encodeURIComponent(search)}`;
              onClose();
            }}
            className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
          >
            {search}
          </button>
        ))}
      </div>

      <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-gray-500 mt-8 mb-4">Popular categories</h3>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {['Women', 'Men', 'Accessories', 'New Arrivals'].map((cat) => (
          <Link
            key={cat}
            to={cat === 'New Arrivals' ? '/shop?new=true' : `/shop?category=${cat.toLowerCase()}`}
            onClick={onClose}
            className="p-4 text-center bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <p className="font-medium text-gray-900">{cat}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

function SearchResults({ query }) {
  // In a real app, this would fetch from an API
  // For now, we'll show a message
  return (
    <div className="max-w-2xl mx-auto text-center py-12">
      <p className="text-gray-500 mb-4">Showing results for <span className="font-medium text-gray-900">"{query}"</span></p>
      <p className="text-sm text-gray-400">Search functionality will connect to your backend API</p>
    </div>
  );
}