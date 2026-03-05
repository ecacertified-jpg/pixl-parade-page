import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface OnlineUser {
  user_id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  connected_at: string;
  current_page: string;
}

export function useOnlineUsers() {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    const channel = supabase.channel('presence:online-users');

    const syncUsers = () => {
      const state = channel.presenceState<OnlineUser>();
      const users: OnlineUser[] = [];
      
      for (const key of Object.keys(state)) {
        const presences = state[key];
        if (presences && presences.length > 0) {
          // Take first presence per user key (dedup multiple tabs)
          users.push(presences[0] as unknown as OnlineUser);
        }
      }
      
      setOnlineUsers(users);
    };

    channel
      .on('presence', { event: 'sync' }, syncUsers)
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, []);

  return {
    onlineUsers,
    onlineCount: onlineUsers.length,
  };
}
