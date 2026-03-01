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
    const { phone } = await req.json();

    if (!phone) {
      return new Response(JSON.stringify({ error: 'Missing phone parameter' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
      return new Response(JSON.stringify({
        error: 'Missing WhatsApp credentials',
        token_set: !!WHATSAPP_ACCESS_TOKEN,
        phone_id_set: !!WHATSAPP_PHONE_NUMBER_ID,
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const formattedPhone = phone.replace(/^\+/, '');
    const metaUrl = `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;

    console.log(`🔍 Diagnostic: testing delivery to ${formattedPhone}`);

    // Step 1: Send a simple test template (hello_world is always approved)
    const templateResponse = await fetch(metaUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'template',
        template: {
          name: 'hello_world',
          language: { code: 'en_US' },
        },
      }),
    });

    const templateRaw = await templateResponse.json();

    // Step 2: Check phone number info via Meta's phone number endpoint
    let phoneInfo = null;
    try {
      const phoneCheckUrl = `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}`;
      const phoneCheckResponse = await fetch(phoneCheckUrl, {
        headers: { 'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}` },
      });
      phoneInfo = await phoneCheckResponse.json();
    } catch (e) {
      phoneInfo = { error: String(e) };
    }

    const diagnostic = {
      tested_phone: phone,
      formatted_phone: formattedPhone,
      phone_digits: formattedPhone.length,
      timestamp: new Date().toISOString(),
      template_send: {
        success: templateResponse.ok,
        http_status: templateResponse.status,
        wa_id: templateRaw.contacts?.[0]?.wa_id || null,
        input_phone: templateRaw.contacts?.[0]?.input || null,
        message_id: templateRaw.messages?.[0]?.id || null,
        message_status: templateRaw.messages?.[0]?.message_status || null,
        error: templateRaw.error || null,
        raw: templateRaw,
      },
      phone_number_info: {
        id: phoneInfo?.id,
        display_phone_number: phoneInfo?.display_phone_number,
        verified_name: phoneInfo?.verified_name,
        quality_rating: phoneInfo?.quality_rating,
        messaging_limit_tier: phoneInfo?.messaging_limit_tier,
      },
      analysis: analyzeResult(formattedPhone, templateRaw),
    };

    console.log('🔍 Diagnostic result:', JSON.stringify(diagnostic));

    return new Response(JSON.stringify(diagnostic, null, 2), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('❌ Diagnostic error:', error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function analyzeResult(formattedPhone: string, metaResponse: any): string[] {
  const issues: string[] = [];

  // Check wa_id mapping
  const waId = metaResponse.contacts?.[0]?.wa_id;
  const inputPhone = metaResponse.contacts?.[0]?.input;

  if (waId && inputPhone && waId !== inputPhone) {
    issues.push(`⚠️ PHONE MAPPING: Meta mapped input '${inputPhone}' to wa_id '${waId}'. This could cause delivery issues if the mapping is incorrect (e.g. 8-digit vs 10-digit Ivorian numbers).`);
  }

  if (!waId && metaResponse.messages?.[0]?.message_status === 'accepted') {
    issues.push(`⚠️ NO WA_ID: Message was accepted but no wa_id returned. The number may not be registered on WhatsApp.`);
  }

  if (metaResponse.error) {
    const code = metaResponse.error.code;
    const subcode = metaResponse.error.error_subcode;
    if (code === 131026) {
      issues.push(`❌ ERROR 131026: Message failed to send. The recipient phone number is not a valid WhatsApp account.`);
    } else if (code === 100) {
      issues.push(`❌ ERROR 100: Invalid parameter. Check phone number format.`);
    } else {
      issues.push(`❌ ERROR ${code}/${subcode}: ${metaResponse.error.message}`);
    }
  }

  // Check Ivorian number format
  if (formattedPhone.startsWith('225')) {
    const localPart = formattedPhone.substring(3);
    if (localPart.length === 8) {
      issues.push(`⚠️ IVORIAN FORMAT: 8-digit local number detected (${localPart}). Côte d'Ivoire migrated to 10 digits in 2021. This number may need '01', '05', or '07' prefix.`);
    } else if (localPart.length === 10) {
      issues.push(`✅ IVORIAN FORMAT: 10-digit local number (${localPart}). Format is correct.`);
    }
  }

  if (issues.length === 0) {
    issues.push('✅ No obvious issues detected. Message was accepted by Meta. Check webhook logs for delivery status callbacks.');
  }

  return issues;
}
