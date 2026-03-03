import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface UserProfile {
  first_name: string | null;
  last_name: string | null;
  city: string | null;
  phone: string | null;
  birthday: string | null;
}

interface DashboardFriend {
  id: string;
  name: string;
  phone: string;
  relation: string;
  location: string;
  birthday: string | Date;
  linked_user_id?: string | null;
}

interface DashboardEvent {
  id: string;
  title: string;
  date: Date;
  type: string;
}

interface DashboardData {
  userProfile: UserProfile | null;
  friends: DashboardFriend[];
  friendsWithWishlist: Set<string>;
  events: DashboardEvent[];
}

const fetchDashboardData = async (userId: string): Promise<DashboardData> => {
  const [profileRes, contactsRes, eventsRes] = await Promise.all([
    supabase.from('profiles').select('first_name, last_name, city, phone, birthday').eq('user_id', userId).single(),
    supabase.from('contacts').select('*').eq('user_id', userId).order('name'),
    supabase.from('user_events').select('*').eq('user_id', userId).order('event_date', { ascending: true }),
  ]);

  const userProfile = profileRes.error ? null : profileRes.data;

  const friends: DashboardFriend[] = (contactsRes.data || []).map(c => ({
    id: c.id, name: c.name, phone: c.phone || '', relation: c.relationship || '',
    location: c.notes || '', birthday: c.birthday || '', linked_user_id: c.linked_user_id,
  }));

  // Fetch wishlist info for linked contacts
  const linkedUserIds = friends.filter(c => c.linked_user_id).map(c => c.linked_user_id!);
  let friendsWithWishlist = new Set<string>();
  if (linkedUserIds.length > 0) {
    const { data: wishlistData } = await supabase
      .from('user_favorites').select('user_id').in('user_id', linkedUserIds);
    friendsWithWishlist = new Set(wishlistData?.map(w => w.user_id) || []);
  }

  const events: DashboardEvent[] = (eventsRes.data || []).map(e => ({
    id: e.id, title: e.title, date: new Date(e.event_date), type: e.event_type,
  }));

  return { userProfile, friends, friendsWithWishlist, events };
};

export function useDashboardData() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading: loading } = useQuery({
    queryKey: ['dashboard-data', user?.id],
    queryFn: () => fetchDashboardData(user!.id),
    enabled: !!user?.id,
    staleTime: 30000,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['dashboard-data', user?.id] });

  return {
    userProfile: data?.userProfile || null,
    friends: data?.friends || [],
    friendsWithWishlist: data?.friendsWithWishlist || new Set<string>(),
    events: data?.events || [],
    loading,
    refreshDashboard: invalidate,
  };
}
