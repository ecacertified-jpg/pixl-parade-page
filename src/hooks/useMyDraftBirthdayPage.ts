import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface DraftBirthdayPage {
  id: string;
  slug: string;
  title: string;
}

/**
 * Returns the user's current-year birthday page if it exists as a DRAFT
 * (is_active=true AND published_at IS NULL). Used by PublishMyBirthdayPageBanner.
 */
export function useMyDraftBirthdayPage() {
  const { user } = useAuth();
  const [draft, setDraft] = useState<DraftBirthdayPage | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDraft = useCallback(async () => {
    if (!user?.id) {
      setDraft(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const currentYear = new Date().getFullYear();
    const { data, error } = await supabase
      .from('birthday_pages')
      .select('id, slug, title, published_at')
      .eq('user_id', user.id)
      .eq('celebration_year', currentYear)
      .eq('is_active', true)
      .is('published_at', null)
      .maybeSingle();
    if (error) {
      console.warn('useMyDraftBirthdayPage error:', error);
      setDraft(null);
    } else if (data) {
      setDraft({ id: data.id, slug: data.slug, title: data.title });
    } else {
      setDraft(null);
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    fetchDraft();
  }, [fetchDraft]);

  useEffect(() => {
    const handler = () => fetchDraft();
    window.addEventListener('feed-refresh', handler);
    return () => window.removeEventListener('feed-refresh', handler);
  }, [fetchDraft]);

  return { draft, loading, refresh: fetchDraft };
}
