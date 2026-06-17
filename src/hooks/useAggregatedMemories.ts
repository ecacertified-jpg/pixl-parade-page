import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { emotionForOccasion, type MemoryEmotion } from '@/data/memory-emotions';

export interface MemoryItem {
  id: string;
  source: 'birthday' | 'event';
  pageId: string;
  pageSlug: string;
  pageTitle: string;
  occasion: string;
  emotion: MemoryEmotion;
  mediaType: 'image' | 'video' | 'audio';
  mediaUrl: string;
  thumbnailUrl: string | null;
  caption: string | null;
  memoryText: string | null;
  uploaderName: string | null;
  createdAt: string;
  year: number;
}

export interface MemoryAlbum {
  pageId: string;
  source: 'birthday' | 'event';
  slug: string;
  title: string;
  occasion: string;
  emotion: MemoryEmotion;
  year: number;
  coverUrl: string | null;
  count: number;
  items: MemoryItem[];
}

function pickMedia(row: any, source: 'birthday' | 'event'): { type: MemoryItem['mediaType']; url: string; thumb: string | null } | null {
  if (row.video_url) return { type: 'video', url: row.video_url, thumb: row.video_thumbnail_url ?? null };
  if (source === 'birthday' && row.memory_audio_url) return { type: 'audio', url: row.memory_audio_url, thumb: null };
  const img = row.image_url;
  if (img) return { type: 'image', url: img, thumb: img };
  return null;
}

export function useAggregatedMemories() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['aggregated-memories', user?.id],
    enabled: !!user?.id,
    staleTime: 60_000,
    queryFn: async (): Promise<{ items: MemoryItem[]; albums: MemoryAlbum[] }> => {
      if (!user) return { items: [], albums: [] };

      // 1. Birthday pages owned by user
      const { data: bdPages } = await supabase
        .from('birthday_pages')
        .select('id, slug, title, celebration_year, user_id')
        .eq('user_id', user.id);

      // 2. Birthday pages where user was invited (friend)
      const { data: bdFriendRows } = await supabase
        .from('birthday_page_friends')
        .select('page_id, birthday_pages!birthday_page_friends_page_id_fkey(id, slug, title, celebration_year)')
        .eq('friend_user_id', user.id);

      const bdMap = new Map<string, { id: string; slug: string; title: string; year: number }>();
      (bdPages ?? []).forEach((p: any) => bdMap.set(p.id, { id: p.id, slug: p.slug, title: p.title, year: p.celebration_year }));
      (bdFriendRows ?? []).forEach((r: any) => {
        const p = r.birthday_pages;
        if (p && !bdMap.has(p.id)) bdMap.set(p.id, { id: p.id, slug: p.slug, title: p.title, year: p.celebration_year });
      });

      const bdIds = Array.from(bdMap.keys());
      const { data: bdPhotos } = bdIds.length
        ? await supabase
            .from('birthday_page_photos')
            .select('*')
            .in('birthday_page_id', bdIds)
            .order('created_at', { ascending: false })
        : { data: [] as any[] };

      // 3. Event pages
      const { data: evPages } = await supabase
        .from('event_pages')
        .select('id, slug, title, occasion, event_date, creator_id')
        .eq('creator_id', user.id);

      const evMap = new Map<string, { id: string; slug: string; title: string; occasion: string; year: number }>();
      (evPages ?? []).forEach((p: any) => {
        const year = p.event_date ? new Date(p.event_date).getFullYear() : new Date().getFullYear();
        evMap.set(p.id, { id: p.id, slug: p.slug, title: p.title, occasion: p.occasion, year });
      });

      const evIds = Array.from(evMap.keys());
      const { data: evPhotos } = evIds.length
        ? await supabase
            .from('event_page_photos')
            .select('*')
            .in('event_page_id', evIds)
            .order('created_at', { ascending: false })
        : { data: [] as any[] };

      const items: MemoryItem[] = [];

      (bdPhotos ?? []).forEach((row: any) => {
        const page = bdMap.get(row.birthday_page_id);
        if (!page) return;
        const m = pickMedia(row, 'birthday');
        if (!m) return;
        items.push({
          id: row.id,
          source: 'birthday',
          pageId: page.id,
          pageSlug: page.slug,
          pageTitle: page.title,
          occasion: 'birthday',
          emotion: emotionForOccasion('birthday'),
          mediaType: m.type,
          mediaUrl: m.url,
          thumbnailUrl: m.thumb,
          caption: row.caption,
          memoryText: row.memory_text,
          uploaderName: row.uploader_name,
          createdAt: row.created_at,
          year: page.year,
        });
      });

      (evPhotos ?? []).forEach((row: any) => {
        const page = evMap.get(row.event_page_id);
        if (!page) return;
        const m = pickMedia(row, 'event');
        if (!m) return;
        items.push({
          id: row.id,
          source: 'event',
          pageId: page.id,
          pageSlug: page.slug,
          pageTitle: page.title,
          occasion: page.occasion,
          emotion: emotionForOccasion(page.occasion),
          mediaType: m.type,
          mediaUrl: m.url,
          thumbnailUrl: m.thumb,
          caption: row.caption,
          memoryText: row.memory_text,
          uploaderName: row.uploader_name,
          createdAt: row.created_at,
          year: page.year,
        });
      });

      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      // Build albums grouped by page
      const albumMap = new Map<string, MemoryAlbum>();
      items.forEach((it) => {
        const key = `${it.source}:${it.pageId}`;
        const existing = albumMap.get(key);
        if (existing) {
          existing.items.push(it);
          existing.count += 1;
          if (!existing.coverUrl && it.thumbnailUrl) existing.coverUrl = it.thumbnailUrl;
        } else {
          albumMap.set(key, {
            pageId: it.pageId,
            source: it.source,
            slug: it.pageSlug,
            title: it.pageTitle,
            occasion: it.occasion,
            emotion: it.emotion,
            year: it.year,
            coverUrl: it.thumbnailUrl,
            count: 1,
            items: [it],
          });
        }
      });

      const albums = Array.from(albumMap.values()).sort((a, b) => b.year - a.year);

      return { items, albums };
    },
  });
}