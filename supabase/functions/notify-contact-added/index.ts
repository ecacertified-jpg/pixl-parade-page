import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendSms, sendWhatsApp, sendWhatsAppTemplate } from "../_shared/sms-sender.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = "https://vaimfeurvzokepqqqrsl.supabase.co";
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

interface NotifyContactRequest {
  contact_id: string;
  contact_name: string;
  contact_phone: string;
  birthday: string;
}

// SMS reliability map by phone prefix (mirrors countries.ts server-side)
const SMS_RELIABILITY_BY_PREFIX: Record<string, { reliability: string; smsActuallyReliable?: boolean }> = {
  '225': { reliability: 'unreliable', smsActuallyReliable: true }, // CI - SMS works fine
  '221': { reliability: 'unreliable' },  // SN - SMS unstable
  '229': { reliability: 'unavailable' }, // BJ
  '228': { reliability: 'unavailable' }, // TG
  '223': { reliability: 'unavailable' }, // ML
  '226': { reliability: 'unavailable' }, // BF
};

function getSmsPrefixReliability(phone: string): string {
  const cleaned = phone.replace(/[^0-9+]/g, '').replace(/^\+/, '');
  for (const [prefix, config] of Object.entries(SMS_RELIABILITY_BY_PREFIX)) {
    if (cleaned.startsWith(prefix)) {
      if (config.reliability === 'unreliable' && config.smsActuallyReliable) return 'reliable';
      return config.reliability;
    }
  }
  return 'reliable';
}

