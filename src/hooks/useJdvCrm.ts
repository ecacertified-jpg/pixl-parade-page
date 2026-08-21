import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type CrmPriority = 'TRÈS HAUTE' | 'HAUTE' | 'MOYENNE' | 'BASSE' | 'À ANALYSER';

export interface CrmScoreDetail {
  key: string;
  label: string;
  points: number;
}

export interface CrmRecord {
  crm_id: string | null;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  email: string | null;
  country_code: string | null;
  city: string | null;
  signup_date: string;
  birthday: string | null;
  next_birthday: string | null;
  days_to_birthday: number | null;
  has_birthday_page: boolean;
  has_event_page: boolean;
  page_url: string | null;
  page_status: string | null;
  birthday_page_created_at: string | null;
  event_page_occasion: string | null;
  event_page_date: string | null;
  account_active: boolean;
  last_sign_in_at: string | null;
  last_activity_at: string | null;
  days_since_activity: number | null;
  page_published: boolean;
  page_views: number | null;
  has_fund: boolean;
  first_fund_created_at: string | null;
  fund_active: boolean;
  funds_count: number;
  contributions_count: number;
  total_collected: number;
  has_shared: boolean;
  last_share_at: string | null;
  shares_count: number;
  share_channels: string[] | null;
  sessions_count: number;
  messages_received: number;
  onboarding_furthest_step: number | null;
  onboarding_completed: boolean | null;
  segment: string;
  segment_label: string;
  priority: CrmPriority;
  next_action: string;
  score: number;
  score_details: CrmScoreDetail[];
  statut_reactivation: string;
  statut_doublon: string;
  admin_notes: string | null;
  last_contacted_at: string | null;
}

export interface CrmHistoryEntry {
  id: string;
  user_id: string;
  occurred_at: string;
  canal: string | null;
  campagne: string | null;
  message: string | null;
  statut: string | null;
  reponse: string | null;
  action_suivante: string | null;
  resultat: string | null;
  created_at: string;
}

export interface CrmFilters {
  search?: string;
  country?: string;
  city?: string;
  segment?: string;
  priority?: string;
  score_min?: number;
  score_max?: number;
  has_page?: boolean;
  has_fund?: boolean;
  has_shared?: boolean;
  activity?: 'active' | 'inactive';
  statut_reactivation?: string;
  statut_doublon?: string;
  signup_from?: string;
  signup_to?: string;
  birthday_within_days?: number;
}

export interface CrmStats {
  total: number;
  by_country: Record<string, number>;
  duplicates: number;
  birthday_soon: number;
  no_page: number;
  page_no_fund: number;
  fund_not_shared: number;
  inactive: number;
  very_high_priority: number;
  to_contact: number;
  converted: number;
  segments: Record<string, number>;
  segment_defs: Record<string, { code: string; label: string; priority: CrmPriority; next_action: string }>;
}

export const REACTIVATION_STATUSES = [
  'Non traité', 'À contacter', 'Contacté', 'A répondu', 'Intéressé',
  'A créé une page', 'A créé une cagnotte', 'A partagé', 'Converti',
  'Ne souhaite pas être contacté', 'À revoir',
];

export const DUPLICATE_STATUSES = ['Unique', 'Doublon probable', 'Doublon confirmé', 'À vérifier'];

async function callCrm<T>(payload: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke('admin-crm', { body: payload });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data as T;
}

export function useCrmStats() {
  return useQuery({
    queryKey: ['crm', 'stats'],
    queryFn: () => callCrm<CrmStats>({ action: 'stats' }),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCrmList(filters: CrmFilters, page: number, pageSize = 50, sortBy = 'score') {
  return useQuery({
    queryKey: ['crm', 'list', filters, page, pageSize, sortBy],
    queryFn: () =>
      callCrm<{ total: number; page: number; page_size: number; records: CrmRecord[] }>({
        action: 'list', filters, page, page_size: pageSize, sort_by: sortBy, sort_dir: 'desc',
      }),
    staleTime: 2 * 60 * 1000,
  });
}

export function useCrmDetail(userId: string | null) {
  return useQuery({
    queryKey: ['crm', 'detail', userId],
    queryFn: () =>
      callCrm<{ record: CrmRecord; history: CrmHistoryEntry[]; duplicates: Partial<CrmRecord>[] }>({
        action: 'detail', user_id: userId,
      }),
    enabled: !!userId,
  });
}

export async function fetchCrmExport(filters: CrmFilters) {
  return callCrm<{ total: number; records: CrmRecord[] }>({ action: 'export', filters });
}

export function useCrmMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['crm'] });
  };

  const setStatus = useMutation({
    mutationFn: (params: { user_id: string; statut_reactivation?: string; statut_doublon?: string; admin_notes?: string }) =>
      callCrm({ action: 'set_status', ...params }),
    onSuccess: () => { toast.success('Fiche CRM mise à jour'); invalidate(); },
    onError: (e: Error) => toast.error(e.message || 'Erreur de mise à jour'),
  });

  const addHistory = useMutation({
    mutationFn: (params: {
      user_id: string; canal?: string; campagne?: string; message?: string;
      statut?: string; reponse?: string; action_suivante?: string; resultat?: string;
    }) => callCrm({ action: 'add_history', ...params }),
    onSuccess: () => { toast.success('Action enregistrée'); invalidate(); },
    onError: (e: Error) => toast.error(e.message || 'Erreur d’enregistrement'),
  });

  return { setStatus, addHistory };
}
