import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getWishlist, setWishlist } from '../utils/storage';

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const [wishlist, setWishlistState] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setWishlistState(getWishlist());
    setIsLoaded(true);
  }, []);

  const persistWishlist = useCallback((newWishlist) => {
    setWishlistState(newWishlist);
    setWishlist(newWishlist);
  }, []);

  const addItem = useCallback((product) => {
    setWishlistState((prev) => {
      if (prev.some((item) => item.id === product.id)) {
        return prev;
      }
      const newWishlist = [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          compareAtPrice: product.compareAtPrice,
          image: product.images?.[0] || product.image,
          category: product.category,
        },
      ];
      persistWishlist(newWishlist);
      return newWishlist;
    });
  }, [persistWishlist]);

  const removeItem = useCallback((id) => {
    setWishlistState((prev) => {
      const newWishlist = prev.filter((item) => item.id !== id);
      persistWishlist(newWishlist);
      return newWishlist;
    });
  }, [persistWishlist]);

  const toggleItem = useCallback((product) => {
    setWishlistState((prev) => {
      const exists = prev.some((item) => item.id === product.id);
      if (exists) {
        const newWishlist = prev.filter((item) => item.id !== product.id);
        persistWishlist(newWishlist);
        return newWishlist;
      } else {
        const newWishlist = [
          ...prev,
          {
            id: product.id,
            name: product.name,
            price: product.price,
            compareAtPrice: product.compareAtPrice,
            image: product.images?.[0] || product.image,
            category: product.category,
          },
        ];
        persistWishlist(newWishlist);
        return newWishlist;
      }
    });
  }, [persistWishlist]);

  const isInWishlist = useCallback((id) => {
    return wishlist.some((item) => item.id === id);
  }, [wishlist]);

  const clearWishlist = useCallback(() => {
    persistWishlist([]);
  }, [persistWishlist]);

  const value = {
    wishlist,
    isLoaded,
    addItem,
    removeItem,
    toggleItem,
    isInWishlist,
    clearWishlist,
  };

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}