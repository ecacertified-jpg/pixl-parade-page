import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sid, sids } = await req.json();
    
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    
    if (!accountSid || !authToken) {
      return new Response(
        JSON.stringify({ error: 'Twilio credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle single SID or multiple SIDs
    const sidsToCheck = sids || (sid ? [sid] : []);
    
    if (sidsToCheck.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No SID(s) provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results = await Promise.all(
      sidsToCheck.map(async (messageSid: string) => {
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages/${messageSid}.json`;
        
        const response = await fetch(twilioUrl, {
          headers: {
            'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`)
          }
        });
        
        const data = await response.json();
        
        return {
          sid: data.sid,
          to: data.to,
          from: data.from,
          status: data.status,
          error_code: data.error_code || null,
          error_message: data.error_message || null,
          date_sent: data.date_sent,
          date_updated: data.date_updated,
          price: data.price,
          price_unit: data.price_unit
        };
      })
    );

    console.log('SMS Status Check Results:', JSON.stringify(results, null, 2));

    return new Response(
      JSON.stringify({ 
        success: true, 
        results: sidsToCheck.length === 1 ? results[0] : results 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error checking SMS status:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
