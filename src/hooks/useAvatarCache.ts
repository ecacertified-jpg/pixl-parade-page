import { useEffect, useRef } from 'react';

interface CacheEntry {
  url: string;
  timestamp: number;
  preloaded: boolean;
}

class AvatarCache {
  private cache = new Map<string, CacheEntry>();
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

  set(key: string, url: string) {
    this.cache.set(key, {
      url,
      timestamp: Date.now(),
      preloaded: false,
    });
  }

  get(key: string): string | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if cache is expired
    if (Date.now() - entry.timestamp > this.CACHE_DURATION) {
      this.cache.delete(key);
      return null;
    }

    return entry.url;
  }

  preload(key: string, url: string) {
    const cached = this.cache.get(key);
    
    // Don't preload if already cached and preloaded
    if (cached?.preloaded) return;

    // Preload the image
    const img = new Image();
    img.src = url;
    
    img.onload = () => {
      this.cache.set(key, {
        url,
        timestamp: Date.now(),
        preloaded: true,
      });
    };
  }

  clear() {
    this.cache.clear();
  }

  invalidate(key: string) {
    this.cache.delete(key);
  }
}

const avatarCache = new AvatarCache();

export function useAvatarCache(userId: string | null | undefined, avatarUrl: string | null | undefined) {
  const cacheKey = userId || '';
  const preloadedRef = useRef(false);

  useEffect(() => {
    if (!userId || !avatarUrl) return;

    // Check cache first
    const cachedUrl = avatarCache.get(cacheKey);
    
    if (!cachedUrl) {
      // Cache the URL
      avatarCache.set(cacheKey, avatarUrl);
    }

    // Preload if not already done
    if (!preloadedRef.current) {
      avatarCache.preload(cacheKey, avatarUrl);
      preloadedRef.current = true;
    }
  }, [userId, avatarUrl, cacheKey]);

  const getOptimizedUrl = (url: string | null | undefined, size: number = 96): string | null => {
    if (!url) return null;

    // If it's a Supabase Storage URL, add transformations
    if (url.includes('supabase.co/storage')) {
      const urlObj = new URL(url);
      urlObj.searchParams.set('width', size.toString());
      urlObj.searchParams.set('height', size.toString());
      urlObj.searchParams.set('resize', 'cover');
      urlObj.searchParams.set('format', 'webp');
      urlObj.searchParams.set('quality', '80');
      return urlObj.toString();
    }

    return url;
  };

  return {
    optimizedUrl: getOptimizedUrl(avatarUrl),
    cachedUrl: avatarCache.get(cacheKey),
    invalidateCache: () => avatarCache.invalidate(cacheKey),
  };
}

export { avatarCache };
