import { useState, useEffect, useCallback } from 'react';

interface CartItem {
  id: string | number;
  name: string;
  price: number;
  image?: string;
  quantity: number;
}

export const useCart = () => {
  const [itemCount, setItemCount] = useState(0);
  const [items, setItems] = useState<CartItem[]>([]);

  const loadCart = useCallback(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      const cartItems: CartItem[] = JSON.parse(savedCart);
      setItems(cartItems);
      const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
      setItemCount(totalItems);
    } else {
      setItems([]);
      setItemCount(0);
    }
  }, []);

  const saveCart = useCallback((cartItems: CartItem[]) => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
    setItems(cartItems);
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    setItemCount(totalItems);
    window.dispatchEvent(new Event('cartUpdated'));
  }, []);

  const addItem = useCallback((item: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
    const savedCart = localStorage.getItem('cart');
    const cartItems: CartItem[] = savedCart ? JSON.parse(savedCart) : [];
    
    const existingIndex = cartItems.findIndex(i => String(i.id) === String(item.id));
    
    if (existingIndex >= 0) {
      cartItems[existingIndex].quantity += item.quantity || 1;
    } else {
      cartItems.push({
        ...item,
        quantity: item.quantity || 1
      });
    }
    
    saveCart(cartItems);
  }, [saveCart]);

  const removeItem = useCallback((itemId: string | number) => {
    const savedCart = localStorage.getItem('cart');
    if (!savedCart) return;
    
    const cartItems: CartItem[] = JSON.parse(savedCart);
    const filteredItems = cartItems.filter(i => String(i.id) !== String(itemId));
    saveCart(filteredItems);
  }, [saveCart]);

  const updateQuantity = useCallback((itemId: string | number, quantity: number) => {
    const savedCart = localStorage.getItem('cart');
    if (!savedCart) return;
    
    const cartItems: CartItem[] = JSON.parse(savedCart);
    const itemIndex = cartItems.findIndex(i => String(i.id) === String(itemId));
    
    if (itemIndex >= 0) {
      if (quantity <= 0) {
        cartItems.splice(itemIndex, 1);
      } else {
        cartItems[itemIndex].quantity = quantity;
      }
      saveCart(cartItems);
    }
  }, [saveCart]);

  const clearCart = useCallback(() => {
    localStorage.removeItem('cart');
    setItems([]);
    setItemCount(0);
    window.dispatchEvent(new Event('cartUpdated'));
  }, []);

  useEffect(() => {
    loadCart();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'cart') {
        loadCart();
      }
    };

    const handleCartUpdate = () => {
      loadCart();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('cartUpdated', handleCartUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, [loadCart]);

  return { 
    itemCount, 
    items, 
    addItem, 
    removeItem, 
    updateQuantity, 
    clearCart 
  };
};
