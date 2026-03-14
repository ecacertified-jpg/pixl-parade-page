import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface FriendCircle {
  id: string;
  name: string;
  color: string;
  created_at: string;
  member_count: number;
  member_contact_ids: string[];
}

export function useFriendCircles() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [circles, setCircles] = useState<FriendCircle[]>([]);
  const [loading, setLoading] = useState(true);
  const [contactCircleMap, setContactCircleMap] = useState<Record<string, string>>({});

  const loadCircles = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const { data: circlesData, error: circlesError } = await supabase
        .from('friend_circles')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at');

      if (circlesError) throw circlesError;

      if (!circlesData || circlesData.length === 0) {
        setCircles([]);
        setContactCircleMap({});
        setLoading(false);
        return;
      }

      const circleIds = circlesData.map(c => c.id);
      const { data: members, error: membersError } = await supabase
        .from('friend_circle_members')
        .select('circle_id, contact_id')
        .in('circle_id', circleIds);

      if (membersError) throw membersError;

      const map: Record<string, string> = {};
      const membersByCircle: Record<string, string[]> = {};

      (members || []).forEach(m => {
        map[m.contact_id] = m.circle_id;
        if (!membersByCircle[m.circle_id]) membersByCircle[m.circle_id] = [];
        membersByCircle[m.circle_id].push(m.contact_id);
      });

      setContactCircleMap(map);
      setCircles(circlesData.map(c => ({
        id: c.id,
        name: c.name,
        color: c.color || '#7A5DC7',
        created_at: c.created_at,
        member_count: (membersByCircle[c.id] || []).length,
        member_contact_ids: membersByCircle[c.id] || [],
      })));
    } catch (error) {
      console.error('Error loading circles:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadCircles();
  }, [loadCircles]);

  const createCircle = async (name: string, color?: string) => {
    if (!user?.id) return null;
    try {
      const { data, error } = await supabase
        .from('friend_circles')
        .insert({ user_id: user.id, name, color: color || '#7A5DC7' })
        .select()
        .single();

      if (error) throw error;
      toast({ title: "Cercle créé", description: `"${name}" a été créé avec succès` });
      await loadCircles();
      return data;
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      return null;
    }
  };

  const deleteCircle = async (circleId: string) => {
    try {
      const { error } = await supabase
        .from('friend_circles')
        .delete()
        .eq('id', circleId);

      if (error) throw error;
      toast({ title: "Cercle supprimé" });
      await loadCircles();
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  };

  const addToCircle = async (circleId: string, contactId: string) => {
    try {
      // Check if already in another circle
      if (contactCircleMap[contactId]) {
        toast({
          title: "Contact déjà assigné",
          description: "Ce contact appartient déjà à un autre cercle. Retirez-le d'abord.",
          variant: "destructive",
        });
        return false;
      }

      const { error } = await supabase
        .from('friend_circle_members')
        .insert({ circle_id: circleId, contact_id: contactId });

      if (error) {
        if (error.code === '23505') {
          toast({ title: "Déjà assigné", description: "Ce contact est déjà dans un cercle", variant: "destructive" });
          return false;
        }
        throw error;
      }
      await loadCircles();
      return true;
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      return false;
    }
  };

  const removeFromCircle = async (contactId: string) => {
    try {
      const { error } = await supabase
        .from('friend_circle_members')
        .delete()
        .eq('contact_id', contactId);

      if (error) throw error;
      await loadCircles();
      return true;
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      return false;
    }
  };

  return {
    circles,
    loading,
    contactCircleMap,
    createCircle,
    deleteCircle,
    addToCircle,
    removeFromCircle,
    refresh: loadCircles,
  };
}
