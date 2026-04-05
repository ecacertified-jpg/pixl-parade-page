import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface WhatsAppConversation {
  id: string;
  phone_number: string;
  display_name: string | null;
  status: string;
  mode: string;
  assigned_admin_id: string | null;
  last_message_at: string;
  context: any;
  created_at: string;
}

export interface WhatsAppMessage {
  id: string;
  conversation_id: string;
  direction: string;
  content: string;
  message_type: string;
  whatsapp_message_id: string | null;
  status: string;
  metadata: any;
  created_at: string;
}

export function useWhatsAppConversations() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'closed'>('all');
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: conversations = [], isLoading: loadingConversations } = useQuery({
    queryKey: ['whatsapp-conversations', search, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('whatsapp_conversations')
        .select('*')
        .order('last_message_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      if (search.trim()) {
        query = query.or(`phone_number.ilike.%${search}%,display_name.ilike.%${search}%`);
      }

      const { data, error } = await query.limit(100);
      if (error) throw error;
      return (data || []) as WhatsAppConversation[];
    },
  });

  const { data: messages = [], isLoading: loadingMessages } = useQuery({
    queryKey: ['whatsapp-messages', selectedConversationId],
    queryFn: async () => {
      if (!selectedConversationId) return [];
      const { data, error } = await supabase
        .from('whatsapp_messages')
        .select('*')
        .eq('conversation_id', selectedConversationId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []) as WhatsAppMessage[];
    },
    enabled: !!selectedConversationId,
  });

  const { data: stats } = useQuery({
    queryKey: ['whatsapp-conversations-stats'],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [convRes, msgRes, activeRes] = await Promise.all([
        supabase.from('whatsapp_conversations').select('id', { count: 'exact', head: true }),
        supabase.from('whatsapp_messages').select('id', { count: 'exact', head: true }),
        supabase.from('whatsapp_conversations').select('id', { count: 'exact', head: true })
          .gte('last_message_at', today.toISOString()),
      ]);

      return {
        totalConversations: convRes.count || 0,
        totalMessages: msgRes.count || 0,
        activeToday: activeRes.count || 0,
      };
    },
  });

  const toggleMode = useCallback(async (conversationId: string, newMode: 'ai' | 'human') => {
    const { error } = await supabase
      .from('whatsapp_conversations')
      .update({ mode: newMode })
      .eq('id', conversationId);

    if (error) {
      toast.error('Erreur lors du changement de mode');
      console.error('Toggle mode error:', error);
      return;
    }

    toast.success(newMode === 'human' ? 'Mode admin activé' : 'Mode IA activé');
    queryClient.invalidateQueries({ queryKey: ['whatsapp-conversations'] });
  }, [queryClient]);

  const sendAdminReply = useCallback(async (conversationId: string, message: string) => {
    const { data, error } = await supabase.functions.invoke('whatsapp-admin-reply', {
      body: { conversation_id: conversationId, message },
    });

    if (error) {
      toast.error('Erreur lors de l\'envoi du message');
      console.error('Send admin reply error:', error);
      return false;
    }

    queryClient.invalidateQueries({ queryKey: ['whatsapp-messages', conversationId] });
    queryClient.invalidateQueries({ queryKey: ['whatsapp-conversations'] });
    return true;
  }, [queryClient]);

  // Realtime subscription for new messages
  useEffect(() => {
    const channel = supabase
      .channel('whatsapp-messages-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'whatsapp_messages' }, (payload) => {
        const newMsg = payload.new as WhatsAppMessage;
        if (newMsg.conversation_id === selectedConversationId) {
          queryClient.invalidateQueries({ queryKey: ['whatsapp-messages', selectedConversationId] });
        }
        queryClient.invalidateQueries({ queryKey: ['whatsapp-conversations'] });
        queryClient.invalidateQueries({ queryKey: ['whatsapp-conversations-stats'] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedConversationId, queryClient]);

  return {
    conversations,
    messages,
    stats: stats || { totalConversations: 0, totalMessages: 0, activeToday: 0 },
    loadingConversations,
    loadingMessages,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    selectedConversationId,
    setSelectedConversationId,
    toggleMode,
    sendAdminReply,
  };
}
