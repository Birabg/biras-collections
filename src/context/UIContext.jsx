import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';

/**
 * Presentation-only state: which overlay is open.
 * Kept separate from CartContext so cart data and cart UI stay decoupled.
 */
const UIContext = createContext(null);

export function UIProvider({ children }) {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const closeAll = useCallback(() => {
    setIsCartOpen(false);
    setIsSearchOpen(false);
    setIsMenuOpen(false);
  }, []);

  // Route changes should never leave an overlay hanging open
  useEffect(() => closeAll(), [closeAll]);

  const value = useMemo(
    () => ({
      isCartOpen,
      isSearchOpen,
      isMenuOpen,
      openCart: () => {
        setIsMenuOpen(false);
        setIsSearchOpen(false);
        setIsCartOpen(true);
      },
      closeCart: () => setIsCartOpen(false),
      toggleCart: () => setIsCartOpen((prev) => !prev),
      openSearch: () => {
        setIsMenuOpen(false);
        setIsSearchOpen(true);
      },
      closeSearch: () => setIsSearchOpen(false),
      openMenu: () => {
        setIsCartOpen(false);
        setIsSearchOpen(false);
        setIsMenuOpen(true);
      },
      closeMenu: () => setIsMenuOpen(false),
      closeAll,
    }),
    [isCartOpen, isSearchOpen, isMenuOpen, closeAll],
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI() {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
}
