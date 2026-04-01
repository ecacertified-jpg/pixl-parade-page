import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface BirthdayPageItem {
  id: string;
  slug: string;
  title: string;
  cover_image_url: string | null;
  celebration_year: number;
  user_id: string;
  first_name: string;
  avatar_url: string | null;
  wishes_count: number;
  is_mine: boolean;
}

export function useBirthdayPages() {
  const { user } = useAuth();
  const [myPages, setMyPages] = useState<BirthdayPageItem[]>([]);
  const [prochesPages, setProchesPages] = useState<BirthdayPageItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchAll = async () => {
      setLoading(true);
      try {
        // 1. Fetch my pages
        const { data: myPagesData } = await supabase
          .from('birthday_pages')
          .select('id, slug, title, cover_image_url, celebration_year, user_id')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .order('celebration_year', { ascending: false });

        // 2. Get my profile info
        const { data: myProfile } = await supabase
          .from('profiles')
          .select('first_name, avatar_url')
          .eq('user_id', user.id)
          .maybeSingle();

        // 3. Get wishes count for my pages
        const myItems: BirthdayPageItem[] = [];
        for (const page of myPagesData || []) {
          const { count } = await supabase
            .from('birthday_wishes_messages')
            .select('id', { count: 'exact', head: true })
            .eq('birthday_page_id', page.id);

          myItems.push({
            ...page,
            first_name: myProfile?.first_name || 'Moi',
            avatar_url: myProfile?.avatar_url || null,
            wishes_count: count || 0,
            is_mine: true,
          });
        }
        setMyPages(myItems);

        // 4. Fetch contacts' linked_user_ids
        const { data: contacts } = await supabase
          .from('contacts')
          .select('linked_user_id')
          .eq('user_id', user.id)
          .not('linked_user_id', 'is', null);

        const linkedUserIds = (contacts || [])
          .map(c => c.linked_user_id)
          .filter((id): id is string => !!id && id !== user.id);

        // 5. Fetch pages I contributed to
        const { data: myWishes } = await supabase
          .from('birthday_wishes_messages')
          .select('birthday_page_id')
          .eq('sender_id', user.id);

        const wishedPageIds = [...new Set((myWishes || []).map(w => w.birthday_page_id).filter(Boolean))];

        // 6. Fetch proches pages
        let prochesQuery = supabase
          .from('birthday_pages')
          .select('id, slug, title, cover_image_url, celebration_year, user_id')
          .eq('is_active', true)
          .neq('user_id', user.id)
          .order('celebration_year', { ascending: false });

        // Combine: pages from linked contacts OR pages I contributed to
        const allTargetIds = [...new Set([...linkedUserIds])];
        
        let allProchesPages: typeof myPagesData = [];

        if (allTargetIds.length > 0) {
          const { data } = await supabase
            .from('birthday_pages')
            .select('id, slug, title, cover_image_url, celebration_year, user_id')
            .eq('is_active', true)
            .in('user_id', allTargetIds)
            .order('celebration_year', { ascending: false });
          allProchesPages = data || [];
        }

        // Also fetch pages I contributed to (even if not a contact)
        if (wishedPageIds.length > 0) {
          const { data: wishedPages } = await supabase
            .from('birthday_pages')
            .select('id, slug, title, cover_image_url, celebration_year, user_id')
            .eq('is_active', true)
            .in('id', wishedPageIds as string[])
            .neq('user_id', user.id);
          
          if (wishedPages) {
            const existingIds = new Set(allProchesPages!.map(p => p.id));
            for (const p of wishedPages) {
              if (!existingIds.has(p.id)) allProchesPages!.push(p);
            }
          }
        }

        // 7. Enrich with profile info and wishes count
        const prochesItems: BirthdayPageItem[] = [];
        const uniqueUserIds = [...new Set(allProchesPages!.map(p => p.user_id))];
        
        let profilesMap: Record<string, { first_name: string; avatar_url: string | null }> = {};
        if (uniqueUserIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id, first_name, avatar_url')
            .in('user_id', uniqueUserIds);
          for (const p of profiles || []) {
            profilesMap[p.user_id] = { first_name: p.first_name || 'Ami(e)', avatar_url: p.avatar_url };
          }
        }

        for (const page of allProchesPages || []) {
          const { count } = await supabase
            .from('birthday_wishes_messages')
            .select('id', { count: 'exact', head: true })
            .eq('birthday_page_id', page.id);

          const profile = profilesMap[page.user_id];
          prochesItems.push({
            ...page,
            first_name: profile?.first_name || 'Ami(e)',
            avatar_url: profile?.avatar_url || null,
            wishes_count: count || 0,
            is_mine: false,
          });
        }

        // Sort by celebration_year desc
        prochesItems.sort((a, b) => b.celebration_year - a.celebration_year);
        setProchesPages(prochesItems);
      } catch (err) {
        console.error('Error fetching birthday pages:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [user]);

  const currentYear = new Date().getFullYear();

  return {
    myThisYear: myPages.filter(p => p.celebration_year === currentYear),
    mySouvenirs: myPages.filter(p => p.celebration_year < currentYear),
    prochesThisYear: prochesPages.filter(p => p.celebration_year === currentYear),
    prochesSouvenirs: prochesPages.filter(p => p.celebration_year < currentYear),
    loading,
  };
}
