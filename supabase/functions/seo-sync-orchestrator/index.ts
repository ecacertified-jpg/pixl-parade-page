import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = 'https://vaimfeurvzokepqqqrsl.supabase.co';
const BASE_URL = 'https://joiedevivre-africa.com';
const INDEXNOW_KEY = 'd8f4e2a1b3c5d7e9f0a1b2c3d4e5f6a7';

interface SyncTask {
  id: string;
  entity_type: 'product' | 'business' | 'fund' | 'page';
  entity_id: string;
  action: 'create' | 'update' | 'delete';
  url: string;
  priority: 'high' | 'normal' | 'low';
  metadata: Record<string, unknown>;
}

interface SyncResult {
  processed: number;
  indexnow: { success: boolean; submitted: number };
  sitemap_ping: { google: boolean; bing: boolean };
  errors: string[];
}

// IndexNow submission
async function submitToIndexNow(urls: string[]): Promise<{ success: boolean; submitted: number }> {
  if (urls.length === 0) return { success: true, submitted: 0 };

  try {
    const payload = {
      host: 'joiedevivre-africa.com',
      key: INDEXNOW_KEY,
      keyLocation: `${BASE_URL}/indexnow-key.txt`,
      urlList: urls.slice(0, 10000) // IndexNow limit
    };

    const endpoints = [
      'https://api.indexnow.org/indexnow',
      'https://yandex.com/indexnow'
    ];

    const results = await Promise.allSettled(
      endpoints.map(endpoint =>
        fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
          body: JSON.stringify(payload)
        })
      )
    );

    const successCount = results.filter(r => 
      r.status === 'fulfilled' && (r.value.status === 200 || r.value.status === 202)
    ).length;

    return { success: successCount > 0, submitted: urls.length };
  } catch (error) {
    console.error('IndexNow error:', error);
    return { success: false, submitted: 0 };
  }
}

// Ping sitemaps to Google and Bing
async function pingSitemaps(): Promise<{ google: boolean; bing: boolean }> {
  const sitemapUrl = encodeURIComponent(`${BASE_URL}/sitemap.xml`);
  
  const results = await Promise.allSettled([
    fetch(`https://www.google.com/ping?sitemap=${sitemapUrl}`),
    fetch(`https://www.bing.com/ping?sitemap=${sitemapUrl}`)
  ]);

  return {
    google: results[0].status === 'fulfilled' && results[0].value.ok,
    bing: results[1].status === 'fulfilled' && results[1].value.ok
  };
}

// Process pending queue items
async function processQueue(supabase: ReturnType<typeof createClient>): Promise<SyncResult> {
  const result: SyncResult = {
    processed: 0,
    indexnow: { success: false, submitted: 0 },
    sitemap_ping: { google: false, bing: false },
    errors: []
  };

  try {
    // Fetch unprocessed items, prioritized
    const { data: tasks, error } = await supabase
      .from('seo_sync_queue')
      .select('*')
      .eq('processed', false)
      .order('priority', { ascending: true }) // high first
      .order('created_at', { ascending: true })
      .limit(100);

    if (error) {
      result.errors.push(`Queue fetch error: ${error.message}`);
      return result;
    }

    if (!tasks || tasks.length === 0) {
      console.log('📭 No pending SEO sync tasks');
      return result;
    }

    console.log(`📤 Processing ${tasks.length} SEO sync tasks`);

    // Collect URLs for IndexNow
    const urls = tasks.map((t: SyncTask) => t.url);

    // Submit to IndexNow
    result.indexnow = await submitToIndexNow(urls);

    // Mark tasks as processed
    const taskIds = tasks.map((t: SyncTask) => t.id);
    const { error: updateError } = await supabase
      .from('seo_sync_queue')
      .update({ 
        processed: true, 
        processed_at: new Date().toISOString() 
      })
      .in('id', taskIds);

    if (updateError) {
      result.errors.push(`Queue update error: ${updateError.message}`);
    }

    result.processed = tasks.length;

    // Log to indexnow_submissions for tracking
    const submissions = tasks.map((t: SyncTask) => ({
      url: t.url,
      entity_type: t.entity_type,
      entity_id: t.entity_id,
      submitted_to: result.indexnow.success ? ['bing', 'yandex'] : [],
      status: result.indexnow.success ? 'success' : 'failed'
    }));

    await supabase.from('indexnow_submissions').insert(submissions);

    // Update sync stats
    await supabase
      .from('seo_sync_stats')
      .update({
        stat_value: {
          timestamp: new Date().toISOString(),
          items_processed: result.processed
        },
        last_updated: new Date().toISOString()
      })
      .eq('stat_type', 'last_sync');

  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    result.errors.push(errMsg);
    console.error('Process queue error:', error);
  }

  return result;
}

// Refresh AI catalog stats
async function refreshAICatalog(supabase: ReturnType<typeof createClient>): Promise<boolean> {
  try {
    // Get fresh platform stats
    const { data: stats, error } = await supabase.rpc('get_platform_seo_stats');
    
    if (error) {
      console.error('Stats fetch error:', error);
      return false;
    }

    // Update the platform stats
    await supabase
      .from('seo_sync_stats')
      .update({
        stat_value: stats,
        last_updated: new Date().toISOString()
      })
      .eq('stat_type', 'platform_stats');

    console.log('📊 AI Catalog stats refreshed:', stats);
    return true;
  } catch (error) {
    console.error('Refresh AI catalog error:', error);
    return false;
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      SUPABASE_URL,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let body: { action?: string } = {};
    try {
      body = await req.json();
    } catch {
      body = { action: 'process_queue' };
    }

    const action = body.action || 'process_queue';
    console.log(`🔄 SEO Sync Orchestrator - Action: ${action}`);

    let response: Record<string, unknown> = { action };

    switch (action) {
      case 'process_queue': {
        const result = await processQueue(supabaseAdmin);
        response = { ...response, ...result };
        break;
      }

      case 'ping_sitemaps': {
        const pingResult = await pingSitemaps();
        response = { ...response, sitemap_ping: pingResult };
        console.log('🔔 Sitemap pings:', pingResult);
        break;
      }

      case 'refresh_ai_catalog': {
        const refreshed = await refreshAICatalog(supabaseAdmin);
        response = { ...response, ai_catalog_refreshed: refreshed };
        break;
      }

      case 'full_sync': {
        // Do everything
        const queueResult = await processQueue(supabaseAdmin);
        const pingResult = await pingSitemaps();
        const catalogRefreshed = await refreshAICatalog(supabaseAdmin);
        
        response = {
          ...response,
          ...queueResult,
          sitemap_ping: pingResult,
          ai_catalog_refreshed: catalogRefreshed
        };
        break;
      }

      default:
        response = { ...response, error: 'Unknown action' };
    }

    console.log('✅ SEO Sync completed:', JSON.stringify(response));

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('SEO Sync Orchestrator error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
