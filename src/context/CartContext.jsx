import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getCart, setCart } from '../utils/storage';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCartState] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setCartState(getCart());
    setIsLoaded(true);
  }, []);

  const persistCart = useCallback((newCart) => {
    setCartState(newCart);
    setCart(newCart);
  }, []);

  const addItem = useCallback((product, quantity = 1, selectedSize = null, selectedColor = null) => {
    setCartState((prev) => {
      const existingIndex = prev.findIndex(
        (item) =>
          item.id === product.id &&
          item.selectedSize === selectedSize &&
          item.selectedColor === selectedColor
      );

      let newCart;
      if (existingIndex >= 0) {
        newCart = prev.map((item, index) =>
          index === existingIndex
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        newCart = [
          ...prev,
          {
            id: product.id,
            name: product.name,
            price: product.price,
            compareAtPrice: product.compareAtPrice,
            image: product.images?.[0] || product.image,
            quantity,
            selectedSize,
            selectedColor,
          },
        ];
      }
      persistCart(newCart);
      return newCart;
    });
  }, [persistCart]);

  const removeItem = useCallback((id, selectedSize = null, selectedColor = null) => {
    setCartState((prev) => {
      const newCart = prev.filter(
        (item) =>
          !(item.id === id && item.selectedSize === selectedSize && item.selectedColor === selectedColor)
      );
      persistCart(newCart);
      return newCart;
    });
  }, [persistCart]);

  const updateQuantity = useCallback((id, quantity, selectedSize = null, selectedColor = null) => {
    if (quantity <= 0) {
      removeItem(id, selectedSize, selectedColor);
      return;
    }
    setCartState((prev) => {
      const newCart = prev.map((item) =>
        item.id === id && item.selectedSize === selectedSize && item.selectedColor === selectedColor
          ? { ...item, quantity }
          : item
      );
      persistCart(newCart);
      return newCart;
    });
  }, [persistCart, removeItem]);

  const clearCart = useCallback(() => {
    persistCart([]);
  }, [persistCart]);

  const getItemCount = useCallback(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const getSubtotal = useCallback(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cart]);

  const getItem = useCallback((id, selectedSize = null, selectedColor = null) => {
    return cart.find(
      (item) =>
        item.id === id &&
        item.selectedSize === selectedSize &&
        item.selectedColor === selectedColor
    );
  }, [cart]);

  const value = {
    cart,
    isLoaded,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getItemCount,
    getSubtotal,
    getItem,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}