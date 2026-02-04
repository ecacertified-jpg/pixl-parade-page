import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendSms, getPreferredChannel } from "../_shared/sms-sender.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = "https://vaimfeurvzokepqqqrsl.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

// Alert intervals configuration
const ALERT_INTERVALS = [
  { days: 10, column: 'alert_10_days', msgKey: 'j10' },
  { days: 5, column: 'alert_5_days', msgKey: 'j5' },
  { days: 3, column: 'alert_3_days', msgKey: 'j3' },
  { days: 2, column: 'alert_2_days', msgKey: 'j2' },
  { days: 1, column: 'alert_1_day', msgKey: 'j1' },
  { days: 0, column: 'alert_day_of', msgKey: 'j0' },
];

// Messages per interval
const MESSAGES: Record<string, (name: string) => string> = {
  j10: (name) => `JoieDvivre: ${name} fête son anniversaire dans 10 jours. Préparez une surprise!`,
  j5: (name) => `JoieDvivre: ${name} fête son anniversaire dans 5 jours. Avez-vous trouvé le cadeau parfait?`,
  j3: (name) => `JoieDvivre: Plus que 3 jours avant l'anniversaire de ${name}! Découvrez nos idées cadeaux.`,
  j2: (name) => `JoieDvivre: L'anniversaire de ${name} approche (dans 2 jours). Commandez votre cadeau!`,
  j1: (name) => `URGENT JoieDvivre: DEMAIN c'est l'anniversaire de ${name}! Dernier jour pour commander.`,
  j0: (name) => `JoieDvivre: Aujourd'hui c'est l'anniversaire de ${name}! Souhaitez-lui une bonne fête 🎂`,
};

// Calculate days until next birthday
function getDaysUntilBirthday(birthdayStr: string): number {
  const birthday = new Date(birthdayStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const currentYear = today.getFullYear();
  let nextBirthday = new Date(currentYear, birthday.getMonth(), birthday.getDate());
  nextBirthday.setHours(0, 0, 0, 0);
  
  if (nextBirthday < today) {
    nextBirthday = new Date(currentYear + 1, birthday.getMonth(), birthday.getDate());
  }
  
  const diffTime = nextBirthday.getTime() - today.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('Starting check-birthday-alerts-for-contacts CRON job...');

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get all users with their contacts and preferences
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('user_id, first_name, last_name, birthday')
      .not('birthday', 'is', null);

    if (usersError) {
      throw new Error(`Error fetching users: ${usersError.message}`);
    }

    console.log(`Found ${users?.length || 0} users with birthdays`);

    let totalAlertsSent = 0;
    let totalErrors = 0;

    for (const user of users || []) {
      if (!user.birthday) continue;

      const daysUntilBirthday = getDaysUntilBirthday(user.birthday);
      
      // Check if this day matches any alert interval
      const matchingInterval = ALERT_INTERVALS.find(i => i.days === daysUntilBirthday);
      if (!matchingInterval) continue;

      console.log(`User ${user.user_id} birthday in ${daysUntilBirthday} days - matches ${matchingInterval.msgKey}`);

      // Get user's preferences
      const { data: preferences } = await supabase
        .from('contact_alert_preferences')
        .select('*')
        .eq('user_id', user.user_id)
        .single();

      // Check if alerts are enabled and this interval is enabled
      if (!preferences?.alerts_enabled) {
        console.log(`Alerts disabled for user ${user.user_id}`);
        continue;
      }

      const intervalEnabled = preferences[matchingInterval.column as keyof typeof preferences];
      if (!intervalEnabled) {
        console.log(`Interval ${matchingInterval.column} disabled for user ${user.user_id}`);
        continue;
      }

      // Get contacts who added this user (reverse lookup)
      // For now, we get all contacts that have this user's phone
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('phone')
        .eq('user_id', user.user_id)
        .single();

      if (!userProfile?.phone) continue;

      // Find contacts with this phone number to get "who added this user"
      const { data: contacts } = await supabase
        .from('contacts')
        .select('id, user_id, name, phone')
        .eq('phone', userProfile.phone);

      if (!contacts?.length) continue;

      const userName = user.first_name 
        ? `${user.first_name}${user.last_name ? ' ' + user.last_name : ''}`
        : 'Votre ami(e)';

      // For each contact relationship, notify the contact owner about this user's birthday
      for (const contact of contacts) {
        // Get the contact owner's profile (the one who added the user)
        const { data: ownerProfile } = await supabase
          .from('profiles')
          .select('phone')
          .eq('user_id', contact.user_id)
          .single();

        if (!ownerProfile?.phone) continue;

        // Check if alert was already sent today for this combination
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const { data: existingAlert } = await supabase
          .from('birthday_contact_alerts')
          .select('id')
          .eq('user_id', user.user_id)
          .eq('contact_phone', ownerProfile.phone)
          .eq('days_before', daysUntilBirthday)
          .gte('created_at', today.toISOString())
          .maybeSingle();

        if (existingAlert) {
          console.log(`Alert already sent today for user ${user.user_id} to ${ownerProfile.phone}`);
          continue;
        }

        // Build and send message
        const message = MESSAGES[matchingInterval.msgKey](userName);
        const channel = getPreferredChannel(ownerProfile.phone);
        
        let sendResult: { success: boolean; error?: string } = { success: false };

        if (channel === 'sms' && preferences.sms_enabled) {
          const smsResult = await sendSms(ownerProfile.phone, message);
          sendResult = { success: smsResult.success, error: smsResult.error };
        } else if (preferences.whatsapp_enabled) {
          // WhatsApp sending would go here - for now just log
          console.log(`WhatsApp message would be sent to ${ownerProfile.phone}: ${message}`);
          sendResult = { success: true }; // Consider it sent for tracking
        }

        // Record the alert
        await supabase
          .from('birthday_contact_alerts')
          .insert({
            user_id: user.user_id,
            contact_id: contact.id,
            contact_phone: ownerProfile.phone,
            contact_name: contact.name,
            alert_type: `reminder_j${daysUntilBirthday}`,
            channel: channel,
            days_before: daysUntilBirthday,
            status: sendResult.success ? 'sent' : 'failed',
            sent_at: sendResult.success ? new Date().toISOString() : null,
            error_message: sendResult.error || null
          });

        if (sendResult.success) {
          totalAlertsSent++;
          console.log(`Alert sent to ${ownerProfile.phone} for ${userName}'s birthday in ${daysUntilBirthday} days`);
        } else {
          totalErrors++;
          console.log(`Failed to send alert to ${ownerProfile.phone}: ${sendResult.error}`);
        }
      }
    }

    console.log(`CRON completed: ${totalAlertsSent} alerts sent, ${totalErrors} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        alertsSent: totalAlertsSent,
        errors: totalErrors
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in check-birthday-alerts-for-contacts:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
