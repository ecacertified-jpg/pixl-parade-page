import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SEOSyncStats {
  lastSync: string | null;
  itemsProcessed: number;
  platformStats: {
    products_count: number;
    businesses_count: number;
    funds_count: number;
  } | null;
  pendingItems: number;
}

interface SyncResult {
  action: string;
  processed: number;
  indexnow: { success: boolean; submitted: number };
  sitemap_ping?: { google: boolean; bing: boolean };
  ai_catalog_refreshed?: boolean;
  errors: string[];
}

export function useSEOSync() {
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<SEOSyncStats | null>(null);
  const [lastResult, setLastResult] = useState<SyncResult | null>(null);

  /**
   * Fetch current SEO sync statistics
   */
  const fetchStats = useCallback(async () => {
    try {
      // Get last sync info
      const { data: lastSyncData } = await supabase
        .from('seo_sync_stats')
        .select('stat_value')
        .eq('stat_type', 'last_sync')
        .single();

      // Get platform stats
      const { data: platformData } = await supabase
        .from('seo_sync_stats')
        .select('stat_value')
        .eq('stat_type', 'platform_stats')
        .single();

      // Get pending items count
      const { count } = await supabase
        .from('seo_sync_queue')
        .select('*', { count: 'exact', head: true })
        .eq('processed', false);

      const lastSyncValue = lastSyncData?.stat_value as { timestamp: string | null; items_processed: number } | null;
      const platformValue = platformData?.stat_value as { products_count: number; businesses_count: number; funds_count: number } | null;

      setStats({
        lastSync: lastSyncValue?.timestamp || null,
        itemsProcessed: lastSyncValue?.items_processed || 0,
        platformStats: platformValue || null,
        pendingItems: count || 0
      });

    } catch (error) {
      console.error('Error fetching SEO stats:', error);
    }
  }, []);

  /**
   * Trigger a specific SEO sync action
   */
  const triggerSync = useCallback(async (
    action: 'process_queue' | 'ping_sitemaps' | 'refresh_ai_catalog' | 'full_sync' = 'process_queue'
  ): Promise<SyncResult | null> => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('seo-sync-orchestrator', {
        body: { action }
      });

      if (error) {
        toast.error(`Erreur de synchronisation SEO: ${error.message}`);
        return null;
      }

      const result = data as SyncResult;
      setLastResult(result);

      // Show success message based on action
      if (action === 'process_queue' || action === 'full_sync') {
        if (result.processed > 0) {
          toast.success(`${result.processed} URL(s) soumises aux moteurs de recherche`);
        } else {
          toast.info('Aucun élément en attente de synchronisation');
        }
      } else if (action === 'ping_sitemaps') {
        const { google, bing } = result.sitemap_ping || {};
        toast.success(`Sitemaps notifiés - Google: ${google ? '✓' : '✗'}, Bing: ${bing ? '✓' : '✗'}`);
      } else if (action === 'refresh_ai_catalog') {
        toast.success('Catalogue IA rafraîchi');
      }

      // Refresh stats after sync
      await fetchStats();

      return result;

    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Erreur inconnue';
      toast.error(`Erreur: ${errMsg}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [fetchStats]);

  /**
   * Process the pending queue
   */
  const processQueue = useCallback(() => triggerSync('process_queue'), [triggerSync]);

  /**
   * Ping sitemaps to Google and Bing
   */
  const pingSitemaps = useCallback(() => triggerSync('ping_sitemaps'), [triggerSync]);

  /**
   * Refresh AI catalog data
   */
  const refreshAICatalog = useCallback(() => triggerSync('refresh_ai_catalog'), [triggerSync]);

  /**
   * Full sync - process queue, ping sitemaps, refresh AI catalog
   */
  const fullSync = useCallback(() => triggerSync('full_sync'), [triggerSync]);

  /**
   * Manually add a URL to the sync queue
   */
  const queueUrl = useCallback(async (
    entityType: 'product' | 'business' | 'fund' | 'page',
    entityId: string,
    url: string,
    priority: 'high' | 'normal' | 'low' = 'normal',
    metadata?: Record<string, unknown>
  ): Promise<boolean> => {
    try {
      // Use type assertion for the insert since the table was just created
      const { error } = await supabase
        .from('seo_sync_queue' as 'indexnow_submissions')
        .insert({
          entity_type: entityType,
          entity_id: entityId,
          action: 'update',
          url,
          priority,
          metadata: metadata || {}
        } as unknown as { url: string; entity_type: string; entity_id: string; status: string });

      if (error) {
        console.error('Error queuing URL:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error queuing URL:', error);
      return false;
    }
  }, []);

  /**
   * Get recent sync history from indexnow_submissions
   */
  const getRecentSubmissions = useCallback(async (limit = 20) => {
    const { data, error } = await supabase
      .from('indexnow_submissions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching submissions:', error);
      return [];
    }

    return data;
  }, []);

  return {
    // State
    isLoading,
    stats,
    lastResult,
    
    // Actions
    fetchStats,
    processQueue,
    pingSitemaps,
    refreshAICatalog,
    fullSync,
    queueUrl,
    getRecentSubmissions,
    triggerSync
  };
}
