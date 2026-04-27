import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface PublishedPage {
  id: string;
  type: 'birthday' | 'event';
  slug: string;
  title: string;
  cover_image_url: string | null;
  occasion: string | null;
  year: number | null;
}

export function useMyPublishedPages() {
  const { user } = useAuth();
  const [pages, setPages] = useState<PublishedPage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setPages([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const [bdRes, evRes] = await Promise.all([
          supabase
            .from('birthday_pages')
            .select('id, slug, title, cover_image_url, celebration_year')
            .eq('user_id', user.id)
            .eq('is_active', true),
          supabase
            .from('event_pages')
            .select('id, slug, title, cover_image_url, occasion, event_date, created_at')
            .eq('creator_id', user.id)
            .eq('is_active', true),
        ]);

        const birthdayItems: PublishedPage[] = (bdRes.data || []).map((p) => ({
          id: p.id,
          type: 'birthday',
          slug: p.slug,
          title: p.title,
          cover_image_url: p.cover_image_url,
          occasion: 'Anniversaire',
          year: p.celebration_year ?? null,
        }));

        const eventItems: PublishedPage[] = (evRes.data || []).map((p: any) => {
          const year = p.event_date
            ? new Date(p.event_date).getFullYear()
            : p.created_at
              ? new Date(p.created_at).getFullYear()
              : null;
          return {
            id: p.id,
            type: 'event',
            slug: p.slug,
            title: p.title,
            cover_image_url: p.cover_image_url,
            occasion: p.occasion ?? 'Événement',
            year,
          };
        });

        const merged = [...birthdayItems, ...eventItems].sort(
          (a, b) => (b.year ?? 0) - (a.year ?? 0),
        );

        if (!cancelled) setPages(merged);
      } catch (err) {
        console.error('useMyPublishedPages error', err);
        if (!cancelled) setPages([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  return { pages, loading };
}