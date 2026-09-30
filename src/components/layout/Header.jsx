import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Search,
  Heart,
  ShoppingBag,
  Menu,
  X,
  User,
  LayoutDashboard,
  LogOut,
  Package,
  ChevronRight,
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useUI } from '../../context/UIContext';
import { useAuth, SESSION } from '../../auth/AuthContext';
import { BACKOFFICE_ROLES } from '../../auth/roles';
import SearchOverlay from './SearchOverlay';

/* Shop navigation — the query strings Shop actually reads. */
const SHOP_NAV = [
  { label: 'Home', to: '/', end: true },
  { label: 'Shop', to: '/shop' },
  { label: 'Women', to: '/shop?category=women' },
  { label: 'Men', to: '/shop?category=men' },
  { label: 'Accessories', to: '/shop?category=accessories' },
  { label: 'New Arrivals', to: '/shop?new=true' },
];

/* Mirrors the mobile drawer grouping. */
const HELP_LINKS = [
  { label: 'Contact', to: '/contact' },
  { label: 'Shipping', to: '/shipping' },
  { label: 'Returns', to: '/returns' },
  { label: 'FAQ', to: '/faq' },
];

/** Count bubble, shown only when there is something to count. */
function CountBubble({ count }) {
  if (!count) return null;
  return (
    <span
      className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-ink text-[0.5625rem] font-semibold tabular-nums text-paper"
      aria-hidden="true"
    >
      {count > 9 ? '9+' : count}
    </span>
  );
}

function IconButton({ label, badge, onClick, to, children, ...rest }) {
  const className =
    'relative -mr-1 p-2 text-ink transition-colors duration-200 hover:text-ink-60';

  const inner = (
    <>
      {children}
      <CountBubble count={badge} />
    </>
  );

  if (to) {
    return (
      <Link to={to} aria-label={label} className={className} {...rest}>
        {inner}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} aria-label={label} className={className} {...rest}>
      {inner}
    </button>
  );
}

