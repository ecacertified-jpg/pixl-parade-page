import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const WHATSAPP_ACCESS_TOKEN = Deno.env.get('WHATSAPP_ACCESS_TOKEN');
const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');

// Known country codes with expected local digit lengths
const COUNTRY_RULES: Record<string, { name: string; localDigits: number; note?: string }> = {
  '225': { name: 'Côte d\'Ivoire', localDigits: 10, note: 'Réforme 2021: 10 chiffres avec 0 initial obligatoire' },
  '229': { name: 'Bénin', localDigits: 10, note: 'Préfixe 01 ajouté en 2023' },
  '221': { name: 'Sénégal', localDigits: 9 },
  '223': { name: 'Mali', localDigits: 8 },
  '228': { name: 'Togo', localDigits: 8 },
  '226': { name: 'Burkina Faso', localDigits: 8 },
  '227': { name: 'Niger', localDigits: 8 },
  '33': { name: 'France', localDigits: 9 },
  '1': { name: 'USA/Canada', localDigits: 10 },
};

interface PhoneValidation {
  original: string;
  cleaned: string;
  digits_only: string;
  total_digits: number;
  country_code: string | null;
  country_name: string | null;
  local_part: string | null;
  local_digits: number | null;
  expected_local_digits: number | null;
  format_valid: boolean;
  warnings: string[];
  errors: string[];
}

function validatePhone(phone: string): PhoneValidation {
  const result: PhoneValidation = {
    original: phone,
    cleaned: '',
    digits_only: '',
    total_digits: 0,
    country_code: null,
    country_name: null,
    local_part: null,
    local_digits: null,
    expected_local_digits: null,
    format_valid: false,
    warnings: [],
    errors: [],
  };

  // Clean: remove spaces, dashes, parentheses
  let cleaned = phone.replace(/[\s\-\(\)]/g, '');
  result.cleaned = cleaned;

  // Ensure starts with +
  if (!cleaned.startsWith('+')) {
    if (/^\d+$/.test(cleaned) && cleaned.length >= 10) {
      result.warnings.push('Numéro sans indicatif +, tentative de détection automatique');
    } else {
      result.errors.push('Le numéro doit commencer par + suivi de l\'indicatif pays');
      return result;
    }
  }

  const digitsOnly = cleaned.replace(/\D/g, '');
  result.digits_only = digitsOnly;
  result.total_digits = digitsOnly.length;

  if (digitsOnly.length < 10 || digitsOnly.length > 15) {
    result.errors.push(`Longueur invalide: ${digitsOnly.length} chiffres (attendu 10-15)`);
    return result;
  }

  // Detect country code (try 3, 2, 1 digit codes)
  let matchedCode: string | null = null;
  for (const len of [3, 2, 1]) {
    const candidate = digitsOnly.substring(0, len);
    if (COUNTRY_RULES[candidate]) {
      matchedCode = candidate;
      break;
    }
  }

  if (matchedCode) {
    const rule = COUNTRY_RULES[matchedCode];
    result.country_code = matchedCode;
    result.country_name = rule.name;
    result.local_part = digitsOnly.substring(matchedCode.length);
    result.local_digits = result.local_part.length;
    result.expected_local_digits = rule.localDigits;

    if (result.local_digits !== rule.localDigits) {
      const msg = `Partie locale: ${result.local_digits} chiffres au lieu de ${rule.localDigits} attendus pour ${rule.name}`;
      if (matchedCode === '225' && result.local_digits === 8) {
        result.errors.push(`${msg}. ATTENTION: ancien format 8 chiffres CI détecté. La réforme 2021 exige 10 chiffres avec 0 initial (ex: 07xxxxxxxx → 0707xxxxxx)`);
      } else {
        result.warnings.push(msg);
      }
    }

    if (rule.note) {
      result.warnings.push(`Note ${rule.name}: ${rule.note}`);
    }
  } else {
    result.warnings.push(`Indicatif pays non reconnu dans la base de règles. Vérification de format basique uniquement.`);
  }

  result.format_valid = result.errors.length === 0;
  return result;
}

