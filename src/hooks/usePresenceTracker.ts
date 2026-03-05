import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Tracks the current authenticated user's presence via Supabase Realtime Presence
 * AND logs session history to user_session_logs table.
 * Call this once in the app root (e.g. ProtectedRoute or App layout).
 */
export function usePresenceTracker() {
  const { user } = useAuth();
  const location = useLocation();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const profileRef = useRef<{ first_name: string; last_name: string; avatar_url: string | null } | null>(null);
  const subscribedRef = useRef(false);

  useEffect(() => {
    if (!user) return;

    const setupPresence = async () => {
      // Fetch profile info for presence metadata
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name, avatar_url')
        .eq('user_id', user.id)
        .maybeSingle();

      profileRef.current = profile || { first_name: '', last_name: '', avatar_url: null };

      // Insert session log
      const { data: sessionLog } = await supabase
        .from('user_session_logs')
        .insert({
          user_id: user.id,
          user_agent: navigator.userAgent,
        })
        .select('id')
        .single();

      if (sessionLog) {
        sessionIdRef.current = sessionLog.id;
      }

      // Heartbeat: update last_active_at every 2 minutes
      heartbeatRef.current = setInterval(async () => {
        if (sessionIdRef.current) {
          await supabase
            .from('user_session_logs')
            .update({ last_active_at: new Date().toISOString() })
            .eq('id', sessionIdRef.current);
        }
      }, 2 * 60 * 1000);

      // Presence channel
      const channel = supabase.channel('presence:online-users', {
        config: { presence: { key: user.id } },
      });

      channel
        .on('presence', { event: 'sync' }, () => {
          // No-op on tracker side
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            subscribedRef.current = true;
            await channel.track({
              user_id: user.id,
              first_name: profileRef.current?.first_name || '',
              last_name: profileRef.current?.last_name || '',
              avatar_url: profileRef.current?.avatar_url || null,
              connected_at: new Date().toISOString(),
              current_page: location.pathname,
            });
          }
        });

      channelRef.current = channel;
    };

    setupPresence();

    return () => {
      subscribedRef.current = false;

      // Close session log
      if (sessionIdRef.current) {
        supabase
          .from('user_session_logs')
          .update({ ended_at: new Date().toISOString() })
          .eq('id', sessionIdRef.current)
          .then(() => {
            sessionIdRef.current = null;
          });
      }

      // Clear heartbeat
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }

      // Remove presence channel
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user?.id]);

  // Re-track on route change
  useEffect(() => {
    if (subscribedRef.current && channelRef.current && profileRef.current && user) {
      channelRef.current.track({
        user_id: user.id,
        first_name: profileRef.current.first_name || '',
        last_name: profileRef.current.last_name || '',
        avatar_url: profileRef.current.avatar_url || null,
        connected_at: new Date().toISOString(),
        current_page: location.pathname,
      });
    }
  }, [location.pathname]);
}
