/**
 * Video validation utilities for duration and metadata extraction
 */

export const VIDEO_VALIDATION_CONFIG = {
  maxDurationSeconds: 180, // 3 minutes
  maxDurationFormatted: '3 minutes',
};

export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  isValid: boolean;
  error?: string;
}

/**
 * Extract metadata from a video file using HTML5 video element
 */
export async function getVideoMetadata(file: File): Promise<VideoMetadata> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    const url = URL.createObjectURL(file);
    
    video.preload = 'metadata';
    video.muted = true;
    
    const cleanup = () => {
      URL.revokeObjectURL(url);
      video.remove();
    };

    video.onloadedmetadata = () => {
      const metadata: VideoMetadata = {
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
        isValid: true,
      };
      cleanup();
      resolve(metadata);
    };

    video.onerror = () => {
      cleanup();
      resolve({
        duration: 0,
        width: 0,
        height: 0,
        isValid: false,
        error: 'Impossible de lire les métadonnées de la vidéo.',
      });
    };

    // Timeout after 10 seconds
    setTimeout(() => {
      cleanup();
      resolve({
        duration: 0,
        width: 0,
        height: 0,
        isValid: false,
        error: 'Délai d\'attente dépassé lors de la lecture de la vidéo.',
      });
    }, 10000);

    video.src = url;
  });
}

/**
 * Validate video duration against max allowed
 */
export function validateVideoDuration(
  durationSeconds: number,
  maxSeconds: number = VIDEO_VALIDATION_CONFIG.maxDurationSeconds
): { valid: boolean; error?: string } {
  if (durationSeconds <= maxSeconds) {
    return { valid: true };
  }

  return {
    valid: false,
    error: `La vidéo dépasse la durée maximale autorisée (${formatDuration(durationSeconds)} / ${formatDuration(maxSeconds)}).`,
  };
}

/**
 * Validate video duration with dynamic config and product type context
 */
export function validateVideoDurationWithConfig(
  durationSeconds: number,
  maxSeconds: number,
  productType?: 'experience' | 'product'
): { valid: boolean; error?: string } {
  if (durationSeconds <= maxSeconds) {
    return { valid: true };
  }

  const typeLabel = productType === 'experience'
    ? 'les expériences'
    : productType === 'product'
      ? 'les produits'
      : 'ce type de produit';

  return {
    valid: false,
    error: `La vidéo dépasse la durée maximale pour ${typeLabel} (${formatDuration(durationSeconds)} / ${formatDuration(maxSeconds)}).`,
  };
}

/**
 * Format seconds to mm:ss or hh:mm:ss format
 */
export function formatDuration(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '0:00';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}
