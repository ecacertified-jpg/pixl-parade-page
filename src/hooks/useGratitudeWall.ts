import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCountry } from '@/contexts/CountryContext';

export interface GratitudeMessage {
  id: string;
  fund_id: string;
  contributor_id: string;
  beneficiary_id: string;
  message_type: 'auto' | 'personal';
  message_text: string;
  is_public: boolean;
  reaction_count: number;
  created_at: string;
  contributor_name?: string;
  contributor_avatar?: string;
  beneficiary_name?: string;
  fund_title?: string;
}

export const useGratitudeWall = (limit: number = 10) => {
  const { user } = useAuth();
  const { countryCode } = useCountry();
  const [messages, setMessages] = useState<GratitudeMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('gratitude_wall')
        .select(`
          *,
          contributor:profiles!gratitude_wall_contributor_id_fkey(first_name, last_name, avatar_url),
          beneficiary:profiles!gratitude_wall_beneficiary_id_fkey(first_name, last_name),
          fund:collective_funds(title)
        `)
        .eq('is_public', true)
        .eq('country_code', countryCode)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      const formattedMessages: GratitudeMessage[] = (data || []).map((msg: any) => ({
        id: msg.id,
        fund_id: msg.fund_id,
        contributor_id: msg.contributor_id,
        beneficiary_id: msg.beneficiary_id,
        message_type: msg.message_type,
        message_text: msg.message_text,
        is_public: msg.is_public,
        reaction_count: msg.reaction_count,
        created_at: msg.created_at,
        contributor_name: msg.contributor 
          ? `${msg.contributor.first_name || ''} ${msg.contributor.last_name || ''}`.trim() 
          : 'Anonyme',
        contributor_avatar: msg.contributor?.avatar_url,
        beneficiary_name: msg.beneficiary 
          ? `${msg.beneficiary.first_name || ''} ${msg.beneficiary.last_name || ''}`.trim() 
          : 'Quelqu\'un',
        fund_title: msg.fund?.title || 'une cagnotte'
      }));

      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error loading gratitude messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const addReaction = async (messageId: string) => {
    try {
      await supabase.rpc('increment_gratitude_reaction', {
        p_message_id: messageId
      });
      
      // Update local state
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, reaction_count: msg.reaction_count + 1 }
            : msg
        )
      );
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  useEffect(() => {
    loadMessages();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('gratitude-wall-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'gratitude_wall',
          filter: 'is_public=eq.true'
        },
        () => {
          loadMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, countryCode]);

  return { messages, loading, refreshMessages: loadMessages, addReaction };
};
