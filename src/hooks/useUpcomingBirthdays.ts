import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getDaysUntilBirthday } from '@/lib/utils';

export interface UpcomingBirthday {
  id: string;
  contactId: string;
  name: string;
  birthday: string;
  daysUntil: number;
}

export function useUpcomingBirthdays(daysAhead: number = 7) {
  const [birthdays, setBirthdays] = useState<UpcomingBirthday[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUpcomingBirthdays();
  }, [daysAhead]);

  const loadUpcomingBirthdays = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: contacts, error } = await supabase
        .from('contacts')
        .select('id, name, birthday')
        .eq('user_id', user.id)
        .not('birthday', 'is', null);

      if (error) throw error;

      const upcoming: UpcomingBirthday[] = [];

      contacts?.forEach(contact => {
        if (!contact.birthday) return;

        const daysUntil = getDaysUntilBirthday(contact.birthday);

        if (daysUntil <= daysAhead && daysUntil >= 0) {
          upcoming.push({
            id: contact.id,
            contactId: contact.id,
            name: contact.name,
            birthday: contact.birthday,
            daysUntil,
          });
        }
      });

      upcoming.sort((a, b) => a.daysUntil - b.daysUntil);
      setBirthdays(upcoming);
    } catch (error) {
      console.error('Error loading upcoming birthdays:', error);
    } finally {
      setLoading(false);
    }
  };

  return { birthdays, loading, refresh: loadUpcomingBirthdays };
}
