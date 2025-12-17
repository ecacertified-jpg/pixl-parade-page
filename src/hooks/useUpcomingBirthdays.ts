import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

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

      const today = new Date();
      const upcoming: UpcomingBirthday[] = [];

      contacts?.forEach(contact => {
        if (!contact.birthday) return;

        const birthday = new Date(contact.birthday);
        const thisYearBirthday = new Date(
          today.getFullYear(),
          birthday.getMonth(),
          birthday.getDate()
        );

        let nextBirthday = thisYearBirthday;
        if (thisYearBirthday < today) {
          nextBirthday = new Date(
            today.getFullYear() + 1,
            birthday.getMonth(),
            birthday.getDate()
          );
        }

        const daysUntil = Math.ceil(
          (nextBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );

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
