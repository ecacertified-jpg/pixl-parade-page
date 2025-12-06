import { useState, useEffect, useCallback } from 'react';

const OFFLINE_STORAGE_KEY = 'joie_de_vivre_offline_data';

interface OfflineData {
  favorites: any[];
  funds: any[];
  products: any[];
  lastSync: string | null;
}

const defaultData: OfflineData = {
  favorites: [],
  funds: [],
  products: [],
  lastSync: null,
};

export function useOfflineData() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineData, setOfflineData] = useState<OfflineData>(defaultData);

  // Load data from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(OFFLINE_STORAGE_KEY);
      if (stored) {
        setOfflineData(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading offline data:', error);
    }
  }, []);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Save favorites to offline storage
  const saveFavorites = useCallback((favorites: any[]) => {
    try {
      const newData = {
        ...offlineData,
        favorites,
        lastSync: new Date().toISOString(),
      };
      localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(newData));
      setOfflineData(newData);
    } catch (error) {
      console.error('Error saving favorites offline:', error);
    }
  }, [offlineData]);

  // Save funds to offline storage
  const saveFunds = useCallback((funds: any[]) => {
    try {
      const newData = {
        ...offlineData,
        funds,
        lastSync: new Date().toISOString(),
      };
      localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(newData));
      setOfflineData(newData);
    } catch (error) {
      console.error('Error saving funds offline:', error);
    }
  }, [offlineData]);

  // Save products to offline storage
  const saveProducts = useCallback((products: any[]) => {
    try {
      const newData = {
        ...offlineData,
        products,
        lastSync: new Date().toISOString(),
      };
      localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(newData));
      setOfflineData(newData);
    } catch (error) {
      console.error('Error saving products offline:', error);
    }
  }, [offlineData]);

  // Clear all offline data
  const clearOfflineData = useCallback(() => {
    try {
      localStorage.removeItem(OFFLINE_STORAGE_KEY);
      setOfflineData(defaultData);
    } catch (error) {
      console.error('Error clearing offline data:', error);
    }
  }, []);

  return {
    isOnline,
    offlineData,
    saveFavorites,
    saveFunds,
    saveProducts,
    clearOfflineData,
    lastSync: offlineData.lastSync,
  };
}
