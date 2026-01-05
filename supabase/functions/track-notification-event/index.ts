import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TrackEventPayload {
  analytics_id?: string;
  notification_id?: string;
  event_type: 'delivered' | 'opened' | 'clicked' | 'converted';
  conversion_type?: string;
  conversion_value?: number;
  metadata?: Record<string, unknown>;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: TrackEventPayload = await req.json();
    console.log('Tracking notification event:', payload);

    const { analytics_id, notification_id, event_type, conversion_type, conversion_value, metadata } = payload;

    if (!event_type) {
      return new Response(
        JSON.stringify({ error: 'event_type is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build update object based on event type
    const updateData: Record<string, unknown> = {};
    
    switch (event_type) {
      case 'delivered':
        updateData.delivered_at = new Date().toISOString();
        updateData.status = 'delivered';
        break;
      case 'opened':
        updateData.opened_at = new Date().toISOString();
        updateData.status = 'opened';
        break;
      case 'clicked':
        updateData.clicked_at = new Date().toISOString();
        updateData.status = 'clicked';
        break;
      case 'converted':
        updateData.converted_at = new Date().toISOString();
        updateData.status = 'converted';
        if (conversion_type) updateData.conversion_type = conversion_type;
        if (conversion_value) updateData.conversion_value = conversion_value;
        break;
    }

    if (metadata) {
      updateData.metadata = metadata;
    }

    // Update by analytics_id or notification_id
    let query = supabase.from('notification_analytics').update(updateData);
    
    if (analytics_id) {
      query = query.eq('id', analytics_id);
    } else if (notification_id) {
      query = query.eq('notification_id', notification_id);
    } else {
      return new Response(
        JSON.stringify({ error: 'analytics_id or notification_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { error } = await query;

    if (error) {
      console.error('Error updating notification analytics:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Successfully tracked event:', event_type);
    return new Response(
      JSON.stringify({ success: true, event_type }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in track-notification-event:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
