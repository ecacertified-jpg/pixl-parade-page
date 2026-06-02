import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { OrganizationPageType, OrganizerRole } from '@/types/organization';

interface AccessState {
  loading: boolean;
  canManage: boolean;
  isOwner: boolean;
  role: OrganizerRole | null;
}

/**
 * Decides whether the current user can open the private "Organisation" tab.
 * Owner = creator of the page. Co-organizer = accepted entry in event_organizers.
 */
export function useOrganizationAccess(
  pageType: OrganizationPageType | null,
  pageId: string | null,
  ownerUserId: string | null,
): AccessState {
  const { user } = useAuth();
  const [state, setState] = useState<AccessState>({
    loading: true, canManage: false, isOwner: false, role: null,
  });

  useEffect(() => {
    let cancelled = false;
    if (!user || !pageType || !pageId) {
      setState({ loading: false, canManage: false, isOwner: false, role: null });
      return;
    }
    const isOwner = !!ownerUserId && ownerUserId === user.id;
    if (isOwner) {
      setState({ loading: false, canManage: true, isOwner: true, role: 'admin' });
      return;
    }
    (async () => {
      const { data } = await (supabase as any)
        .from('event_organizers')
        .select('role,status')
        .eq('page_type', pageType)
        .eq('page_id', pageId)
        .eq('user_id', user.id)
        .eq('status', 'accepted')
        .maybeSingle();
      if (cancelled) return;
      if (data) {
        setState({ loading: false, canManage: true, isOwner: false, role: data.role as OrganizerRole });
      } else {
        setState({ loading: false, canManage: false, isOwner: false, role: null });
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id, pageType, pageId, ownerUserId]);

  return state;
}