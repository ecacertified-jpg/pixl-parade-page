import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendWhatsAppTemplate, sendSms, getPreferredChannel } from "../_shared/sms-sender.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BATCH_SIZE = 20;
const MAX_CANDIDATES = 40;

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

      const { error: insertError } = await supabaseAdmin.from('birthday_contact_alerts').insert({
        user_id: userId,
        contact_id: null,
        contact_phone: profile.phone,
        contact_name: firstName,
        alert_type: 'friends_circle_welcome',
        channel: 'whatsapp',
        days_before: 0,
        status: waResult.success ? 'sent' : 'failed',
        sent_at: waResult.success ? new Date().toISOString() : null,
        error_message: waResult.error || null,
      });
      if (insertError) {
        console.error('Failed to record welcome alert:', insertError.message);
      }

      return new Response(JSON.stringify({ sent: waResult.success }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ========== CRON MODE (optimized) ==========
    console.log('Starting check-friends-circle-reminders CRON job (optimized)...');

    // Single RPC query to get all eligible candidates
    const { data: candidates, error: rpcError } = await supabaseAdmin
      .rpc('get_friends_circle_reminder_candidates', { max_results: MAX_CANDIDATES });

    if (rpcError) {
      console.error('Error fetching candidates via RPC:', rpcError);
      throw rpcError;
    }

    if (!candidates || candidates.length === 0) {
      console.log('No eligible candidates found');
      return new Response(JSON.stringify({ reminders_sent: 0, total_candidates: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${candidates.length} eligible candidates, processing in batches of ${BATCH_SIZE}...`);

    let remindersSent = 0;
    let errors = 0;

    // Process in parallel batches
    for (let i = 0; i < candidates.length; i += BATCH_SIZE) {
      const batch = candidates.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      console.log(`Processing batch ${batchNum} (${batch.length} users)...`);

      const results = await Promise.allSettled(
        batch.map(async (user: { user_id: string; first_name: string; phone: string }) => {
          const firstName = user.first_name || 'Ami(e)';

          // Send WhatsApp template
          const waResult = await sendWhatsAppTemplate(
            user.phone,
            'joiedevivre_friends_circle_reminder',
            'fr',
            [firstName]
          );

          // SMS fallback ONLY if WhatsApp failed
          let finalChannel: 'whatsapp' | 'sms' = 'whatsapp';
          let finalSuccess = waResult.success;
          let finalError = waResult.error;
          let finalSid = waResult.sid;

          if (!waResult.success) {
            const channel = getPreferredChannel(user.phone);
            if (channel === 'sms') {
              const smsMsg = `${firstName}, ton cercle d'amis n'est pas encore complet ! Ajoute des proches: joiedevivre-africa.com/contacts`;
              const smsResult = await sendSms(user.phone, smsMsg);
              finalChannel = 'sms';
              finalSuccess = smsResult.success;
              finalError = smsResult.error;
              finalSid = smsResult.sid;
            }
          }

          // Record alert
          const { error: insertError } = await supabaseAdmin.from('birthday_contact_alerts').insert({
            user_id: user.user_id,
            contact_id: null,
            contact_phone: user.phone,
            contact_name: firstName,
            alert_type: 'friends_circle_reminder',
            channel: finalChannel,
            days_before: 0,
            status: finalSuccess ? 'sent' : 'failed',
            sent_at: finalSuccess ? new Date().toISOString() : null,
            error_message: finalError || null,
          });

          if (insertError) {
            console.error(`Failed to record alert for ${user.user_id}:`, insertError.message);
          }

          return { userId: user.user_id, success: finalSuccess, sid: finalSid };
        })
      );

      // Count results
      for (const result of results) {
        if (result.status === 'fulfilled' && result.value.success) {
          remindersSent++;
        } else {
          errors++;
          if (result.status === 'rejected') {
            console.error('Batch item rejected:', result.reason);
          }
        }
      }
    }

    console.log(`CRON completed: ${remindersSent} reminders sent, ${errors} errors, ${candidates.length} candidates processed`);

    return new Response(JSON.stringify({
      reminders_sent: remindersSent,
      errors,
      total_candidates: candidates.length,
    }), {
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
