// Video source types
export type VideoSource = 'youtube' | 'vimeo' | 'direct';

/**
 * Detect the video source from a URL
 */
export function getVideoSource(url: string): VideoSource {
  if (!url) return 'direct';
  
  const lowercaseUrl = url.toLowerCase();
  
  if (lowercaseUrl.includes('youtube.com') || lowercaseUrl.includes('youtu.be')) {
    return 'youtube';
  }
  
  if (lowercaseUrl.includes('vimeo.com')) {
    return 'vimeo';
  }
  
  return 'direct';
}

/**
 * Extract YouTube video ID from various URL formats
 * Supports:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube.com/v/VIDEO_ID
 */
export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/ // Direct video ID
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
}

/**
 * Extract Vimeo video ID from various URL formats
 * Supports:
 * - https://vimeo.com/VIDEO_ID
 * - https://player.vimeo.com/video/VIDEO_ID
 * - https://vimeo.com/channels/CHANNEL/VIDEO_ID
 */
export function extractVimeoId(url: string): string | null {
  if (!url) return null;
  
  const patterns = [
    /vimeo\.com\/(\d+)/,
    /player\.vimeo\.com\/video\/(\d+)/,
    /vimeo\.com\/channels\/[^\/]+\/(\d+)/,
    /^(\d+)$/ // Direct video ID
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
}

/**
 * Generate YouTube embed URL
 */
export function getYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
}

/**
 * Generate Vimeo embed URL
 */
export function getVimeoEmbedUrl(videoId: string): string {
  return `https://player.vimeo.com/video/${videoId}?autoplay=1`;
}

/**
 * Get YouTube thumbnail URL
 * @param quality - 'default' (120x90), 'mq' (320x180), 'hq' (480x360), 'sd' (640x480), 'maxres' (1280x720)
 */
export function getYouTubeThumbnail(
  videoId: string, 
  quality: 'default' | 'mq' | 'hq' | 'sd' | 'maxres' = 'hq'
): string {
  const qualityMap = {
    default: 'default',
    mq: 'mqdefault',
    hq: 'hqdefault',
    sd: 'sddefault',
    maxres: 'maxresdefault'
  };
  
  return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}.jpg`;
}

/**
 * Get Vimeo thumbnail URL using oEmbed API
 * This is async because it requires an API call
 */
export async function getVimeoThumbnail(videoId: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://vimeo.com/api/oembed.json?url=https://vimeo.com/${videoId}`
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    return data.thumbnail_url || null;
  } catch (error) {
    console.error('Failed to fetch Vimeo thumbnail:', error);
    return null;
  }
}

/**
 * Validate if a URL is a supported video URL
 */
export function isValidVideoUrl(url: string): boolean {
  if (!url) return false;
  
  const source = getVideoSource(url);
  
  if (source === 'youtube') {
    return extractYouTubeId(url) !== null;
  }
  
  if (source === 'vimeo') {
    return extractVimeoId(url) !== null;
  }
  
  // For direct URLs, check if it's a valid URL with video extension or storage URL
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get the appropriate thumbnail for any video type
 */
export async function getVideoThumbnail(url: string): Promise<string | null> {
  const source = getVideoSource(url);
  
  if (source === 'youtube') {
    const videoId = extractYouTubeId(url);
    if (videoId) {
      return getYouTubeThumbnail(videoId, 'hq');
    }
  }
  
  if (source === 'vimeo') {
    const videoId = extractVimeoId(url);
    if (videoId) {
      return getVimeoThumbnail(videoId);
    }
  }
  
  return null;
}

/**
 * Get platform display info for UI
 */
export function getVideoPlatformInfo(url: string): { 
  name: string; 
  icon: 'youtube' | 'vimeo' | 'video';
  color: string;
} {
  const source = getVideoSource(url);
  
  switch (source) {
    case 'youtube':
      return { name: 'YouTube', icon: 'youtube', color: '#FF0000' };
    case 'vimeo':
      return { name: 'Vimeo', icon: 'vimeo', color: '#1AB7EA' };
    default:
      return { name: 'Vidéo', icon: 'video', color: 'hsl(var(--primary))' };
  }
}
