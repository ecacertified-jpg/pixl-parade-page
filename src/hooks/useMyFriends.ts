import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface FriendItem {
  user_id: string;
  first_name: string | null;
  avatar_url: string | null;
}

export function useMyFriends() {
  const { user } = useAuth();
  const [friends, setFriends] = useState<FriendItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setFriends([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const { data: rels } = await supabase
          .from('contact_relationships')
          .select('user_a, user_b')
          .or(`user_a.eq.${user.id},user_b.eq.${user.id}`);

        const ids = new Set<string>();
        (rels || []).forEach((r) => {
          if (r.user_a === user.id) ids.add(r.user_b);
          else if (r.user_b === user.id) ids.add(r.user_a);
        });

        if (ids.size === 0) {
          if (!cancelled) setFriends([]);
          return;
        }

        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, first_name, avatar_url')
          .in('user_id', Array.from(ids));

        const items: FriendItem[] = (profiles || []).map((p) => ({
          user_id: p.user_id,
          first_name: p.first_name,
          avatar_url: p.avatar_url,
        }));

        if (!cancelled) setFriends(items);
      } catch (err) {
        console.error('useMyFriends error', err);
        if (!cancelled) setFriends([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  return { friends, loading };
}