// Calculate days until next birthday
function getDaysUntilBirthday(birthdayStr: string): number {
  const birthday = new Date(birthdayStr);
  const today = new Date();
  const currentYear = today.getFullYear();
  
  let nextBirthday = new Date(currentYear, birthday.getMonth(), birthday.getDate());
  if (nextBirthday < today) {
    nextBirthday = new Date(currentYear + 1, birthday.getMonth(), birthday.getDate());
  }
  
  const diffTime = nextBirthday.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get user from authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: NotifyContactRequest = await req.json();
    const { contact_id, contact_name, contact_phone, birthday } = body;

    if (!contact_phone) {
      return new Response(
        JSON.stringify({ success: false, message: 'No phone number provided' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  // Use service role for database operations
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get or create user preferences
    let { data: preferences } = await supabaseAdmin
      .from('contact_alert_preferences')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    // Create default preferences if they don't exist
    if (!preferences) {
      console.log('Creating default preferences for user:', user.id);
      const { data: newPrefs, error: insertError } = await supabaseAdmin
        .from('contact_alert_preferences')
        .insert({
          user_id: user.id,
          alerts_enabled: true,
          sms_enabled: true,
          whatsapp_enabled: true,
          email_enabled: false,
          alert_on_contact_add: true,
          alert_30_days: true,
          alert_21_days: true,
          alert_14_days: true,
          alert_7_days: true,
          alert_5_days: true,
          alert_3_days: true,
          alert_2_days: true,
          alert_1_day: true,
          alert_day_of: true,
          notify_of_adder_birthday: true
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating preferences:', insertError);
      } else {
        preferences = newPrefs;
        console.log('Default preferences created successfully');
      }
    }

    // Check if alerts are enabled
    if (!preferences?.alerts_enabled || !preferences?.alert_on_contact_add) {
      console.log('Alerts disabled for user:', user.id);
      return new Response(
        JSON.stringify({ success: false, message: 'Alerts disabled by user preferences' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user profile for name
    const { data: userProfile } = await supabaseAdmin
      .from('profiles')
      .select('first_name, last_name, birthday')
      .eq('user_id', user.id)
      .single();

    const userName = userProfile?.first_name 
      ? `${userProfile.first_name}${userProfile.last_name ? ' ' + userProfile.last_name : ''}`
      : 'Un ami';

    // Calculate days until contact's birthday
    const daysUntil = getDaysUntilBirthday(birthday);

    // Check if contact has an existing account
    const normalizedPhone = contact_phone.replace(/[\s\-\(\)]/g, '');
    let hasExistingAccount = false;

    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers({
      perPage: 100
    });

    if (authUsers?.users) {
      for (const authUser of authUsers.users) {
        const userPhone = authUser.phone?.replace(/[\s\-\(\)]/g, '') || '';
        
        // Match exact or by suffix (last 8 digits)
        const isExactMatch = userPhone === normalizedPhone;
        const isSuffixMatch = normalizedPhone.length >= 8 && 
          (userPhone.endsWith(normalizedPhone.slice(-8)) || 
           normalizedPhone.endsWith(userPhone.slice(-8)));
        
        if (isExactMatch || isSuffixMatch) {
          hasExistingAccount = true;
          console.log(`Contact ${contact_phone} has existing account: ${authUser.id}`);
          break;
        }
      }
    }

    // Check if alert was already sent recently (prevent duplicates)
    const { data: existingAlert } = await supabaseAdmin
      .from('birthday_contact_alerts')
      .select('id')
      .eq('contact_id', contact_id)
      .eq('user_id', user.id)
      .eq('alert_type', 'contact_added')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .maybeSingle();

    if (existingAlert) {
      console.log('Alert already sent recently for contact:', contact_id);
      return new Response(
        JSON.stringify({ success: false, message: 'Alert already sent recently' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build two distinct messages
    const pluralS = daysUntil > 1 ? 's' : '';

    // SMS: short, no emojis, <160 chars
    const smsMessage = hasExistingAccount
      ? `${userName} t'a ajouté à son cercle! Ton anniversaire dans ${daysUntil} jour${pluralS}. Tes souhaits de cadeaux ? joiedevivre-africa.com/favorites`
      : `${userName} t'a ajouté à son cercle! Ton anniversaire dans ${daysUntil} jour${pluralS}. Ajoute des amis et profite de leur générosité: joiedevivre-africa.com`;

    // WhatsApp: template parameters
    const whatsappCallToAction = hasExistingAccount
      ? `Ajoute tes souhaits de cadeaux ici 👉 joiedevivre-africa.com/favorites`
      : `Rejoins la communauté et profite de la générosité de tes proches 👉 joiedevivre-africa.com`;

    // WhatsApp fallback (free-form, works only within 24h window)
    const whatsappFallbackMessage = hasExistingAccount
      ? `🎉 ${userName} t'a ajouté à son cercle d'amis !\n\n🎂 Ton anniversaire est dans ${daysUntil} jour${pluralS}.\n\n🎁 Ajoute tes souhaits de cadeaux ici 👉 joiedevivre-africa.com/favorites`
      : `🎉 ${userName} t'a ajouté à son cercle d'amis !\n\n🎂 Ton anniversaire est dans ${daysUntil} jour${pluralS}.\n\n✨ Rejoins la communauté et profite de la générosité de tes proches 👉 joiedevivre-africa.com`;

    // WhatsApp-first routing with SMS fallback (no double send)
    let finalChannel: 'whatsapp' | 'sms' = 'whatsapp';
    let finalSuccess = false;
    let finalError: string | undefined;

    // 1. Try WhatsApp first (if enabled)
    if (canSendWhatsapp) {
      console.log(`📱 [WhatsApp] Trying template for ${contact_phone}`);
      const waResult = await sendWhatsAppTemplate(
        contact_phone,
        'joiedevivre_contact_added',
        'fr',
        [userName, daysUntil.toString()]
      );
      if (waResult.success) {
        finalSuccess = true;
        console.log(`✅ [WhatsApp] Template sent to ${contact_phone}`);
      } else {
        console.log(`⚠️ [WhatsApp] Template failed (${waResult.error}), trying free-form`);
        const fallback = await sendWhatsApp(contact_phone, whatsappFallbackMessage);
        if (fallback.success) {
          finalSuccess = true;
          console.log(`✅ [WhatsApp] Free-form sent to ${contact_phone}`);
        } else {
          finalError = fallback.error;
          console.log(`❌ [WhatsApp] Free-form also failed (${fallback.error})`);
        }
      }
    }

    // 2. SMS fallback only if WhatsApp failed
    if (!finalSuccess && canSendSms) {
      finalChannel = 'sms';
      console.log(`📨 [SMS] Fallback for ${contact_phone}`);
      const smsResult = await sendSms(contact_phone, smsMessage);
      finalSuccess = smsResult.success;
      finalError = smsResult.success ? undefined : smsResult.error;
      console.log(`${finalSuccess ? '✅' : '❌'} [SMS] ${finalSuccess ? 'Sent' : 'Failed'} to ${contact_phone}`);
    }

    // 3. Last resort: force WhatsApp if no channel was active
    if (!finalSuccess && !canSendWhatsapp && !canSendSms) {
      finalChannel = 'whatsapp';
      console.log(`⚠️ No channel active, forcing WhatsApp for ${contact_phone}`);
      const waResult = await sendWhatsAppTemplate(
        contact_phone,
        'joiedevivre_contact_added',
        'fr',
        [userName, daysUntil.toString()]
      );
      if (waResult.success) {
        finalSuccess = true;
      } else {
        const fallback = await sendWhatsApp(contact_phone, whatsappFallbackMessage);
        finalSuccess = fallback.success;
        finalError = fallback.success ? undefined : fallback.error;
      }
    }

    // 4. Single log entry in birthday_contact_alerts
    await supabaseAdmin
      .from('birthday_contact_alerts')
      .insert({
        user_id: user.id,
        contact_id: contact_id,
        contact_phone: contact_phone,
        contact_name: contact_name,
        alert_type: 'contact_added',
        channel: finalChannel,
        days_before: daysUntil,
        status: finalSuccess ? 'sent' : 'failed',
        sent_at: finalSuccess ? new Date().toISOString() : null,
        error_message: finalError || null
      });

    console.log(`Notification ${finalSuccess ? 'sent' : 'failed'} to ${contact_phone} via ${finalChannel}`);

    const anySuccess = finalSuccess;

    return new Response(
      JSON.stringify({
        success: anySuccess,
        channel: finalChannel,
        message: anySuccess
          ? `Notification envoyée à ${contact_name}`
          : `Échec de l'envoi sur tous les canaux`
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in notify-contact-added:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