export default function Header() {
  const { getItemCount } = useCart();
  const { wishlist } = useWishlist();
  const { isMenuOpen, openMenu, closeMenu, openSearch, openCart } = useUI();
  const { isAuthenticated, isLoading, hasRole, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const menuPanel = useRef(null);

  const cartCount = getItemCount();
  const wishlistCount = wishlist.length;
  const isBackoffice = hasRole(BACKOFFICE_ROLES);

  // Lock the page behind the mobile drawer
  useEffect(() => {
    if (!isMenuOpen) return undefined;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [isMenuOpen]);

  // Escape closes the drawer
  useEffect(() => {
    if (!isMenuOpen) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') closeMenu();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isMenuOpen, closeMenu]);

  // Active state is query-aware so Women/Men/Accessories highlight correctly
  const isShopLinkActive = (to) => {
    if (to === '/') return location.pathname === '/';
    if (to === '/shop') return location.pathname === '/shop' && !location.search;
    return location.pathname === '/shop' && location.search === to.split('?')[1];
  };

  const handleLogout = async () => {
    await logout();
    closeMenu();
    navigate('/');
  };

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-line bg-paper/95 backdrop-blur supports-[backdrop-filter]:bg-paper/85">
        <div className="mx-auto flex h-16 max-w-[90rem] items-center gap-6 px-5 md:h-20 lg:px-12">
          {/* Logo */}
          <Link
            to="/"
            className="shrink-0 font-display text-lg leading-none tracking-tight text-ink transition-opacity hover:opacity-70 md:text-xl"
            aria-label="Bira's Collections — home"
          >
            Bira&rsquo;s <span className="italic">Collections</span>
          </Link>

          {/* Desktop navigation */}
          <nav className="ml-4 hidden flex-1 items-center gap-7 lg:flex" aria-label="Main">
            {SHOP_NAV.map((item) => {
              const active = isShopLinkActive(item.to);
              return (
                <Link
                  key={item.label}
                  to={item.to}
                  aria-current={active ? 'page' : undefined}
                  className={`link-underline py-1 text-[0.8125rem] tracking-wide transition-colors duration-200 ${
                    active ? 'text-ink' : 'text-ink-60 hover:text-ink'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Desktop actions */}
          <div className="ml-auto hidden items-center gap-1 lg:flex">
            {isBackoffice && (
              <Link
                to="/admin"
                className="mr-2 inline-flex items-center gap-2 border border-line px-3.5 py-2 text-[0.6875rem] font-medium uppercase tracking-[0.12em] text-ink transition-colors hover:border-ink hover:bg-sand"
              >
                <LayoutDashboard size={13} strokeWidth={1.75} aria-hidden="true" />
                Admin
              </Link>
            )}

            <IconButton label="Search" onClick={openSearch}>
              <Search size={19} strokeWidth={1.6} />
            </IconButton>

            <IconButton label="Wishlist" to="/wishlist" badge={wishlistCount}>
              <Heart size={19} strokeWidth={1.6} />
            </IconButton>

            {isAuthenticated ? (
              <IconButton label="My account" to="/account">
                <User size={19} strokeWidth={1.6} />
              </IconButton>
            ) : (
              <IconButton label="Sign in" to="/login">
                <User size={19} strokeWidth={1.6} />
              </IconButton>
            )}

            <button
              type="button"
              onClick={openCart}
              aria-label={`Bag${cartCount ? `, ${cartCount} item${cartCount === 1 ? '' : 's'}` : ', empty'}`}
              className="relative -mr-1 p-2 text-ink transition-colors duration-200 hover:text-ink-60"
            >
              <ShoppingBag size={19} strokeWidth={1.6} />
              <CountBubble count={cartCount} />
            </button>
          </div>

          {/* Mobile actions */}
          <div className="ml-auto flex items-center gap-0.5 lg:hidden">
            <IconButton label="Search" onClick={openSearch}>
              <Search size={20} strokeWidth={1.6} />
            </IconButton>
            <IconButton label="Wishlist" to="/wishlist" badge={wishlistCount}>
              <Heart size={20} strokeWidth={1.6} />
            </IconButton>
            <button
              type="button"
              onClick={openCart}
              aria-label={`Bag${cartCount ? `, ${cartCount} item${cartCount === 1 ? '' : 's'}` : ', empty'}`}
              className="relative p-2 text-ink"
            >
              <ShoppingBag size={20} strokeWidth={1.6} />
              <CountBubble count={cartCount} />
            </button>
            <button
              type="button"
              onClick={isMenuOpen ? closeMenu : openMenu}
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu"
              className="-mr-1 p-2 text-ink"
            >
              {isMenuOpen ? <X size={21} strokeWidth={1.75} /> : <Menu size={21} strokeWidth={1.75} />}
            </button>
          </div>
        </div>
      </header>

      {/* ---- Mobile drawer ---- */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div
            className="absolute inset-0 bg-ink/40 animate-fade-in"
            onClick={closeMenu}
            aria-hidden="true"
          />

          <div
            ref={menuPanel}
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="absolute inset-y-0 right-0 flex w-[min(22rem,88vw)] flex-col bg-paper animate-slide-left"
          >
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-5">
              <span className="font-display text-lg text-ink">Menu</span>
              <button
                type="button"
                onClick={closeMenu}
                aria-label="Close menu"
                className="-mr-2 p-2 text-ink-40"
              >
                <X size={20} strokeWidth={1.75} />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto" aria-label="Mobile">
              {/* Shop */}
              <ul className="border-b border-line py-2">
                {SHOP_NAV.map((item) => (
                  <li key={item.label}>
                    <NavLink
                      to={item.to}
                      end={item.end}
                      onClick={closeMenu}
                      className={({ isActive }) =>
                        `flex items-center justify-between px-5 py-3 text-[0.9375rem] transition-colors ${
                          isActive ? 'bg-sand text-ink' : 'text-ink-80 hover:bg-sand'
                        }`
                      }
                    >
                      {item.label}
                    </NavLink>
                  </li>
                ))}
              </ul>

              {/* Account */}
              <div className="border-b border-line py-5">
                <h2 className="t-eyebrow px-5 text-ink-40">Account</h2>
                <ul className="mt-2">
                  {isLoading ? (
                    <li className="px-5 py-3 text-[0.9375rem] text-ink-25">Checking session…</li>
                  ) : isAuthenticated ? (
                    <>
                      <li>
                        <NavLink
                          to="/account"
                          onClick={closeMenu}
                          className="flex items-center justify-between px-5 py-3 text-[0.9375rem] text-ink-80 hover:bg-sand"
                        >
                          Profile
                          <ChevronRight size={15} strokeWidth={1.75} className="text-ink-25" aria-hidden="true" />
                        </NavLink>
                      </li>
                      <li>
                        <NavLink
                          to="/account/orders"
                          onClick={closeMenu}
                          className="flex items-center justify-between px-5 py-3 text-[0.9375rem] text-ink-80 hover:bg-sand"
                        >
                          Orders
                          <Package size={15} strokeWidth={1.75} className="text-ink-25" aria-hidden="true" />
                        </NavLink>
                      </li>
                      <li>
                        <NavLink
                          to="/wishlist"
                          onClick={closeMenu}
                          className="flex items-center justify-between px-5 py-3 text-[0.9375rem] text-ink-80 hover:bg-sand"
                        >
                          Wishlist
                          {wishlistCount > 0 && (
                            <span className="text-[0.75rem] tabular-nums text-ink-40">
                              {wishlistCount}
                            </span>
                          )}
                        </NavLink>
                      </li>
                      {isBackoffice && (
                        <li>
                          <NavLink
                            to="/admin"
                            onClick={closeMenu}
                            className="flex items-center justify-between px-5 py-3 text-[0.9375rem] text-ink-80 hover:bg-sand"
                          >
                            Admin
                            <LayoutDashboard size={15} strokeWidth={1.75} className="text-ink-25" aria-hidden="true" />
                          </NavLink>
                        </li>
                      )}
                      <li>
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="flex w-full items-center justify-between px-5 py-3 text-left text-[0.9375rem] text-ink-80 hover:bg-sand"
                        >
                          Sign out
                          <LogOut size={15} strokeWidth={1.75} className="text-ink-25" aria-hidden="true" />
                        </button>
                      </li>
                    </>
                  ) : (
                    <>
                      <li>
                        <NavLink
                          to="/login"
                          onClick={closeMenu}
                          className="flex items-center justify-between px-5 py-3 text-[0.9375rem] text-ink-80 hover:bg-sand"
                        >
                          Sign in
                        </NavLink>
                      </li>
                      <li>
                        <NavLink
                          to="/register"
                          onClick={closeMenu}
                          className="flex items-center justify-between px-5 py-3 text-[0.9375rem] text-ink-80 hover:bg-sand"
                        >
                          Create account
                        </NavLink>
                      </li>
                    </>
                  )}
                </ul>
              </div>

              {/* Help */}
              <div className="py-5">
                <h2 className="t-eyebrow px-5 text-ink-40">Help</h2>
                <ul className="mt-2">
                  {HELP_LINKS.map((link) => (
                    <li key={link.to}>
                      <NavLink
                        to={link.to}
                        onClick={closeMenu}
                        className="flex items-center justify-between px-5 py-3 text-[0.9375rem] text-ink-80 hover:bg-sand"
                      >
                        {link.label}
                        <ChevronRight size={15} strokeWidth={1.75} className="text-ink-25" aria-hidden="true" />
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            </nav>
          </div>
        </div>
      )}

      <SearchOverlay />
    </>
  );
}
