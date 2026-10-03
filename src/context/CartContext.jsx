import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { cartApi } from '../api/cart';
import { useAuth } from '../auth/AuthContext';

const CartContext = createContext(null);

/**
 * Normalizes a backend cart item to the frontend format.
 * The backend returns cart items with their own `id` (cart item ID),
 * which is different from the product ID. We must use this cart item ID
 * for all mutations (update, remove).
 */
function normalizeCartItem(item) {
  return {
    id: item.id,                    // Cart item ID (used for mutations)
    productId: item.productId,      // Product ID (for navigation)
    variantId: item.variantId,
    slug: item.slug,
    name: item.name,
    price: item.price,
    compareAtPrice: item.compareAtPrice,
    image: item.image,
    quantity: item.quantity,
    selectedSize: item.selectedSize ?? item.size ?? null,
    selectedColor: item.selectedColor ?? item.color ?? null,
    inStock: item.inStock,
    stockQuantity: item.stockQuantity,
    lineTotal: item.lineTotal,
  };
}

export function CartProvider({ children }) {
  const [cart, setCartState] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);
  const { isAuthenticated, status: authStatus } = useAuth();

  // Load cart when authenticated
  useEffect(() => {
    let cancelled = false;

    const loadCart = async () => {
      if (!isAuthenticated) {
        setCartState([]);
        setIsLoaded(true);
        return;
      }

      try {
        const data = await cartApi.get();
        if (!cancelled) {
          const items = (data.items ?? data ?? []).map(normalizeCartItem);
          setCartState(items);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to load cart:', err);
          setError(err.message);
          setCartState([]);
        }
      } finally {
        if (!cancelled) setIsLoaded(true);
      }
    };

    loadCart();

    return () => { cancelled = true; };
  }, [isAuthenticated, authStatus]);

  const addItem = useCallback(
    async (product, quantity = 1, selectedSize = null, selectedColor = null) => {
      // Optimistic update - we don't know the cart item ID yet, so we use a
      // temporary composite key. The real cart item ID will come from the server.
      const tempId = `temp-${product.id}-${selectedSize ?? ''}-${selectedColor ?? ''}`;
      
      setCartState((prev) => {
        const index = prev.findIndex(
          (item) =>
            item.productId === product.id &&
            item.selectedSize === selectedSize &&
            item.selectedColor === selectedColor,
        );

        const optimisticItem = {
          id: tempId,
          productId: product.id,
          variantId: product.variantId ?? null,
          slug: product.slug,
          name: product.name,
          price: product.price,
          compareAtPrice: product.compareAtPrice,
          image: product.images?.[0] ?? product.image,
          quantity,
          selectedSize,
          selectedColor,
          inStock: true,
          stockQuantity: product.stock ?? 999,
          lineTotal: product.price * quantity,
        };

        if (index >= 0) {
          return prev.map((item, i) =>
            i === index ? { ...item, quantity: item.quantity + quantity } : item,
          );
        }
        return [...prev, optimisticItem];
      });

      // Sync with server
      try {
        const data = await cartApi.add({
          productId: product.id,
          variantId: product.variantId ?? null,
          quantity,
        });
        // Replace the optimistic item with the real one from server
        setCartState((prev) =>
          prev.map((item) =>
            item.id.startsWith('temp-') && item.productId === product.id
              ? normalizeCartItem(data.items.find(i => i.productId === product.id) ?? data)
              : item,
          ),
        );
        setError(null);
      } catch (err) {
        console.error('Failed to add to cart:', err);
        setError(err.message);
        // Revert optimistic update on error
        setCartState((prev) => prev.filter((item) => !item.id.startsWith('temp-')));
        throw err;
      }
    },
    [],
  );

  const removeItem = useCallback(
    async (cartItemId) => {
      // Optimistic update
      const previousCart = cart;
      setCartState((prev) => prev.filter((item) => item.id !== cartItemId));

      try {
        await cartApi.remove(cartItemId);
        setError(null);
      } catch (err) {
        console.error('Failed to remove from cart:', err);
        setError(err.message);
        // Revert on error
        setCartState(previousCart);
        throw err;
      }
    },
    [cart],
  );

  const updateQuantity = useCallback(
    async (cartItemId, quantity) => {
      if (quantity <= 0) {
        removeItem(cartItemId);
        return;
      }

      // Optimistic update
      const previousCart = cart;
      setCartState((prev) =>
        prev.map((item) =>
          item.id === cartItemId ? { ...item, quantity, lineTotal: item.price * quantity } : item,
        ),
      );

      try {
        const data = await cartApi.update(cartItemId, { quantity });
        // Update with real server data (includes validated lineTotal, stock checks)
        const updatedItem = normalizeCartItem(data.items.find(i => i.id === cartItemId) ?? data);
        setCartState((prev) =>
          prev.map((item) => (item.id === cartItemId ? updatedItem : item)),
        );
        setError(null);
      } catch (err) {
        console.error('Failed to update quantity:', err);
        setError(err.message);
        // Revert on error
        setCartState(previousCart);
        throw err;
      }
    },
    [cart, removeItem],
  );

  const clearCart = useCallback(async () => {
    const previousCart = cart;
    setCartState([]);
    try {
      await cartApi.clear();
      setError(null);
    } catch (err) {
      console.error('Failed to clear cart:', err);
      setError(err.message);
      setCartState(previousCart);
      throw err;
    }
  }, [cart]);

  const getItemCount = useCallback(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart],
  );

  const getSubtotal = useCallback(
    () => cart.reduce((sum, item) => sum + item.lineTotal, 0),
    [cart],
  );

  const getItem = useCallback(
    (cartItemId) => cart.find((item) => item.id === cartItemId),
    [cart],
  );

  const value = useMemo(
    () => ({
      cart,
      isLoaded,
      error,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      getItemCount,
      getSubtotal,
      getItem,
    }),
    [
      cart,
      isLoaded,
      error,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      getItemCount,
      getSubtotal,
      getItem,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}