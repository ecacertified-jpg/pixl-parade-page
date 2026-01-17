// Types for multi-video support on products
import { Json } from '@/integrations/supabase/types';

export interface ProductVideo {
  id: string;
  url: string;
  thumbnail_url: string | null;
  source: 'direct' | 'youtube' | 'vimeo';
  title?: string;
  order: number;
}

export interface VideoItem {
  id: string;
  url: string;
  thumbnailUrl: string | null;
  source: 'direct' | 'youtube' | 'vimeo';
  title?: string;
  order: number;
  file?: File;
  isUploading?: boolean;
  uploadProgress?: number;
  isExisting?: boolean;
}

// Convert database format to frontend format
export function productVideoToVideoItem(video: ProductVideo): VideoItem {
  return {
    id: video.id,
    url: video.url,
    thumbnailUrl: video.thumbnail_url,
    source: video.source,
    title: video.title,
    order: video.order,
    isExisting: true,
  };
}

// Convert frontend format to database format (JSON compatible)
export function videoItemToProductVideo(item: VideoItem): { [key: string]: string | number | null } {
  return {
    id: item.id,
    url: item.url,
    thumbnail_url: item.thumbnailUrl || null,
    source: item.source,
    title: item.title || null,
    order: item.order,
  };
}

// Convert array of VideoItems to JSON array for database
export function videoItemsToJson(items: VideoItem[]): { [key: string]: string | number | null }[] {
  return items.map(videoItemToProductVideo);
}
