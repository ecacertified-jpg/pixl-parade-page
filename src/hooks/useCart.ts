import { useState, useEffect } from 'react';

interface CartItem {
  id: number;
  quantity: number;
}

export const useCart = () => {
  const [itemCount, setItemCount] = useState(0);

  const updateCartCount = () => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      const cartItems: CartItem[] = JSON.parse(savedCart);
      const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
      setItemCount(totalItems);
    } else {
      setItemCount(0);
    }
  };

  useEffect(() => {
    // Initial load
    updateCartCount();

    // Listen for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'cart') {
        updateCartCount();
      }
    };

    // Listen for custom cart update events
    const handleCartUpdate = () => {
      updateCartCount();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('cartUpdated', handleCartUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, []);

  return { itemCount };
};
