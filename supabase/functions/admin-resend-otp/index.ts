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
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

function generateOtpCode(): string {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return String(array[0] % 1000000).padStart(6, '0');
}

function formatOtpMessage(code: string): string {
  return `🔐 *JOIE DE VIVRE*

Votre code de vérification est : *${code}*

Ce code expire dans 5 minutes.
Ne le partagez avec personne.

Si vous n'avez pas demandé ce code, ignorez ce message.`;
}

interface SendResult {
  success: boolean;
  messageId?: string;
}

async function sendWhatsAppMessage(to: string, code: string): Promise<SendResult> {
  if (!WHATSAPP_PHONE_NUMBER_ID || !WHATSAPP_ACCESS_TOKEN) {
    console.error("WhatsApp credentials not configured");
    return { success: false };
  }

  const formattedPhone = to.replace(/^\+/, '');
  const url = `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
  const headers = {
    "Authorization": `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
    "Content-Type": "application/json",
  };

  // 1. Try HSM template first
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
      const messageId = result.messages?.[0]?.id;
      console.log("WhatsApp OTP resent via template:", messageId);
      return { success: true, messageId };
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
      return { success: false };
    }

    const result = await textResponse.json();
    const messageId = result.messages?.[0]?.id;
    console.log("WhatsApp OTP resent via plain text:", messageId);
    return { success: true, messageId };
  } catch (error) {
    console.error("Error sending WhatsApp message:", error);
    return { success: false };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Verify admin JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'unauthorized', message: 'Token manquant' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'unauthorized', message: 'Token invalide' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub;

    // 2. Verify admin role
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: adminUser, error: adminError } = await supabaseAdmin
      .from('admin_users')
      .select('role, is_active')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle();

    if (adminError || !adminUser) {
      return new Response(
        JSON.stringify({ error: 'forbidden', message: 'Accès réservé aux administrateurs' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Parse & validate request
    const { phone }: { phone: string } = await req.json();

    if (!phone || !phone.match(/^\+\d{10,15}$/)) {
      return new Response(
        JSON.stringify({ error: 'invalid_phone', message: 'Numéro de téléphone invalide' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Generate OTP & insert (NO rate limit for admin)
    const code = generateOtpCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    const { error: insertError } = await supabaseAdmin
      .from('whatsapp_otp_codes')
      .insert({
        phone,
        code,
        purpose: 'signin',
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error("Error storing OTP:", insertError);
      return new Response(
        JSON.stringify({ error: 'storage_error', message: 'Erreur lors de la création du code' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. Send via WhatsApp
    const sendResult = await sendWhatsAppMessage(phone, code);

    if (!sendResult.success) {
      await supabaseAdmin
        .from('whatsapp_otp_codes')
        .delete()
        .eq('phone', phone)
        .eq('code', code);

      return new Response(
        JSON.stringify({ error: 'send_failed', message: "Impossible d'envoyer le code WhatsApp" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 6. Store message ID for delivery tracking
    if (sendResult.messageId) {
      await supabaseAdmin
        .from('whatsapp_otp_codes')
        .update({
          whatsapp_message_id: sendResult.messageId,
          delivery_status: 'accepted',
        })
        .eq('phone', phone)
        .eq('code', code);

      const maskedPhone = phone.substring(0, 7) + '****' + phone.substring(phone.length - 2);
      await supabaseAdmin.from('whatsapp_template_logs').insert({
        template_name: 'joiedevivre_otp',
        recipient_phone: maskedPhone,
        country_prefix: phone.substring(0, 4),
        whatsapp_message_id: sendResult.messageId,
        status: 'sent',
        template_params: { purpose: 'admin_resend', admin_id: userId },
      });
    }

    // 7. Audit log
    await supabaseAdmin.from('admin_audit_logs').insert({
      admin_user_id: userId,
      action_type: 'resend_otp',
      target_type: 'whatsapp_otp',
      description: `OTP renvoyé vers ${phone.slice(0, 4)}****${phone.slice(-3)}`,
      metadata: { phone_masked: phone.slice(0, 4) + '****' + phone.slice(-3) },
    });

    console.log(`✅ Admin ${userId} resent OTP to ${phone}`);

    return new Response(
      JSON.stringify({ success: true, message: 'Code OTP renvoyé avec succès' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: 'internal_error', message: "Une erreur inattendue s'est produite" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
