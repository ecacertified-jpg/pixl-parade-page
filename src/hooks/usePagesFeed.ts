import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface FeedMedia {
  url: string;
  type: 'image' | 'video';
  videoUrl?: string;
}

export interface FeedPage {
  id: string;
  type: 'birthday' | 'event';
  title: string;
  slug: string;
  occasion: string;
  cover_image_url: string | null;
  created_at: string;
  event_date: string | null;
  creator: {
    user_id: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  };
  album_preview: FeedMedia[];
  album_count: number;
  photo_count: number;
  video_count: number;
  memory_count: number;
  gift_promise_count: number;
  fund: {
    id: string;
    target_amount: number;
    current_amount: number;
    currency: string;
    status: string;
  } | null;
  fund_id: string | null;
  is_friend: boolean;
  published_via_onboarding?: boolean;
}

export function usePagesFeed(filter: 'all' | 'following' = 'all') {
  const { user } = useAuth();
  const [pages, setPages] = useState<FeedPage[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFeed = useCallback(async () => {
    try {
      setLoading(true);

      // Load social data in parallel with pages
      let followingIds: string[] = [];
      let pageFollowSet = new Set<string>();

      if (user?.id) {
        const [followsRes, pageFollowsRes] = await Promise.all([
          supabase.from('user_follows').select('following_id').eq('follower_id', user.id),
          supabase.from('page_follows').select('page_type, page_id').eq('user_id', user.id),
        ]);
        followingIds = (followsRes.data || []).map(f => f.following_id);
        (pageFollowsRes.data || []).forEach(pf => pageFollowSet.add(`${pf.page_type}-${pf.page_id}`));
      }

      // Fetch pages WITHOUT embedded profile joins (which can fail)
      const [birthdayRes, eventRes] = await Promise.all([
        supabase
          .from('birthday_pages')
          .select(`
            id, slug, title, cover_image_url, celebration_year, fund_id, created_at, user_id, published_via_onboarding,
            birthday_page_photos ( id, image_url, media_type, video_url, video_thumbnail_url ),
            collective_funds!birthday_pages_fund_id_fkey ( id, target_amount, current_amount, currency, status )
          `)
          .eq('is_active', true)
          .not('published_at', 'is', null)
          .order('created_at', { ascending: false })
          .limit(200),
        supabase
          .from('event_pages')
          .select(`
            id, slug, title, occasion, cover_image_url, event_date, fund_id, created_at, creator_id,
            event_page_photos ( id, image_url, media_type, video_url, video_thumbnail_url ),
            collective_funds!event_pages_fund_id_fkey ( id, target_amount, current_amount, currency, status )
          `)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(200),
      ]);

      // Collect all creator IDs to fetch profiles separately
      const creatorIds = new Set<string>();
      (birthdayRes.data || []).forEach(bp => creatorIds.add(bp.user_id));
      (eventRes.data || []).forEach(ep => creatorIds.add(ep.creator_id));

      // Fetch profiles in a separate query (robust - won't break if RLS restricts some)
      const profileMap = new Map<string, { user_id: string; first_name: string | null; last_name: string | null; avatar_url: string | null }>();
      if (creatorIds.size > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, first_name, last_name, avatar_url')
          .in('user_id', Array.from(creatorIds));
        (profiles || []).forEach(p => profileMap.set(p.user_id, p));
      }

      // Fetch gift promise counts grouped by page
      const giftPromiseMap = new Map<string, number>();
      const { data: giftPromises } = await supabase
        .from('page_gift_promises' as any)
        .select('page_id, page_type');
      if (giftPromises) {
        for (const gp of giftPromises as any[]) {
          const key = `${gp.page_type}-${gp.page_id}`;
          giftPromiseMap.set(key, (giftPromiseMap.get(key) || 0) + 1);
        }
      }

      const feedPages: FeedPage[] = [];

      if (birthdayRes.data) {
        for (const bp of birthdayRes.data) {
          const profile = profileMap.get(bp.user_id);
          const photos = (bp.birthday_page_photos as any[]) || [];
          const mediaItems: FeedMedia[] = photos
            .map((p: any): FeedMedia | null => {
              if (p.media_type === 'video' || p.video_url) {
                const thumb = p.video_thumbnail_url || p.image_url || '';
                // Conserver l'item même sans miniature : la carte affichera un placeholder.
                if (!thumb && !p.video_url) return null;
                return { url: thumb, type: 'video', videoUrl: p.video_url || undefined };
              }
              if (p.image_url && !p.image_url.match(/\.(mp4|webm|mov|avi)$/i)) {
                return { url: p.image_url, type: 'image' };
              }
              return null;
            })
            .filter((m): m is FeedMedia => !!m);
          const fund = bp.collective_funds as any;
          const creatorId = bp.user_id;
          const isFriend = followingIds.includes(creatorId);

          if (filter === 'following' && !isFriend && !pageFollowSet.has(`birthday-${bp.id}`)) continue;

          const photoCount = photos.filter((p: any) => (p.media_type || 'image') === 'image' && p.image_url).length;
          const videoCount = photos.filter((p: any) => p.media_type === 'video').length;
          const memoryCount = photos.filter((p: any) => p.media_type === 'memory').length;

          feedPages.push({
            id: bp.id,
            type: 'birthday',
            title: bp.title,
            slug: bp.slug,
            occasion: 'Anniversaire',
            cover_image_url: bp.cover_image_url,
            created_at: bp.created_at,
            event_date: null,
            creator: {
              user_id: creatorId,
              first_name: profile?.first_name || null,
              last_name: profile?.last_name || null,
              avatar_url: profile?.avatar_url || null,
            },
            album_preview: mediaItems.slice(0, 4),
            album_count: mediaItems.length,
            photo_count: photoCount,
            video_count: videoCount,
            memory_count: memoryCount,
            gift_promise_count: giftPromiseMap.get(`birthday-${bp.id}`) || 0,
            fund: fund ? {
              id: fund.id,
              target_amount: fund.target_amount,
              current_amount: fund.current_amount,
              currency: fund.currency,
              status: fund.status,
            } : null,
            fund_id: bp.fund_id || null,
            is_friend: isFriend,
            published_via_onboarding: !!(bp as any).published_via_onboarding,
          });
        }
      }

      if (eventRes.data) {
        for (const ep of eventRes.data) {
          const profile = profileMap.get(ep.creator_id);
          const photos = (ep.event_page_photos as any[]) || [];
          const mediaItems: FeedMedia[] = photos
            .map((p: any): FeedMedia | null => {
              if (p.media_type === 'video' || p.video_url) {
                const thumb = p.video_thumbnail_url || p.image_url || '';
                if (!thumb && !p.video_url) return null;
                return { url: thumb, type: 'video', videoUrl: p.video_url || undefined };
              }
              if (p.image_url && !p.image_url.match(/\.(mp4|webm|mov|avi)$/i)) {
                return { url: p.image_url, type: 'image' };
              }
              return null;
            })
            .filter((m): m is FeedMedia => !!m);
          const fund = ep.collective_funds as any;
          const creatorId = ep.creator_id;
          const isFriend = followingIds.includes(creatorId);

          if (filter === 'following' && !isFriend && !pageFollowSet.has(`event-${ep.id}`)) continue;

          const photoCount = photos.filter((p: any) => (p.media_type || 'image') === 'image' && p.image_url).length;
          const videoCount = photos.filter((p: any) => p.media_type === 'video').length;
          const memoryCount = photos.filter((p: any) => p.media_type === 'memory').length;

          feedPages.push({
            id: ep.id,
            type: 'event',
            title: ep.title,
            slug: ep.slug,
            occasion: ep.occasion || 'Événement',
            cover_image_url: ep.cover_image_url,
            created_at: ep.created_at,
            event_date: ep.event_date,
            creator: {
              user_id: creatorId,
              first_name: profile?.first_name || null,
              last_name: profile?.last_name || null,
              avatar_url: profile?.avatar_url || null,
            },
            album_preview: mediaItems.slice(0, 4),
            album_count: mediaItems.length,
            photo_count: photoCount,
            video_count: videoCount,
            memory_count: memoryCount,
            gift_promise_count: giftPromiseMap.get(`event-${ep.id}`) || 0,
            fund: fund ? {
              id: fund.id,
              target_amount: fund.target_amount,
              current_amount: fund.current_amount,
              currency: fund.currency,
              status: fund.status,
            } : null,
            fund_id: ep.fund_id || null,
            is_friend: isFriend,
            published_via_onboarding: false,
          });
        }
      }

      // Sort: own pages first, then onboarding-published, then with content, then by date
      feedPages.sort((a, b) => {
        const aIsOwn = user?.id && a.creator.user_id === user.id ? 1 : 0;
        const bIsOwn = user?.id && b.creator.user_id === user.id ? 1 : 0;
        if (bIsOwn !== aIsOwn) return bIsOwn - aIsOwn;

        const aOnboard = (a as any).published_via_onboarding ? 1 : 0;
        const bOnboard = (b as any).published_via_onboarding ? 1 : 0;
        if (bOnboard !== aOnboard) return bOnboard - aOnboard;

        const aHasContent = (a.album_count > 0 || a.cover_image_url || a.fund) ? 1 : 0;
        const bHasContent = (b.album_count > 0 || b.cover_image_url || b.fund) ? 1 : 0;
        if (bHasContent !== aHasContent) return bHasContent - aHasContent;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      setPages(feedPages);
    } catch (error) {
      console.error('Error loading pages feed:', error);
    } finally {
      setLoading(false);
    }
  }, [filter, user?.id]);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  // Listen for feed refresh events (e.g. after onboarding page creation)
  useEffect(() => {
    const handler = () => loadFeed();
    window.addEventListener('feed-refresh', handler);
    return () => window.removeEventListener('feed-refresh', handler);
  }, [loadFeed]);

  return { pages, loading, refreshFeed: loadFeed };
}
