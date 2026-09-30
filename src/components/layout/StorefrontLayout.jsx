import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AnnouncementBar from './AnnouncementBar';
import Header from './Header';
import Footer from './Footer';
import CartDrawer from '../cart/CartDrawer';

/**
 * Storefront shell — announcement bar, header, page, footer, cart drawer.
 * Every customer-facing route renders inside this, so navigation and the bag
 * are available everywhere rather than only on the homepage.
 *
 * The admin area deliberately does NOT use this shell.
 */
export default function StorefrontLayout() {
  const { pathname, search } = useLocation();

  // Return to the top on navigation, but leave in-page anchors alone
  useEffect(() => {
    if (!search) {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [pathname, search]);

  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[80] focus:bg-ink focus:px-4 focus:py-2 focus:text-[0.8125rem] focus:text-paper"
      >
        Skip to content
      </a>

      <AnnouncementBar />
      <Header />

      <main id="main" className="flex-1">
        <Outlet />
      </main>

      <Footer />
      <CartDrawer />
    </div>
  );
}
