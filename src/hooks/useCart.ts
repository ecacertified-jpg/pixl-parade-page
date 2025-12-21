import { useState, useEffect, useCallback } from 'react';

interface CartItem {
  id: string | number;
  productId?: string | number;
  name: string;
  price: number;
  image?: string;
  quantity: number;
  vendor?: string;
  locationName?: string;
  currency?: string;
  // Champs pour les cadeaux collaboratifs
  description?: string;
  isCollaborativeGift?: boolean;
  beneficiaryName?: string;
  beneficiaryId?: string;
  beneficiaryContactId?: string;
}

interface StoredCartData {
  items: CartItem[];
  expiresAt: number;
}

// Cart expiry: 2 hours
const CART_EXPIRY_MS = 2 * 60 * 60 * 1000;

// Use sessionStorage for cart data to enhance security (cleared on browser close)
const STORAGE_KEY = 'cart';

function getStorage(): Storage {
  // Prefer sessionStorage for security, fallback to localStorage for persistence
  return typeof window !== 'undefined' ? sessionStorage : ({} as Storage);
}

function isExpired(expiresAt: number): boolean {
  return Date.now() > expiresAt;
}

export const useCart = () => {
  const [itemCount, setItemCount] = useState(0);
  const [items, setItems] = useState<CartItem[]>([]);

  const loadCart = useCallback(() => {
    try {
      const storage = getStorage();
      const savedCart = storage.getItem(STORAGE_KEY);
      
      if (savedCart) {
        const parsed: StoredCartData = JSON.parse(savedCart);
        
        // Check expiry
        if (parsed.expiresAt && isExpired(parsed.expiresAt)) {
          storage.removeItem(STORAGE_KEY);
          setItems([]);
          setItemCount(0);
          return;
        }
        
        const cartItems = parsed.items || [];
        setItems(cartItems);
        const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
        setItemCount(totalItems);
      } else {
        setItems([]);
        setItemCount(0);
      }
    } catch (error) {
      console.error('Error loading cart');
      setItems([]);
      setItemCount(0);
    }
  }, []);

  const saveCart = useCallback((cartItems: CartItem[]) => {
    try {
      const storage = getStorage();
      const data: StoredCartData = {
        items: cartItems,
        expiresAt: Date.now() + CART_EXPIRY_MS
      };
      storage.setItem(STORAGE_KEY, JSON.stringify(data));
      setItems(cartItems);
      const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
      setItemCount(totalItems);
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (error) {
      console.error('Error saving cart');
    }
  }, []);

  const addItem = useCallback((item: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
    try {
      const storage = getStorage();
      const savedCart = storage.getItem(STORAGE_KEY);
      let cartItems: CartItem[] = [];
      
      if (savedCart) {
        const parsed: StoredCartData = JSON.parse(savedCart);
        if (!parsed.expiresAt || !isExpired(parsed.expiresAt)) {
          cartItems = parsed.items || [];
        }
      }
      
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
    } catch (error) {
      console.error('Error adding item to cart');
    }
  }, [saveCart]);

  const removeItem = useCallback((itemId: string | number) => {
    try {
      const storage = getStorage();
      const savedCart = storage.getItem(STORAGE_KEY);
      if (!savedCart) return;
      
      const parsed: StoredCartData = JSON.parse(savedCart);
      const cartItems = parsed.items || [];
      const filteredItems = cartItems.filter(i => String(i.id) !== String(itemId));
      saveCart(filteredItems);
    } catch (error) {
      console.error('Error removing item from cart');
    }
  }, [saveCart]);

  const updateQuantity = useCallback((itemId: string | number, quantity: number) => {
    try {
      const storage = getStorage();
      const savedCart = storage.getItem(STORAGE_KEY);
      if (!savedCart) return;
      
      const parsed: StoredCartData = JSON.parse(savedCart);
      const cartItems = parsed.items || [];
      const itemIndex = cartItems.findIndex(i => String(i.id) === String(itemId));
      
      if (itemIndex >= 0) {
        if (quantity <= 0) {
          cartItems.splice(itemIndex, 1);
        } else {
          cartItems[itemIndex].quantity = quantity;
        }
        saveCart(cartItems);
      }
    } catch (error) {
      console.error('Error updating cart quantity');
    }
  }, [saveCart]);

  const clearCart = useCallback(() => {
    try {
      const storage = getStorage();
      storage.removeItem(STORAGE_KEY);
      // Also clear checkout items
      storage.removeItem('checkoutItems');
      setItems([]);
      setItemCount(0);
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (error) {
      console.error('Error clearing cart');
    }
  }, []);

  // Valide et nettoie le panier en supprimant les articles sans productId valide
  const validateAndCleanCart = useCallback((): { validItems: CartItem[]; removedCount: number } => {
    try {
      const storage = getStorage();
      const savedCart = storage.getItem(STORAGE_KEY);
      if (!savedCart) return { validItems: [], removedCount: 0 };

      const parsed: StoredCartData = JSON.parse(savedCart);
      if (parsed.expiresAt && isExpired(parsed.expiresAt)) {
        storage.removeItem(STORAGE_KEY);
        setItems([]);
        setItemCount(0);
        return { validItems: [], removedCount: 0 };
      }

      const cartItems = parsed.items || [];
      const validItems = cartItems.filter(item => {
        // Un article est valide s'il a un productId OU un id valide (non généré par Date.now())
        const hasValidProductId = item.productId !== undefined && item.productId !== null && item.productId !== '';
        const hasValidId = item.id !== undefined && item.id !== null && item.id !== '';
        // Exclure les IDs qui ressemblent à des timestamps (13+ chiffres)
        const idIsNotTimestamp = typeof item.id !== 'number' || item.id < 1000000000000;
        
        return hasValidProductId || (hasValidId && idIsNotTimestamp);
      });

      const removedCount = cartItems.length - validItems.length;

      if (removedCount > 0) {
        // Sauvegarder le panier nettoyé
        saveCart(validItems);
        console.log(`🧹 Panier nettoyé: ${removedCount} article(s) invalide(s) supprimé(s)`);
      }

      return { validItems, removedCount };
    } catch (error) {
      console.error('Error validating cart');
      return { validItems: [], removedCount: 0 };
    }
  }, [saveCart]);

  useEffect(() => {
    loadCart();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
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
    clearCart,
    validateAndCleanCart
  };
};
