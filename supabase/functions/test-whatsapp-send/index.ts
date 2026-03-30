import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const WHATSAPP_ACCESS_TOKEN = Deno.env.get('WHATSAPP_ACCESS_TOKEN');
const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'POST only' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { phone, template, language, body_params, header_image_url, header_video_url, button_params } = await req.json();

    if (!phone || !template) {
      return new Response(JSON.stringify({ error: 'Missing phone or template' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
      return new Response(JSON.stringify({
        error: 'Missing WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID',
        token_set: !!WHATSAPP_ACCESS_TOKEN,
        phone_id_set: !!WHATSAPP_PHONE_NUMBER_ID,
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const metaUrl = `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;

    console.log(`🧪 Test send: template=${template}, phone=${phone}, body_params=${JSON.stringify(body_params)}, header_image_url=${header_image_url || 'none'}, header_video_url=${header_video_url || 'none'}, button_params=${JSON.stringify(button_params)}`);

    const templatePayload: any = {
      name: template,
      language: { code: language || 'fr' },
    };

    const components: any[] = [];

    // Header image support
    if (header_image_url) {
      components.push({
        type: 'header',
        parameters: [{ type: 'image', image: { link: header_image_url } }],
      });
    }

    // Header video support
    if (header_video_url) {
      components.push({
        type: 'header',
        parameters: [{ type: 'video', video: { link: header_video_url } }],
      });
    }

    // Body parameters
    if (body_params && Array.isArray(body_params) && body_params.length > 0) {
      components.push({
        type: 'body',
        parameters: body_params.map((p: string) => ({ type: 'text', text: p })),
      });
    }

    if (components.length > 0) {
      templatePayload.components = components;
    }

    const response = await fetch(metaUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phone,
        type: 'template',
        template: templatePayload,
      }),
    });

    const raw = await response.json();

    if (response.ok) {
      const messageId = raw.messages?.[0]?.id;
      console.log(`✅ Test send success: message_id=${messageId}`);
      return new Response(JSON.stringify({
        success: true,
        message_id: messageId,
        http_status: response.status,
        raw,
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      console.error(`❌ Test send failed:`, JSON.stringify(raw));
      return new Response(JSON.stringify({
        success: false,
        http_status: response.status,
        error_code: raw.error?.code,
        error_subcode: raw.error?.error_subcode,
        error: raw.error?.message || 'Unknown error',
        error_type: raw.error?.type,
        raw,
      }), {
        status: 200, // Return 200 so we always get the diagnostic info
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('❌ Test error:', error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
