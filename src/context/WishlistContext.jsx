import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { wishlistApi } from '../api/wishlist';
import { useAuth } from '../auth/AuthContext';

const WishlistContext = createContext(null);

function normalizeWishlistItem(item) {
  return {
    id: item.productId ?? item.id,  // Use productId as the key for wishlist
    productId: item.productId ?? item.id,
    slug: item.slug,
    name: item.name,
    price: item.price,
    compareAtPrice: item.compareAtPrice,
    image: item.image,
    category: item.category,
  };
}

export function WishlistProvider({ children }) {
  const [wishlist, setWishlistState] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);
  const { isAuthenticated, status: authStatus } = useAuth();

  // Load wishlist when authenticated
  useEffect(() => {
    let cancelled = false;

    const loadWishlist = async () => {
      if (!isAuthenticated) {
        setWishlistState([]);
        setIsLoaded(true);
        return;
      }

      try {
        const data = await wishlistApi.get();
        if (!cancelled) {
          const items = (data.items ?? data ?? []).map(normalizeWishlistItem);
          setWishlistState(items);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to load wishlist:', err);
          setError(err.message);
          setWishlistState([]);
        }
      } finally {
        if (!cancelled) setIsLoaded(true);
      }
    };

    loadWishlist();

    return () => { cancelled = true; };
  }, [isAuthenticated, authStatus]);

  const addItem = useCallback(
    async (product) => {
      // Optimistic update
      setWishlistState((prev) => {
        if (prev.some((item) => item.productId === product.id)) return prev;
        return [...prev, normalizeWishlistItem({ ...product, productId: product.id })];
      });

      try {
        await wishlistApi.add({ productId: product.id });
        setError(null);
      } catch (err) {
        console.error('Failed to add to wishlist:', err);
        setError(err.message);
        // Revert on error
        setWishlistState((prev) => prev.filter((item) => item.productId !== product.id));
        throw err;
      }
    },
    [],
  );

  const removeItem = useCallback(
    async (productId) => {
      const previousWishlist = wishlist;
      setWishlistState((prev) => prev.filter((item) => item.productId !== productId));

      try {
        await wishlistApi.remove(productId);
        setError(null);
      } catch (err) {
        console.error('Failed to remove from wishlist:', err);
        setError(err.message);
        setWishlistState(previousWishlist);
        throw err;
      }
    },
    [wishlist],
  );

  const toggleItem = useCallback(
    async (product) => {
      const isIn = wishlist.some((item) => item.productId === product.id);

      // Optimistic update
      setWishlistState((prev) =>
        isIn
          ? prev.filter((item) => item.productId !== product.id)
          : [...prev, normalizeWishlistItem({ ...product, productId: product.id })],
      );

      try {
        await wishlistApi.toggle({ productId: product.id });
        setError(null);
      } catch (err) {
        console.error('Failed to toggle wishlist:', err);
        setError(err.message);
        // Revert on error
        setWishlistState((prev) =>
          isIn ? [...prev, normalizeWishlistItem({ ...product, productId: product.id })] : prev.filter((item) => item.productId !== product.id),
        );
        throw err;
      }
    },
    [wishlist],
  );

  const isInWishlist = useCallback(
    (productId) => wishlist.some((item) => item.productId === productId),
    [wishlist],
  );

  const clearWishlist = useCallback(async () => {
    const previousWishlist = wishlist;
    setWishlistState([]);
    try {
      await wishlistApi.clear();
      setError(null);
    } catch (err) {
      console.error('Failed to clear wishlist:', err);
      setError(err.message);
      setWishlistState(previousWishlist);
      throw err;
    }
  }, [wishlist]);

  const value = useMemo(
    () => ({
      wishlist,
      isLoaded,
      error,
      addItem,
      removeItem,
      toggleItem,
      isInWishlist,
      clearWishlist,
    }),
    [wishlist, isLoaded, error, addItem, removeItem, toggleItem, isInWishlist, clearWishlist],
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