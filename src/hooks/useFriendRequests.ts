import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface SearchResult {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  bio: string | null;
}

export interface FriendRequest {
  id: string;
  requester_id: string;
  target_id: string;
  status: string;
  message: string | null;
  requested_at: string;
  profile?: {
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  };
}

export function useFriendRequests() {
  const { user } = useAuth();
  const [pendingReceived, setPendingReceived] = useState<FriendRequest[]>([]);
  const [pendingSent, setPendingSent] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRequests = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      // Load received requests
      const { data: received } = await supabase
        .from('contact_requests')
        .select('*')
        .eq('target_id', user.id)
        .eq('status', 'pending');

      // Load sent requests
      const { data: sent } = await supabase
        .from('contact_requests')
        .select('*')
        .eq('requester_id', user.id)
        .eq('status', 'pending');

      // Enrich received with requester profiles
      if (received && received.length > 0) {
        const requesterIds = received.map(r => r.requester_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, first_name, last_name, avatar_url')
          .in('user_id', requesterIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
        setPendingReceived(received.map(r => ({
          ...r,
          profile: profileMap.get(r.requester_id) || undefined,
        })));
      } else {
        setPendingReceived([]);
      }

      // Enrich sent with target profiles
      if (sent && sent.length > 0) {
        const targetIds = sent.map(s => s.target_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, first_name, last_name, avatar_url')
          .in('user_id', targetIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
        setPendingSent(sent.map(s => ({
          ...s,
          profile: profileMap.get(s.target_id) || undefined,
        })));
      } else {
        setPendingSent([]);
      }
    } catch (err) {
      console.error('Error loading friend requests:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const searchUsers = useCallback(async (query: string): Promise<SearchResult[]> => {
    if (!user?.id || query.trim().length < 2) return [];

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, avatar_url, bio')
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
        .neq('user_id', user.id)
        .limit(20);

      if (error) throw error;

      // Filter out existing friends (contact_relationships)
      const { data: relationships } = await supabase
        .from('contact_relationships')
        .select('user_a, user_b')
        .or(`user_a.eq.${user.id},user_b.eq.${user.id}`);

      const friendIds = new Set<string>();
      relationships?.forEach(r => {
        if (r.user_a === user.id) friendIds.add(r.user_b);
        if (r.user_b === user.id) friendIds.add(r.user_a);
      });

      return (data || []).filter(p => !friendIds.has(p.user_id));
    } catch (err) {
      console.error('Error searching users:', err);
      return [];
    }
  }, [user?.id]);

  const sendRequest = useCallback(async (targetId: string, message?: string) => {
    if (!user?.id) return false;

    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      const { error } = await supabase
        .from('contact_requests')
        .insert({
          requester_id: user.id,
          target_id: targetId,
          message: message || null,
          status: 'pending',
          expires_at: expiresAt.toISOString(),
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('Une demande est déjà en cours pour cet utilisateur');
        } else {
          throw error;
        }
        return false;
      }

      toast.success('Demande d\'amitié envoyée !');
      await loadRequests();
      return true;
    } catch (err) {
      console.error('Error sending friend request:', err);
      toast.error('Impossible d\'envoyer la demande');
      return false;
    }
  }, [user?.id, loadRequests]);

  const acceptRequest = useCallback(async (requestId: string, requesterId: string) => {
    if (!user?.id) return false;

    try {
      // Update request status
      const { error: updateError } = await supabase
        .from('contact_requests')
        .update({ status: 'accepted', responded_at: new Date().toISOString() })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // Create normalized contact_relationship
      const userA = user.id < requesterId ? user.id : requesterId;
      const userB = user.id < requesterId ? requesterId : user.id;

      const { error: relError } = await supabase
        .from('contact_relationships')
        .insert({
          user_a: userA,
          user_b: userB,
          can_see_funds: true,
          relationship_type: 'friend',
        });

      if (relError && relError.code !== '23505') {
        console.error('Error creating relationship:', relError);
      }

      toast.success('Demande acceptée ! Vous êtes maintenant amis.');
      await loadRequests();
      return true;
    } catch (err) {
      console.error('Error accepting request:', err);
      toast.error('Impossible d\'accepter la demande');
      return false;
    }
  }, [user?.id, loadRequests]);

  const declineRequest = useCallback(async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('contact_requests')
        .update({ status: 'declined', responded_at: new Date().toISOString() })
        .eq('id', requestId);

      if (error) throw error;

      toast.success('Demande refusée');
      await loadRequests();
      return true;
    } catch (err) {
      console.error('Error declining request:', err);
      toast.error('Impossible de refuser la demande');
      return false;
    }
  }, [loadRequests]);

  return {
    pendingReceived,
    pendingSent,
    loading,
    searchUsers,
    sendRequest,
    acceptRequest,
    declineRequest,
    refreshRequests: loadRequests,
  };
}
