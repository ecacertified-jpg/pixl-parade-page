import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Contact {
  id: string;
  name: string;
  birthday: string | null;
  user_id: string;
  avatar_url: string | null;
  relationship: string | null;
}

export function useContacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadContacts = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setContacts([]);
        return;
      }

      const { data, error } = await supabase
        .from('contacts')
        .select('id, name, birthday, user_id, avatar_url, relationship')
        .eq('user_id', user.id)
        .order('name', { ascending: true });

      if (error) throw error;
      
      setContacts(data || []);
    } catch (error) {
      console.error('Error loading contacts:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger vos contacts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContacts();
  }, []);

  return { contacts, loading, refresh: loadContacts };
}
