import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { getWishlist, setWishlist } from '../utils/storage';

const WishlistContext = createContext(null);

/** Store the minimum needed to render a card and link to the product. */
function toWishlistItem(product) {
  return {
    id: product.id,
    // Links resolve against /product/:slug, so the slug must be stored
    slug: product.slug,
    name: product.name,
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    image: product.images?.[0] ?? product.image,
    category: product.category,
  };
}

export function WishlistProvider({ children }) {
  const [wishlist, setWishlistState] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setWishlistState(getWishlist());
    setIsLoaded(true);
  }, []);

  const commit = useCallback((next) => {
    setWishlistState(next);
    setWishlist(next);
  }, []);

  const addItem = useCallback(
    (product) => {
      setWishlistState((prev) => {
        if (prev.some((item) => item.id === product.id)) return prev;
        const next = [...prev, toWishlistItem(product)];
        setWishlist(next);
        return next;
      });
    },
    [],
  );

  const removeItem = useCallback((id) => {
    setWishlistState((prev) => {
      const next = prev.filter((item) => item.id !== id);
      setWishlist(next);
      return next;
    });
  }, []);

  const toggleItem = useCallback((product) => {
    setWishlistState((prev) => {
      const next = prev.some((item) => item.id === product.id)
        ? prev.filter((item) => item.id !== product.id)
        : [...prev, toWishlistItem(product)];
      setWishlist(next);
      return next;
    });
  }, []);

  const isInWishlist = useCallback(
    (id) => wishlist.some((item) => item.id === id),
    [wishlist],
  );

  const clearWishlist = useCallback(() => commit([]), [commit]);

  const value = useMemo(
    () => ({
      wishlist,
      isLoaded,
      addItem,
      removeItem,
      toggleItem,
      isInWishlist,
      clearWishlist,
    }),
    [wishlist, isLoaded, addItem, removeItem, toggleItem, isInWishlist, clearWishlist],
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