interface WhatsAppCheck {
  status: 'valid' | 'invalid' | 'error' | 'skipped';
  wa_id: string | null;
  wa_id_mismatch: boolean;
  mismatch_detail: string | null;
  raw: any;
}

async function checkWhatsAppRegistration(phone: string, digitsOnly: string): Promise<WhatsAppCheck> {
  const url = `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}/contacts`;

  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        blocking: 'wait',
        contacts: [phone],
      }),
    });

    const data = await resp.json();
    const contact = data?.contacts?.[0];

    if (!contact) {
      return { status: 'error', wa_id: null, wa_id_mismatch: false, mismatch_detail: null, raw: data };
    }

    const waId = contact.wa_id || null;
    let mismatch = false;
    let mismatchDetail: string | null = null;

    if (waId && waId !== digitsOnly) {
      mismatch = true;
      mismatchDetail = `Numéro envoyé: ${digitsOnly}, wa_id retourné: ${waId}. Meta mappe peut-être à l'ancien format (problème connu CI).`;
    }

    return {
      status: contact.status === 'valid' ? 'valid' : 'invalid',
      wa_id: waId,
      wa_id_mismatch: mismatch,
      mismatch_detail: mismatchDetail,
      raw: data,
    };
  } catch (err) {
    return { status: 'error', wa_id: null, wa_id_mismatch: false, mismatch_detail: null, raw: String(err) };
  }
}

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
    const { phone, template, language, body_params, header_image_url, header_video_url, button_params, skip_validation } = await req.json();

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

    // === STEP 1: Phone format validation ===
    const phoneValidation = validatePhone(phone);
    console.log(`📱 Phone validation: ${JSON.stringify(phoneValidation)}`);

    if (!skip_validation && !phoneValidation.format_valid) {
      return new Response(JSON.stringify({
        success: false,
        step: 'phone_validation',
        phone_validation: phoneValidation,
        message: `Numéro invalide: ${phoneValidation.errors.join('; ')}`,
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // === STEP 2: WhatsApp registration check ===
    let whatsappCheck: WhatsAppCheck = { status: 'skipped', wa_id: null, wa_id_mismatch: false, mismatch_detail: null, raw: null };

    if (!skip_validation) {
      whatsappCheck = await checkWhatsAppRegistration(phoneValidation.cleaned, phoneValidation.digits_only);
      console.log(`📲 WhatsApp check: ${JSON.stringify(whatsappCheck)}`);

      if (whatsappCheck.status === 'invalid') {
        return new Response(JSON.stringify({
          success: false,
          step: 'whatsapp_check',
          phone_validation: phoneValidation,
          whatsapp_check: whatsappCheck,
          message: `Le numéro ${phone} n'est PAS enregistré sur WhatsApp. Aucun message envoyé.`,
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // === STEP 3: Send template (existing logic) ===
    const metaUrl = `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;

    console.log(`🧪 Test send: template=${template}, phone=${phone}, body_params=${JSON.stringify(body_params)}, header_image_url=${header_image_url || 'none'}, header_video_url=${header_video_url || 'none'}, button_params=${JSON.stringify(button_params)}`);

    const templatePayload: any = {
      name: template,
      language: { code: language || 'fr' },
    };

    const components: any[] = [];

    if (header_image_url) {
      components.push({
        type: 'header',
        parameters: [{ type: 'image', image: { link: header_image_url } }],
      });
    }

    if (header_video_url) {
      components.push({
        type: 'header',
        parameters: [{ type: 'video', video: { link: header_video_url } }],
      });
    }

    if (body_params && Array.isArray(body_params) && body_params.length > 0) {
      components.push({
        type: 'body',
        parameters: body_params.map((p: string) => ({ type: 'text', text: p })),
      });
    }

    if (button_params && Array.isArray(button_params) && button_params.length > 0) {
      button_params.forEach((param: string, index: number) => {
        components.push({
          type: 'button',
          sub_type: 'url',
          index: String(index),
          parameters: [{ type: 'text', text: param }],
        });
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
        phone_validation: phoneValidation,
        whatsapp_check: whatsappCheck,
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
        phone_validation: phoneValidation,
        whatsapp_check: whatsappCheck,
        raw,
      }), {
        status: 200,
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
