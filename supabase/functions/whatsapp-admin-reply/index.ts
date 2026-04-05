import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const WHATSAPP_ACCESS_TOKEN = Deno.env.get('WHATSAPP_ACCESS_TOKEN');
const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    // Authenticate admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const userId = claimsData.claims.sub;

    // Verify admin status
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('id, role, is_active')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (!adminUser) {
      return new Response(JSON.stringify({ error: 'Forbidden: not an admin' }), { status: 403, headers: corsHeaders });
    }

    // Parse body
    const { conversation_id, message } = await req.json();
    
    if (!conversation_id || !message?.trim()) {
      return new Response(JSON.stringify({ error: 'conversation_id and message are required' }), { status: 400, headers: corsHeaders });
    }

    // Get conversation
    const { data: conversation, error: convError } = await supabase
      .from('whatsapp_conversations')
      .select('id, phone_number, mode')
      .eq('id', conversation_id)
      .single();

    if (convError || !conversation) {
      return new Response(JSON.stringify({ error: 'Conversation not found' }), { status: 404, headers: corsHeaders });
    }

    // Send via WhatsApp Cloud API
    const truncatedMessage = message.substring(0, 4000);
    
    const waResponse = await fetch(
      `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: conversation.phone_number,
          type: 'text',
          text: { body: truncatedMessage }
        }),
      }
    );

    if (!waResponse.ok) {
      const errorText = await waResponse.text();
      console.error('❌ WhatsApp API error:', errorText);
      return new Response(JSON.stringify({ error: 'Failed to send WhatsApp message' }), { status: 502, headers: corsHeaders });
    }

    const waResult = await waResponse.json();
    const whatsappMessageId = waResult.messages?.[0]?.id || null;

    // Save outgoing message in DB
    const { data: savedMsg, error: msgError } = await supabase
      .from('whatsapp_messages')
      .insert({
        conversation_id: conversation.id,
        direction: 'outbound',
        content: truncatedMessage,
        message_type: 'text',
        whatsapp_message_id: whatsappMessageId,
        status: 'sent',
        metadata: { sender: 'admin', admin_id: userId }
      })
      .select()
      .single();

    if (msgError) {
      console.error('❌ Error saving message:', msgError);
    }

    // Update conversation last_message_at
    await supabase
      .from('whatsapp_conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversation.id);

    console.log(`✅ Admin ${userId} sent message to ${conversation.phone_number}`);

    return new Response(JSON.stringify({ success: true, message_id: savedMsg?.id }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: corsHeaders });
  }
});
