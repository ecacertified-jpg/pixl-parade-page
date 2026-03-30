import { useCallback } from 'react';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface LinkedContact {
  id: string;
  name: string;
  linked_user_id: string;
}

export interface FriendshipSuggestion {
  contactId: string;
  contactName: string;
  linkedUserId: string;
  profileFirstName: string | null;
  profileLastName: string | null;
  profileAvatarUrl: string | null;
}

const fetchSuggestions = async (userId: string, contacts: LinkedContact[]): Promise<FriendshipSuggestion[]> => {
  if (contacts.length === 0) return [];

  const { data: relationships } = await supabase
    .from('contact_relationships')
    .select('user_a, user_b')
    .or(`user_a.eq.${userId},user_b.eq.${userId}`);

  const relatedUserIds = new Set<string>();
  (relationships || []).forEach(r => {
    relatedUserIds.add(r.user_a === userId ? r.user_b : r.user_a);
  });

  const missing = contacts.filter(
    c => c.linked_user_id && c.linked_user_id !== userId && !relatedUserIds.has(c.linked_user_id)
  );

  if (missing.length === 0) return [];

  const linkedIds = [...new Set(missing.map(c => c.linked_user_id))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id, first_name, last_name, avatar_url')
    .in('user_id', linkedIds);

  const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));

  return missing.map(c => {
    const profile = profileMap.get(c.linked_user_id);
    return {
      contactId: c.id,
      contactName: c.name,
      linkedUserId: c.linked_user_id,
      profileFirstName: profile?.first_name || null,
      profileLastName: profile?.last_name || null,
      profileAvatarUrl: profile?.avatar_url || null,
    };
  });
};

export function useFriendshipSuggestions(contacts: LinkedContact[]) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const contactsKey = contacts.map(c => c.id).sort().join(',');

  const { data: suggestions = [], isLoading: loading } = useQuery({
    queryKey: ['friendship-suggestions', user?.id, contactsKey],
    queryFn: () => fetchSuggestions(user!.id, contacts),
    enabled: !!user?.id && contacts.length > 0,
    staleTime: 60_000,
    placeholderData: (prev) => prev,
  });

  const confirmRelationship = async (contactId: string, linkedUserId: string) => {
    if (!user) return;
    try {
      const userA = user.id < linkedUserId ? user.id : linkedUserId;
      const userB = user.id < linkedUserId ? linkedUserId : user.id;
      const { error } = await supabase
        .from('contact_relationships')
        .insert({ user_a: userA, user_b: userB, can_see_funds: true, relationship_type: 'friend' });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['friendship-suggestions', user.id] });
      toast.success('Relation confirmée !');
    } catch (error: any) {
      if (error?.code === '23505') {
        queryClient.invalidateQueries({ queryKey: ['friendship-suggestions', user.id] });
        toast.info('Cette relation existe déjà');
      } else {
        console.error('Error confirming relationship:', error);
        toast.error('Impossible de confirmer la relation');
      }
    }
  };

  const dismissSuggestion = (contactId: string) => {
    setDismissed(prev => new Set(prev).add(contactId));
  };

  const visibleSuggestions = suggestions.filter(s => !dismissed.has(s.contactId));

  return {
    suggestions: visibleSuggestions,
    loading,
    confirmRelationship,
    dismissSuggestion,
  };
}
