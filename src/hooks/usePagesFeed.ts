import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

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
  album_preview: string[];
  album_count: number;
  fund: {
    id: string;
    target_amount: number;
    current_amount: number;
    currency: string;
    status: string;
  } | null;
  is_friend: boolean;
}

export function usePagesFeed(filter: 'all' | 'following' = 'all') {
  const { user } = useAuth();
  const [pages, setPages] = useState<FeedPage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeed();
  }, [filter, user?.id]);

  const loadFeed = async () => {
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

      // Fetch birthday pages and event pages in parallel
      const [birthdayRes, eventRes] = await Promise.all([
        supabase
          .from('birthday_pages')
          .select(`
            id, slug, title, cover_image_url, celebration_year, fund_id, created_at, user_id,
            profiles!birthday_pages_user_id_fkey ( user_id, first_name, last_name, avatar_url ),
            birthday_page_photos ( id, image_url ),
            collective_funds!birthday_pages_fund_id_fkey ( id, target_amount, current_amount, currency, status )
          `)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(200),
        supabase
          .from('event_pages')
          .select(`
            id, slug, title, occasion, cover_image_url, event_date, fund_id, created_at, creator_id,
            profiles!event_pages_creator_id_fkey ( user_id, first_name, last_name, avatar_url ),
            event_page_photos ( id, image_url ),
            collective_funds!event_pages_fund_id_fkey ( id, target_amount, current_amount, currency, status )
          `)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(200),
      ]);

      const feedPages: FeedPage[] = [];

      if (birthdayRes.data) {
        for (const bp of birthdayRes.data) {
          const profile = bp.profiles as any;
          const photos = (bp.birthday_page_photos as any[]) || [];
          const fund = bp.collective_funds as any;
          const creatorId = profile?.user_id || bp.user_id;
          const isFriend = followingIds.includes(creatorId);

          if (filter === 'following' && !isFriend && !pageFollowSet.has(`birthday-${bp.id}`)) continue;

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
            album_preview: photos.slice(0, 4).map((p: any) => p.image_url),
            album_count: photos.length,
            fund: fund ? {
              id: fund.id,
              target_amount: fund.target_amount,
              current_amount: fund.current_amount,
              currency: fund.currency,
              status: fund.status,
            } : null,
            is_friend: isFriend,
          });
        }
      }

      if (eventRes.data) {
        for (const ep of eventRes.data) {
          const profile = ep.profiles as any;
          const photos = (ep.event_page_photos as any[]) || [];
          const fund = ep.collective_funds as any;
          const creatorId = profile?.user_id || ep.creator_id;
          const isFriend = followingIds.includes(creatorId);

          if (filter === 'following' && !isFriend && !pageFollowSet.has(`event-${ep.id}`)) continue;

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
            album_preview: photos.slice(0, 4).map((p: any) => p.image_url),
            album_count: photos.length,
            fund: fund ? {
              id: fund.id,
              target_amount: fund.target_amount,
              current_amount: fund.current_amount,
              currency: fund.currency,
              status: fund.status,
            } : null,
            is_friend: isFriend,
          });
        }
      }

      // Sort: prioritize pages with content, then by date
      feedPages.sort((a, b) => {
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
  };

  return { pages, loading, refreshFeed: loadFeed };
}
