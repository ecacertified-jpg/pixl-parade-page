/**
 * Utility for extracting video thumbnails for timeline visualization
 */

export interface ThumbnailResult {
  thumbnails: string[];
  loading: boolean;
  error: string | null;
}

/**
 * Extracts thumbnails from a video at evenly distributed time intervals
 * @param videoUrl - URL of the video (blob URL or regular URL)
 * @param duration - Total duration of the video in seconds
 * @param thumbnailCount - Number of thumbnails to extract (default: 10)
 * @param thumbnailWidth - Width of each thumbnail in pixels (default: 120)
 * @param rangeStart - Start of the visible range (default: 0)
 * @param rangeEnd - End of the visible range (default: duration)
 * @returns Promise resolving to array of base64 data URLs
 */
export async function extractVideoThumbnails(
  videoUrl: string,
  duration: number,
  thumbnailCount: number = 10,
  thumbnailWidth: number = 120,
  rangeStart: number = 0,
  rangeEnd?: number
): Promise<string[]> {
  const effectiveRangeEnd = rangeEnd ?? duration;
  const rangeDuration = effectiveRangeEnd - rangeStart;
  
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    const thumbnails: string[] = [];
    let currentIndex = 0;

    // Calculate time intervals for thumbnails within the visible range
    const interval = rangeDuration / thumbnailCount;
    const times = Array.from({ length: thumbnailCount }, (_, i) => rangeStart + i * interval + interval / 2);

    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.preload = 'metadata';

    const captureFrame = () => {
      if (currentIndex >= times.length) {
        // All thumbnails captured
        video.src = '';
        resolve(thumbnails);
        return;
      }

      video.currentTime = times[currentIndex];
    };

    video.addEventListener('loadedmetadata', () => {
      // Calculate canvas dimensions maintaining aspect ratio
      const aspectRatio = video.videoWidth / video.videoHeight;
      canvas.width = thumbnailWidth;
      canvas.height = Math.round(thumbnailWidth / aspectRatio);
      
      // Start capturing
      captureFrame();
    });

    video.addEventListener('seeked', () => {
      // Draw current frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert to base64 JPEG with compression
      const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
      thumbnails.push(dataUrl);
      
      currentIndex++;
      captureFrame();
    });

    video.addEventListener('error', () => {
      reject(new Error('Error loading video for thumbnail extraction'));
    });

    video.src = videoUrl;
    video.load();
  });
}

/**
 * Extracts a single thumbnail at a specific time
 * @param videoUrl - URL of the video
 * @param time - Time in seconds to capture
 * @param width - Width of the thumbnail (default: 320)
 * @returns Promise resolving to base64 data URL
 */
export async function extractSingleThumbnail(
  videoUrl: string,
  time: number,
  width: number = 320
): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.preload = 'metadata';

    video.addEventListener('loadedmetadata', () => {
      const aspectRatio = video.videoWidth / video.videoHeight;
      canvas.width = width;
      canvas.height = Math.round(width / aspectRatio);
      video.currentTime = Math.min(time, video.duration - 0.1);
    });

    video.addEventListener('seeked', () => {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      video.src = '';
      resolve(dataUrl);
    });

    video.addEventListener('error', () => {
      reject(new Error('Error loading video for thumbnail extraction'));
    });

    video.src = videoUrl;
    video.load();
  });
}
