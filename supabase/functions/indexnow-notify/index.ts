import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const INDEXNOW_KEY = 'd8f4e2a1b3c5d7e9f0a1b2c3d4e5f6a7';
const BASE_URL = 'https://joiedevivre-africa.com';

// IndexNow endpoints
const INDEXNOW_ENDPOINTS = [
  { name: 'bing', url: 'https://api.indexnow.org/indexnow' },
  { name: 'yandex', url: 'https://yandex.com/indexnow' }
];

interface IndexNowRequest {
  urls: string[];
  entityType?: 'product' | 'business' | 'fund' | 'page';
  entityId?: string;
  priority?: 'high' | 'normal';
}

interface SubmissionResult {
  engine: string;
  success: boolean;
  statusCode?: number;
  error?: string;
}

async function submitToIndexNow(urls: string[], engine: { name: string; url: string }): Promise<SubmissionResult> {
  try {
    // Single URL uses GET, multiple URLs use POST
    if (urls.length === 1) {
      const params = new URLSearchParams({
        url: urls[0],
        key: INDEXNOW_KEY,
      });
      
      const response = await fetch(`${engine.url}?${params}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      return {
        engine: engine.name,
        success: response.status === 200 || response.status === 202,
        statusCode: response.status
      };
    }
    
    // Multiple URLs - use POST with JSON body
    const payload = {
      host: 'joiedevivre-africa.com',
      key: INDEXNOW_KEY,
      keyLocation: `${BASE_URL}/indexnow-key.txt`,
      urlList: urls
    };
    
    const response = await fetch(engine.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(payload)
    });
    
    return {
      engine: engine.name,
      success: response.status === 200 || response.status === 202,
      statusCode: response.status
    };
  } catch (error) {
    console.error(`IndexNow submission error for ${engine.name}:`, error);
    return {
      engine: engine.name,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { urls, entityType, entityId, priority = 'normal' }: IndexNowRequest = await req.json();
    
    // Validate input
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'URLs array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Validate all URLs belong to our domain
    const validUrls = urls.filter(url => {
      try {
        const parsed = new URL(url);
        return parsed.hostname === 'joiedevivre-africa.com';
      } catch {
        return false;
      }
    });
    
    if (validUrls.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'No valid URLs provided. All URLs must belong to joiedevivre-africa.com' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Limit to 10,000 URLs max (IndexNow limit)
    const urlsToSubmit = validUrls.slice(0, 10000);
    
    console.log(`📤 IndexNow: Submitting ${urlsToSubmit.length} URL(s)`, {
      entityType,
      entityId,
      priority,
      urls: urlsToSubmit.slice(0, 5) // Log first 5 for debugging
    });
    
    // Submit to all IndexNow endpoints in parallel
    const results = await Promise.all(
      INDEXNOW_ENDPOINTS.map(engine => submitToIndexNow(urlsToSubmit, engine))
    );
    
    // Log results
    const successCount = results.filter(r => r.success).length;
    const engines = results.map(r => `${r.engine}:${r.success ? '✅' : '❌'}`).join(', ');
    console.log(`📊 IndexNow results: ${engines}`);
    
    // Log to database (best effort)
    try {
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      
      const submissions = urlsToSubmit.map(url => ({
        url,
        entity_type: entityType || null,
        entity_id: entityId || null,
        submitted_to: results.filter(r => r.success).map(r => r.name),
        status: successCount > 0 ? 'success' : 'failed',
        response_code: results[0]?.statusCode || null,
        error_message: results.find(r => !r.success)?.error || null
      }));
      
      await supabaseAdmin
        .from('indexnow_submissions')
        .insert(submissions);
        
      console.log(`💾 Logged ${submissions.length} submission(s) to database`);
    } catch (dbError) {
      console.error('Error logging to database:', dbError);
      // Don't fail the request if logging fails
    }
    
    return new Response(
      JSON.stringify({
        success: successCount > 0,
        submitted: urlsToSubmit.length,
        engines: results,
        message: `Submitted to ${successCount}/${INDEXNOW_ENDPOINTS.length} search engines`
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
    
  } catch (error) {
    console.error('IndexNow function error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
