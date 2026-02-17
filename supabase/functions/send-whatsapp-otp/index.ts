import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
const WHATSAPP_ACCESS_TOKEN = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface SendOtpRequest {
  phone: string;
  purpose: 'signin' | 'signup';
  user_metadata?: {
    first_name?: string;
    last_name?: string;
    city?: string;
    birthday?: string;
    is_business?: boolean;
    business_name?: string;
    business_type?: string;
  };
}

// Generate secure 6-digit OTP
function generateOtpCode(): string {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return String(array[0] % 1000000).padStart(6, '0');
}

// Format OTP message for WhatsApp (fallback texte libre)
function formatOtpMessage(code: string): string {
  return `🔐 *JOIE DE VIVRE*

Votre code de vérification est : *${code}*

Ce code expire dans 5 minutes.
Ne le partagez avec personne.

Si vous n'avez pas demandé ce code, ignorez ce message.`;
}

// Send WhatsApp message via HSM template with fallback to plain text
async function sendWhatsAppMessage(to: string, code: string): Promise<boolean> {
  if (!WHATSAPP_PHONE_NUMBER_ID || !WHATSAPP_ACCESS_TOKEN) {
    console.error("WhatsApp credentials not configured");
    return false;
  }

  const formattedPhone = to.replace(/^\+/, '');
  const url = `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
  const headers = {
    "Authorization": `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
    "Content-Type": "application/json",
  };

  // 1. Try HSM template first (high deliverability, no 24h window needed)
  try {
    const templateResponse = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: formattedPhone,
        type: "template",
        template: {
          name: "joiedevivre_otp",
          language: { code: "fr" },
          components: [
            {
              type: "body",
              parameters: [{ type: "text", text: code }],
            },
            {
              type: "button",
              sub_type: "url",
              index: "0",
              parameters: [{ type: "text", text: code }],
            },
          ],
        },
      }),
    });

    if (templateResponse.ok) {
      const result = await templateResponse.json();
      console.log("WhatsApp OTP sent via template:", result);
      return true;
    }

    const templateError = await templateResponse.text();
    console.warn("Template send failed, falling back to plain text:", templateError);
  } catch (error) {
    console.warn("Template send error, falling back to plain text:", error);
  }

  // 2. Fallback: plain text message
  try {
    const textResponse = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: formattedPhone,
        type: "text",
        text: { body: formatOtpMessage(code) },
      }),
    });

    if (!textResponse.ok) {
      const errorData = await textResponse.text();
      console.error("WhatsApp plain text fallback error:", errorData);
      return false;
    }

    const result = await textResponse.json();
    console.log("WhatsApp OTP sent via plain text fallback:", result);
    return true;
  } catch (error) {
    console.error("Error sending WhatsApp message:", error);
    return false;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    const { phone, purpose, user_metadata }: SendOtpRequest = await req.json();

    if (!phone || !phone.match(/^\+\d{10,15}$/)) {
      return new Response(
        JSON.stringify({ error: 'invalid_phone', message: 'Numéro de téléphone invalide' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rate limiting: 60 seconds
    const { data: recentOtp } = await supabaseAdmin
      .from('whatsapp_otp_codes')
      .select('created_at')
      .eq('phone', phone)
      .gt('created_at', new Date(Date.now() - 60000).toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recentOtp) {
      const waitSeconds = Math.ceil(60 - (Date.now() - new Date(recentOtp.created_at).getTime()) / 1000);
      return new Response(
        JSON.stringify({ 
          error: 'rate_limit', 
          message: `Veuillez attendre ${waitSeconds} secondes avant de demander un nouveau code`,
          retry_after: waitSeconds
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const code = generateOtpCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    const { error: insertError } = await supabaseAdmin
      .from('whatsapp_otp_codes')
      .insert({
        phone,
        code,
        purpose,
        expires_at: expiresAt.toISOString(),
        user_metadata: user_metadata || null,
      });

    if (insertError) {
      console.error("Error storing OTP:", insertError);
      return new Response(
        JSON.stringify({ error: 'storage_error', message: 'Erreur lors de la création du code' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const sent = await sendWhatsAppMessage(phone, code);

    if (!sent) {
      await supabaseAdmin
        .from('whatsapp_otp_codes')
        .delete()
        .eq('phone', phone)
        .eq('code', code);

      return new Response(
        JSON.stringify({ error: 'send_failed', message: 'Impossible d\'envoyer le code WhatsApp' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Clean up expired codes
    await supabaseAdmin
      .from('whatsapp_otp_codes')
      .delete()
      .eq('phone', phone)
      .lt('expires_at', new Date().toISOString());

    console.log(`OTP sent to ${phone} via WhatsApp (purpose: ${purpose})`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Code envoyé via WhatsApp',
        expires_in: 300
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: 'internal_error', message: 'Une erreur inattendue s\'est produite' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
