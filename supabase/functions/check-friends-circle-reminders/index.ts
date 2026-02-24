import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendWhatsAppTemplate, sendSms, getPreferredChannel } from "../_shared/sms-sender.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    let body: Record<string, unknown> = {};
    try {
      body = await req.json();
    } catch { /* empty body for CRON */ }

    const mode = body.mode as string | undefined;
    const userId = body.user_id as string | undefined;

    // ========== WELCOME MODE ==========
    if (mode === 'welcome' && userId) {
      console.log(`[check-friends-circle-reminders] Welcome mode for user: ${userId}`);

      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('first_name, phone')
        .eq('user_id', userId)
        .single();

      if (!profile?.phone) {
        console.log('No phone number for user, skipping welcome WhatsApp');
        return new Response(JSON.stringify({ sent: false, reason: 'no_phone' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Check if welcome already sent in DB
      const { data: existing } = await supabaseAdmin
        .from('birthday_contact_alerts')
        .select('id')
        .eq('user_id', userId)
        .eq('alert_type', 'friends_circle_welcome')
        .limit(1);

      if (existing && existing.length > 0) {
        console.log('Welcome WhatsApp already sent for this user');
        return new Response(JSON.stringify({ sent: false, reason: 'already_sent' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const firstName = profile.first_name || 'Ami(e)';

      const waResult = await sendWhatsAppTemplate(
        profile.phone,
        'joiedevivre_welcome_add_friends',
        'fr',
        [firstName]
      );

      console.log(`[WhatsApp Template] Welcome result:`, waResult.success ? waResult.sid : waResult.error);

      // Record in DB
      await supabaseAdmin.from('birthday_contact_alerts').insert({
        user_id: userId,
        contact_id: userId,
        contact_phone: profile.phone,
        contact_name: firstName,
        alert_type: 'friends_circle_welcome',
        channel: 'whatsapp',
        days_before: 0,
        status: waResult.success ? 'sent' : 'failed',
        sent_at: waResult.success ? new Date().toISOString() : null,
        error_message: waResult.error || null,
      });

      return new Response(JSON.stringify({ sent: waResult.success }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ========== CRON MODE (default) ==========
    console.log('Starting check-friends-circle-reminders CRON job...');

    // Get all users with complete profiles and phone
    const { data: users, error: usersError } = await supabaseAdmin
      .from('profiles')
      .select('user_id, first_name, phone')
      .not('birthday', 'is', null)
      .not('city', 'is', null)
      .not('phone', 'is', null);

    if (usersError) {
      console.error('Error fetching profiles:', usersError);
      throw usersError;
    }

    if (!users || users.length === 0) {
      console.log('No eligible users found');
      return new Response(JSON.stringify({ reminders_sent: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let remindersSent = 0;
    let errors = 0;

    for (const user of users) {
      try {
        // Count contacts
        const { count } = await supabaseAdmin
          .from('contacts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.user_id);

        if ((count || 0) >= 2) continue;

        // Check if reminder sent in last 72h
        const since72h = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();
        const { data: recentAlert } = await supabaseAdmin
          .from('birthday_contact_alerts')
          .select('id')
          .eq('user_id', user.user_id)
          .eq('alert_type', 'friends_circle_reminder')
          .gte('created_at', since72h)
          .limit(1);

        if (recentAlert && recentAlert.length > 0) continue;

        console.log(`User ${user.user_id}: ${count || 0} contacts, sending reminder`);

        const firstName = user.first_name || 'Ami(e)';

        // Send WhatsApp template
        const waResult = await sendWhatsAppTemplate(
          user.phone,
          'joiedevivre_friends_circle_reminder',
          'fr',
          [firstName]
        );

        console.log(`[WhatsApp Template] Reminder result for ${user.user_id}:`, waResult.success ? waResult.sid : waResult.error);

        // Also send SMS if preferred channel is SMS
        const channel = getPreferredChannel(user.phone);
        if (channel === 'sms') {
          const smsMsg = `${firstName}, ton cercle d'amis n'est pas encore complet ! Ajoute des proches: joiedevivre-africa.com/contacts`;
          await sendSms(user.phone, smsMsg);
        }

        // Record alert
        await supabaseAdmin.from('birthday_contact_alerts').insert({
          user_id: user.user_id,
          contact_id: user.user_id,
          contact_phone: user.phone,
          contact_name: firstName,
          alert_type: 'friends_circle_reminder',
          channel: waResult.success ? 'whatsapp' : 'sms',
          days_before: 0,
          status: waResult.success ? 'sent' : 'failed',
          sent_at: waResult.success ? new Date().toISOString() : null,
          error_message: waResult.error || null,
        });

        remindersSent++;
      } catch (err) {
        console.error(`Error processing user ${user.user_id}:`, err);
        errors++;
      }
    }

    console.log(`CRON completed: ${remindersSent} reminders sent, ${errors} errors`);

    return new Response(JSON.stringify({ reminders_sent: remindersSent, errors }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Fatal error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
