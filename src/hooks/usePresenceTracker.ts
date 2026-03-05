import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Tracks the current authenticated user's presence via Supabase Realtime Presence.
 * Call this once in the app root (e.g. ProtectedRoute or App layout).
 */
export function usePresenceTracker() {
  const { user } = useAuth();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!user) return;

    // Fetch profile info for presence metadata
    const setupPresence = async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name, avatar_url')
        .eq('user_id', user.id)
        .maybeSingle();

      const channel = supabase.channel('presence:online-users', {
        config: { presence: { key: user.id } },
      });

      channel
        .on('presence', { event: 'sync' }, () => {
          // No-op on tracker side
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await channel.track({
              user_id: user.id,
              first_name: profile?.first_name || '',
              last_name: profile?.last_name || '',
              avatar_url: profile?.avatar_url || null,
              connected_at: new Date().toISOString(),
            });
          }
        });

      channelRef.current = channel;
    };

    setupPresence();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user?.id]);
}
