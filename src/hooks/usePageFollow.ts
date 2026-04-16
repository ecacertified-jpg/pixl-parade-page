import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface FollowEntry {
  page_type: string;
  page_id: string;
}

export function usePageFollow() {
  const { user } = useAuth();
  const [follows, setFollows] = useState<FollowEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setFollows([]);
      setLoading(false);
      return;
    }
    loadFollows();
  }, [user?.id]);

  const loadFollows = async () => {
    if (!user?.id) return;
    try {
      const { data } = await supabase
        .from('page_follows')
        .select('page_type, page_id')
        .eq('user_id', user.id);
      setFollows(data || []);
    } catch (e) {
      console.error('Error loading page follows:', e);
    } finally {
      setLoading(false);
    }
  };

  const isFollowing = useCallback((pageType: string, pageId: string) => {
    return follows.some(f => f.page_type === pageType && f.page_id === pageId);
  }, [follows]);

  const toggleFollow = useCallback(async (pageType: string, pageId: string) => {
    if (!user?.id) {
      toast.error("Connectez-vous pour suivre cette page");
      return;
    }

    const currently = isFollowing(pageType, pageId);

    // Optimistic update
    if (currently) {
      setFollows(prev => prev.filter(f => !(f.page_type === pageType && f.page_id === pageId)));
    } else {
      setFollows(prev => [...prev, { page_type: pageType, page_id: pageId }]);
    }

    try {
      if (currently) {
        await supabase
          .from('page_follows')
          .delete()
          .eq('user_id', user.id)
          .eq('page_type', pageType)
          .eq('page_id', pageId);
      } else {
        await supabase
          .from('page_follows')
          .insert({ user_id: user.id, page_type: pageType, page_id: pageId });
      }
    } catch (e) {
      // Revert on error
      if (currently) {
        setFollows(prev => [...prev, { page_type: pageType, page_id: pageId }]);
      } else {
        setFollows(prev => prev.filter(f => !(f.page_type === pageType && f.page_id === pageId)));
      }
      toast.error("Erreur lors de la mise à jour");
    }
  }, [user?.id, isFollowing]);

  return { follows, isFollowing, toggleFollow, loading };
}
