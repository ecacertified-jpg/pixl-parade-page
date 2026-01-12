import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface DuplicateAccount {
  user_id: string;
  name: string;
  phone: string | null;
  created_at: string;
  data_counts: {
    contacts?: number;
    funds?: number;
    contributions?: number;
    posts?: number;
    orders?: number;
    products?: number;
  };
}

export interface DuplicateGroup {
  id: string;
  type: 'client' | 'business';
  match_criteria: string[];
  confidence: 'high' | 'medium' | 'low';
  account_ids: string[];
  primary_user_id: string | null;
  status: 'pending' | 'merged' | 'dismissed' | 'reviewed';
  metadata: {
    accounts: DuplicateAccount[];
  };
  detected_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  admin_notes: string | null;
}

interface DuplicateStats {
  total: number;
  pending: number;
  merged: number;
  dismissed: number;
  clientPending: number;
  businessPending: number;
  highConfidence: number;
}

interface Filters {
  type: 'all' | 'client' | 'business';
  confidence: 'all' | 'high' | 'medium' | 'low';
  status: 'all' | 'pending' | 'merged' | 'dismissed' | 'reviewed';
  search: string;
}

export function useDuplicateAccountsDashboard() {
  const { user } = useAuth();
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([]);
  const [stats, setStats] = useState<DuplicateStats>({
    total: 0,
    pending: 0,
    merged: 0,
    dismissed: 0,
    clientPending: 0,
    businessPending: 0,
    highConfidence: 0,
  });
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    type: 'all',
    confidence: 'all',
    status: 'pending',
    search: '',
  });

  const fetchDuplicates = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('detected_duplicate_accounts')
        .select('*')
        .order('detected_at', { ascending: false });

      if (filters.type !== 'all') {
        query = query.eq('type', filters.type);
      }
      if (filters.confidence !== 'all') {
        query = query.eq('confidence', filters.confidence);
      }
      if (filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Type assertion for the metadata field
      const typedData = (data || []).map(item => ({
        ...item,
        metadata: (item.metadata as unknown) as { accounts: DuplicateAccount[] },
      })) as DuplicateGroup[];

      // Filter by search if needed
      let filteredData = typedData;
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredData = typedData.filter(group => {
          const accounts = group.metadata?.accounts || [];
          return accounts.some(acc => 
            acc.name.toLowerCase().includes(searchLower) ||
            acc.phone?.includes(searchLower)
          );
        });
      }

      setDuplicates(filteredData);

      // Fetch stats
      const { data: allData } = await supabase
        .from('detected_duplicate_accounts')
        .select('type, status, confidence');

      if (allData) {
        setStats({
          total: allData.length,
          pending: allData.filter(d => d.status === 'pending').length,
          merged: allData.filter(d => d.status === 'merged').length,
          dismissed: allData.filter(d => d.status === 'dismissed').length,
          clientPending: allData.filter(d => d.type === 'client' && d.status === 'pending').length,
          businessPending: allData.filter(d => d.type === 'business' && d.status === 'pending').length,
          highConfidence: allData.filter(d => d.confidence === 'high' && d.status === 'pending').length,
        });
      }
    } catch (error) {
      console.error('Error fetching duplicates:', error);
      toast.error('Erreur lors du chargement des doublons');
    } finally {
      setLoading(false);
    }
  };

  const runScan = async () => {
    try {
      setScanning(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Session expirée');
        return;
      }

      const response = await fetch(
        `https://vaimfeurvzokepqqqrsl.supabase.co/functions/v1/scan-duplicate-accounts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors du scan');
      }

      toast.success(
        `Scan terminé: ${result.new_inserted} nouveaux groupes détectés`,
        {
          description: `${result.client_groups} clients, ${result.business_groups} prestataires`,
        }
      );

      await fetchDuplicates();
    } catch (error) {
      console.error('Error running scan:', error);
      toast.error('Erreur lors du scan des doublons');
    } finally {
      setScanning(false);
    }
  };

  const updateStatus = async (
    groupId: string,
    status: 'merged' | 'dismissed' | 'reviewed',
    notes?: string
  ) => {
    try {
      const { error } = await supabase
        .from('detected_duplicate_accounts')
        .update({
          status,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
          admin_notes: notes || null,
        })
        .eq('id', groupId);

      if (error) throw error;

      toast.success(
        status === 'merged' 
          ? 'Groupe marqué comme fusionné'
          : status === 'dismissed'
          ? 'Groupe ignoré'
          : 'Groupe marqué comme examiné'
      );

      await fetchDuplicates();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  useEffect(() => {
    fetchDuplicates();
  }, [filters.type, filters.confidence, filters.status]);

  return {
    duplicates,
    stats,
    loading,
    scanning,
    filters,
    setFilters,
    fetchDuplicates,
    runScan,
    updateStatus,
  };
}
