import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAdminCountry } from '@/contexts/AdminCountryContext';
import { getDaysUntilBirthday } from '@/lib/utils';

export interface BirthdayEntry {
  id: string;
  name: string;
  birthday: string;
  daysUntil: number;
  type: 'user' | 'contact';
  ownerName?: string;
  ownerId?: string;
}

type ViewMode = 'period' | 'month';

export function useAdminBirthdays() {
  const [allEntries, setAllEntries] = useState<BirthdayEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('period');
  const [selectedDays, setSelectedDays] = useState<number>(7);
  const [selectedMonth, setSelectedMonth] = useState<number>(0);
  const { getCountryFilter } = useAdminCountry();

  const countryFilter = getCountryFilter();

  useEffect(() => {
    loadBirthdays();
  }, [countryFilter]);

  const loadBirthdays = async () => {
    setLoading(true);
    try {
      // Fetch user profiles with birthdays
      let profilesQuery = supabase
        .from('profiles')
        .select('user_id, first_name, last_name, birthday, country_code')
        .not('birthday', 'is', null);

      if (countryFilter) {
        profilesQuery = profilesQuery.eq('country_code', countryFilter);
      }

      // Fetch contacts with birthdays
      let contactsQuery = supabase
        .from('contacts')
        .select('id, name, birthday, user_id')
        .not('birthday', 'is', null);

      const [profilesRes, contactsRes] = await Promise.all([
        profilesQuery,
        contactsQuery,
      ]);

      const entries: BirthdayEntry[] = [];

      profilesRes.data?.forEach((p) => {
        if (!p.birthday) return;
        entries.push({
          id: p.user_id,
          name: [p.first_name, p.last_name].filter(Boolean).join(' ') || 'Sans nom',
          birthday: p.birthday,
          daysUntil: getDaysUntilBirthday(p.birthday),
          type: 'user',
        });
      });

      contactsRes.data?.forEach((c) => {
        if (!c.birthday) return;
        entries.push({
          id: c.id,
          name: c.name || 'Sans nom',
          birthday: c.birthday,
          daysUntil: getDaysUntilBirthday(c.birthday),
          type: 'contact',
          ownerId: c.user_id,
        });
      });

      setAllEntries(entries);
    } catch (error) {
      console.error('Error loading admin birthdays:', error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    let result: BirthdayEntry[];

    if (viewMode === 'period') {
      result = allEntries.filter((e) => e.daysUntil <= selectedDays && e.daysUntil >= 0);
      result.sort((a, b) => a.daysUntil - b.daysUntil);
    } else {
      result = allEntries.filter((e) => {
        const parts = e.birthday.split('-');
        const month = parseInt(parts[1], 10) - 1;
        return month === selectedMonth;
      });
      result.sort((a, b) => {
        const dayA = parseInt(a.birthday.split('-')[2], 10);
        const dayB = parseInt(b.birthday.split('-')[2], 10);
        return dayA - dayB;
      });
    }

    return result;
  }, [allEntries, viewMode, selectedDays, selectedMonth]);

  // KPI counts
  const todayCount = useMemo(() => allEntries.filter((e) => e.daysUntil === 0).length, [allEntries]);
  const weekCount = useMemo(() => allEntries.filter((e) => e.daysUntil >= 0 && e.daysUntil <= 7).length, [allEntries]);
  const monthCount = useMemo(() => allEntries.filter((e) => e.daysUntil >= 0 && e.daysUntil <= 30).length, [allEntries]);

  return {
    entries: filtered,
    loading,
    viewMode,
    setViewMode,
    selectedDays,
    setSelectedDays,
    selectedMonth,
    setSelectedMonth,
    todayCount,
    weekCount,
    monthCount,
    total: allEntries.length,
    refresh: loadBirthdays,
  };
}
