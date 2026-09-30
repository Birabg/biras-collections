import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { getCart, setCart } from '../utils/storage';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCartState] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Re-hydrate from localStorage on boot
  useEffect(() => {
    setCartState(getCart());
    setIsLoaded(true);
  }, []);

  const commit = useCallback((next) => {
    setCartState(next);
    setCart(next);
  }, []);

  const addItem = useCallback(
    (product, quantity = 1, selectedSize = null, selectedColor = null) => {
      setCartState((prev) => {
        const index = prev.findIndex(
          (item) =>
            item.id === product.id &&
            item.selectedSize === selectedSize &&
            item.selectedColor === selectedColor,
        );

        const next =
          index >= 0
            ? prev.map((item, i) =>
                i === index ? { ...item, quantity: item.quantity + quantity } : item,
              )
            : [
                ...prev,
                {
                  id: product.id,
                  // Stored so cart and drawer can link to /product/:slug, which is
                  // the route the catalogue actually resolves.
                  slug: product.slug,
                  name: product.name,
                  price: product.price,
                  compareAtPrice: product.compareAtPrice,
                  image: product.images?.[0] ?? product.image,
                  quantity,
                  selectedSize,
                  selectedColor,
                },
              ];

        setCart(next);
        return next;
      });
    },
    [],
  );

  const removeItem = useCallback((id, selectedSize = null, selectedColor = null) => {
    setCartState((prev) => {
      const next = prev.filter(
        (item) =>
          !(
            item.id === id &&
            item.selectedSize === selectedSize &&
            item.selectedColor === selectedColor
          ),
      );
      setCart(next);
      return next;
    });
  }, []);

  const updateQuantity = useCallback(
    (id, quantity, selectedSize = null, selectedColor = null) => {
      if (quantity <= 0) {
        removeItem(id, selectedSize, selectedColor);
        return;
      }
      setCartState((prev) => {
        const next = prev.map((item) =>
          item.id === id && item.selectedSize === selectedSize && item.selectedColor === selectedColor
            ? { ...item, quantity }
            : item,
        );
        setCart(next);
        return next;
      });
    },
    [removeItem],
  );

  const clearCart = useCallback(() => commit([]), [commit]);

  const getItemCount = useCallback(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart],
  );

  const getSubtotal = useCallback(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart],
  );

  const getItem = useCallback(
    (id, selectedSize = null, selectedColor = null) =>
      cart.find(
        (item) =>
          item.id === id &&
          item.selectedSize === selectedSize &&
          item.selectedColor === selectedColor,
      ),
    [cart],
  );

  const value = useMemo(
    () => ({
      cart,
      isLoaded,
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
