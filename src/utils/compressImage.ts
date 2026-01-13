/**
 * Image compression utilities
 */

export interface CompressionOptions {
  quality: number;        // 0-1 (0.1 = 10%, 1 = 100%)
  maxWidth?: number;      // Max width for resizing
  maxHeight?: number;     // Max height for resizing
  format?: 'jpeg' | 'webp';
}

export interface CompressionResult {
  url: string;            // Blob URL
  file: File;             // Compressed file
  originalSize: number;   // Original size in bytes
  compressedSize: number; // Compressed size in bytes
  compressionRatio: number; // Ratio (e.g., 0.65 = 65% of original)
}

export interface QualityPreset {
  quality: number;
  maxWidth?: number;
  label: string;
  description: string;
}

export const QUALITY_PRESETS: Record<string, QualityPreset> = {
  high: { quality: 0.92, label: "Haute", description: "Qualité maximale" },
  medium: { quality: 0.75, label: "Moyenne", description: "Bon équilibre" },
  low: { quality: 0.5, label: "Basse", description: "Fichier léger" },
  web: { quality: 0.8, maxWidth: 1920, label: "Web optimisé", description: "1920px max" },
};

/**
 * Load an image from a source URL or File
 */
function loadImage(src: string | File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.crossOrigin = 'anonymous';
    
    if (src instanceof File) {
      img.src = URL.createObjectURL(src);
    } else {
      img.src = src;
    }
  });
}

/**
 * Get file size from a blob URL or File
 */
export async function getFileSize(src: string | File): Promise<number> {
  if (src instanceof File) {
    return src.size;
  }
  
  try {
    const response = await fetch(src);
    const blob = await response.blob();
    return blob.size;
  } catch {
    return 0;
  }
}

/**
 * Compress an image with given options
 */
export async function compressImage(
  imageSrc: string | File,
  options: CompressionOptions
): Promise<CompressionResult> {
  const { quality, maxWidth, maxHeight, format = 'jpeg' } = options;
  
  const image = await loadImage(imageSrc);
  const originalSize = await getFileSize(imageSrc);
  
  // Calculate new dimensions if resizing is needed
  let width = image.naturalWidth;
  let height = image.naturalHeight;
  
  if (maxWidth && width > maxWidth) {
    const ratio = maxWidth / width;
    width = maxWidth;
    height = Math.round(height * ratio);
  }
  
  if (maxHeight && height > maxHeight) {
    const ratio = maxHeight / height;
    height = maxHeight;
    width = Math.round(width * ratio);
  }
  
  // Create canvas and draw the image
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }
  
  // Fill with white background for JPEG (no transparency)
  if (format === 'jpeg') {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);
  }
  
  ctx.drawImage(image, 0, 0, width, height);
  
  // Clean up blob URL if we created one for a File
  if (imageSrc instanceof File) {
    URL.revokeObjectURL(image.src);
  }
  
  // Convert to blob
  const mimeType = format === 'webp' ? 'image/webp' : 'image/jpeg';
  
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to compress image'));
          return;
        }
        
        const url = URL.createObjectURL(blob);
        const file = new File([blob], `compressed_${Date.now()}.${format}`, { type: mimeType });
        const compressedSize = blob.size;
        
        resolve({
          url,
          file,
          originalSize,
          compressedSize,
          compressionRatio: compressedSize / originalSize
        });
      },
      mimeType,
      quality
    );
  });
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const units = ['B', 'KB', 'MB', 'GB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${units[i]}`;
}

/**
 * Estimate compression without fully applying it (faster for preview)
 */
export async function estimateCompression(
  imageSrc: string | File,
  quality: number
): Promise<{ estimatedSize: number; ratio: number }> {
  const originalSize = await getFileSize(imageSrc);
  
  // Quick estimation based on quality
  // This is a rough estimate - actual compression varies by image content
  const baseRatio = 0.3 + (quality * 0.6); // Range from 30% to 90%
  const estimatedSize = Math.round(originalSize * baseRatio);
  
  return {
    estimatedSize,
    ratio: baseRatio
  };
}
