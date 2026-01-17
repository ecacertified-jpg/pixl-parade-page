import { useState, useEffect, useCallback } from 'react';

export type CompressionQuality = 'low' | 'medium' | 'high';
export type CompressionMode = 'auto' | 'always' | 'never';
export type MaxResolution = 480 | 720 | 1080;

export interface CompressionSettings {
  quality: CompressionQuality;
  maxResolution: MaxResolution;
  mode: CompressionMode;
}

const STORAGE_KEY = 'joie-compression-settings';

const DEFAULT_SETTINGS: CompressionSettings = {
  quality: 'medium',
  maxResolution: 720,
  mode: 'auto',
};

// CRF values for each quality level (lower = better quality, larger file)
export const QUALITY_CRF_MAP: Record<CompressionQuality, number> = {
  low: 32,
  medium: 28,
  high: 23,
};

// Resolution limits
export const RESOLUTION_MAP: Record<MaxResolution, { width: number; height: number }> = {
  480: { width: 854, height: 480 },
  720: { width: 1280, height: 720 },
  1080: { width: 1920, height: 1080 },
};

export function useCompressionSettings() {
  const [settings, setSettings] = useState<CompressionSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings({
          quality: parsed.quality || DEFAULT_SETTINGS.quality,
          maxResolution: parsed.maxResolution || DEFAULT_SETTINGS.maxResolution,
          mode: parsed.mode || DEFAULT_SETTINGS.mode,
        });
      }
    } catch (error) {
      console.warn('Failed to load compression settings:', error);
    }
    setIsLoaded(true);
  }, []);

  // Save settings to localStorage
  const updateSettings = useCallback((newSettings: Partial<CompressionSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (error) {
        console.warn('Failed to save compression settings:', error);
      }
      return updated;
    });
  }, []);

  // Reset to default settings
  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to reset compression settings:', error);
    }
  }, []);

  // Get compression config based on current settings
  const getCompressionConfig = useCallback(() => {
    const resolution = RESOLUTION_MAP[settings.maxResolution];
    const preset: 'fast' | 'medium' | 'slow' = settings.quality === 'low' ? 'fast' : settings.quality === 'high' ? 'slow' : 'medium';
    return {
      crf: QUALITY_CRF_MAP[settings.quality],
      maxWidth: resolution.width,
      maxHeight: resolution.height,
      preset,
    };
  }, [settings]);

  // Should compress based on mode and file
  const shouldCompressFile = useCallback((file: File): boolean => {
    if (settings.mode === 'never') return false;
    if (settings.mode === 'always') return true;
    
    // Auto mode: compress if >10MB or not MP4
    return file.size > 10 * 1024 * 1024 || file.type !== 'video/mp4';
  }, [settings.mode]);

  return {
    settings,
    isLoaded,
    updateSettings,
    resetSettings,
    getCompressionConfig,
    shouldCompressFile,
  };
}
