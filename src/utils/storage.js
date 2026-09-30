const STORAGE_KEYS = {
  CART: 'biras_cart',
  WISHLIST: 'biras_wishlist',
};

export function getFromStorage(key, defaultValue = []) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

export function setToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    console.error(`Failed to save to localStorage: ${key}`);
  }
}

export function getCart() {
  return getFromStorage(STORAGE_KEYS.CART, []);
}

export function setCart(cart) {
  setToStorage(STORAGE_KEYS.CART, cart);
}

export function getWishlist() {
  return getFromStorage(STORAGE_KEYS.WISHLIST, []);
}

export function setWishlist(wishlist) {
  setToStorage(STORAGE_KEYS.WISHLIST, wishlist);
}