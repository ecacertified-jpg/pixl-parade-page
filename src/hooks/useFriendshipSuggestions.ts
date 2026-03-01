import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

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

export function useFriendshipSuggestions(contacts: LinkedContact[]) {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<FriendshipSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const loadSuggestions = useCallback(async () => {
    if (!user || contacts.length === 0) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Get existing relationships for the current user
      const { data: relationships, error: relError } = await supabase
        .from('contact_relationships')
        .select('user_a, user_b')
        .or(`user_a.eq.${user.id},user_b.eq.${user.id}`);

      if (relError) throw relError;

      // Build a set of linked user IDs that already have a relationship
      const relatedUserIds = new Set<string>();
      (relationships || []).forEach(r => {
        relatedUserIds.add(r.user_a === user.id ? r.user_b : r.user_a);
      });

      // Filter contacts that have a linked_user_id but no relationship
      const missing = contacts.filter(
        c => c.linked_user_id && c.linked_user_id !== user.id && !relatedUserIds.has(c.linked_user_id)
      );

      if (missing.length === 0) {
        setSuggestions([]);
        setLoading(false);
        return;
      }

      // Fetch profiles for the missing linked users
      const linkedIds = [...new Set(missing.map(c => c.linked_user_id))];
      const { data: profiles, error: profError } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, avatar_url')
        .in('user_id', linkedIds);

      if (profError) throw profError;

      const profileMap = new Map(
        (profiles || []).map(p => [p.user_id, p])
      );

      const result: FriendshipSuggestion[] = missing.map(c => {
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

      setSuggestions(result);
    } catch (error) {
      console.error('Error loading friendship suggestions:', error);
    } finally {
      setLoading(false);
    }
  }, [user, contacts]);

  useEffect(() => {
    loadSuggestions();
  }, [loadSuggestions]);

  const confirmRelationship = async (contactId: string, linkedUserId: string) => {
    if (!user) return;

    try {
      const userA = user.id < linkedUserId ? user.id : linkedUserId;
      const userB = user.id < linkedUserId ? linkedUserId : user.id;

      const { error } = await supabase
        .from('contact_relationships')
        .insert({
          user_a: userA,
          user_b: userB,
          can_see_funds: true,
          relationship_type: 'friend',
        });

      if (error) throw error;

      setSuggestions(prev => prev.filter(s => s.contactId !== contactId));
      toast.success('Relation confirmée !');
    } catch (error: any) {
      // Handle duplicate (already exists via symmetric index)
      if (error?.code === '23505') {
        setSuggestions(prev => prev.filter(s => s.contactId !== contactId));
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
