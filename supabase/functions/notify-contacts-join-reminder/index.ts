import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendSms, sendWhatsApp, sendWhatsAppTemplate, getPreferredChannel } from "../_shared/sms-sender.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = "https://vaimfeurvzokepqqqrsl.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const DEDUP_DAYS = 14; // 1 rappel toutes les 2 semaines
const MIN_AGE_DAYS = 7; // Contact ajouté il y a au moins 7 jours

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('Starting notify-contacts-join-reminder CRON job...');

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 1. Find contacts added > 7 days ago with no linked user account
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - MIN_AGE_DAYS);

    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('id, user_id, name, phone')
      .is('linked_user_id', null)
      .not('phone', 'is', null)
      .lte('created_at', cutoffDate.toISOString());

    if (contactsError) {
      throw new Error(`Error fetching contacts: ${contactsError.message}`);
    }

    console.log(`Found ${contacts?.length || 0} non-registered contacts older than ${MIN_AGE_DAYS} days`);

    const JOIN_REMINDER_IMAGE_URL = Deno.env.get('JOIN_REMINDER_IMAGE_URL')
      || 'https://vaimfeurvzokepqqqrsl.supabase.co/storage/v1/object/public/assets/join-reminder-header.jpg';

    let totalSent = 0;
    let totalSkipped = 0;
    let totalErrors = 0;

    for (const contact of contacts || []) {
      if (!contact.phone) continue;

      // 2. Check deduplication — no join_reminder sent in last DEDUP_DAYS days
      const dedupDate = new Date();
      dedupDate.setDate(dedupDate.getDate() - DEDUP_DAYS);

      const { data: existingAlert } = await supabase
        .from('birthday_contact_alerts')
        .select('id')
        .eq('contact_phone', contact.phone)
        .eq('alert_type', 'join_reminder')
        .gte('created_at', dedupDate.toISOString())
        .maybeSingle();

      if (existingAlert) {
        totalSkipped++;
        continue;
      }

      // 3. Get the owner's name (who added this contact)
      const { data: ownerProfile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('user_id', contact.user_id)
        .single();

      const ownerName = ownerProfile?.first_name
        ? `${ownerProfile.first_name}${ownerProfile.last_name ? ' ' + ownerProfile.last_name : ''}`
        : 'Un ami';

      // 4. Send notification — WhatsApp-first strategy
      const channel = getPreferredChannel(contact.phone);
      const message = `${ownerName} t'a ajouté à son cercle d'amis sur Joie de Vivre 🎉 Crée ton cercle pour profiter aussi de la générosité de tes proches 👉 joiedevivre-africa.com`;

      const JOIN_REMINDER_IMAGE_URL = Deno.env.get('JOIN_REMINDER_IMAGE_URL')
        || 'https://vaimfeurvzokepqqqrsl.supabase.co/storage/v1/object/public/assets/join-reminder-header.jpg';

      let sendResult: { success: boolean; error?: string } = { success: false };

      // Always try WhatsApp template first (WhatsApp-first for viral invitations)
      console.log(`📤 [WhatsApp] Sending join reminder to ${contact.phone}`);
      const waResult = await sendWhatsAppTemplate(
        contact.phone,
        'joiedevivre_join_reminder',
        'fr',
        [ownerName],
        undefined,              // No buttonParameters (static CTA)
        JOIN_REMINDER_IMAGE_URL // Header image required by Meta template
      );
      if (waResult.success) {
        sendResult = { success: true };
      } else {
        console.log(`⚠️ [WhatsApp] Template failed: ${waResult.error}`);
      }

      // Fallback to SMS if WhatsApp failed
      if (!sendResult.success) {
        console.log(`📤 [SMS] Sending join reminder to ${contact.phone}`);
        const smsResult = await sendSms(contact.phone, message);
        sendResult = { success: smsResult.success, error: smsResult.error };
      }

      // 5. Record the alert for deduplication
      await supabase
        .from('birthday_contact_alerts')
        .insert({
          user_id: contact.user_id,
          contact_id: contact.id,
          contact_phone: contact.phone,
          contact_name: contact.name,
          alert_type: 'join_reminder',
          channel: channel,
          days_before: 0,
          status: sendResult.success ? 'sent' : 'failed',
          sent_at: sendResult.success ? new Date().toISOString() : null,
          error_message: sendResult.error || null,
        });

      if (sendResult.success) {
        totalSent++;
        console.log(`✅ Join reminder sent to ${contact.phone} (added by ${ownerName})`);
      } else {
        totalErrors++;
        console.log(`❌ Failed to send join reminder to ${contact.phone}: ${sendResult.error}`);
      }
    }

    console.log(`Phase 1 completed: ${totalSent} sent, ${totalSkipped} skipped (dedup), ${totalErrors} errors`);

    // ============================================================
    // PHASE 2: Registered users with NO contacts (empty circle)
    // ============================================================
    console.log('--- Phase 2: Registered users with no contacts ---');

    let phase2Sent = 0;
    let phase2Skipped = 0;
    let phase2Errors = 0;

    // Get all user_ids that have at least one contact
    const { data: usersWithContacts } = await supabase
      .from('contacts')
      .select('user_id');

    const userIdsWithContacts = new Set(
      (usersWithContacts || []).map((c: any) => c.user_id)
    );

    // Get profiles registered > 7 days ago with a phone
    const { data: allProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, first_name, phone')
      .not('phone', 'is', null)
      .lte('created_at', cutoffDate.toISOString());

    if (profilesError) {
      console.error('Error fetching profiles for Phase 2:', profilesError.message);
    } else {
      // Filter to only users with zero contacts
      const usersWithoutContacts = (allProfiles || []).filter(
        (p: any) => p.phone && !userIdsWithContacts.has(p.user_id)
      );

      console.log(`Found ${usersWithoutContacts.length} registered users with no contacts`);

      for (const profile of usersWithoutContacts) {
        // Deduplication check
        const dedupDate = new Date();
        dedupDate.setDate(dedupDate.getDate() - DEDUP_DAYS);

        const { data: existingAlert } = await supabase
          .from('birthday_contact_alerts')
          .select('id')
          .eq('contact_phone', profile.phone)
          .eq('alert_type', 'join_reminder_registered')
          .gte('created_at', dedupDate.toISOString())
          .maybeSingle();

        if (existingAlert) {
          phase2Skipped++;
          continue;
        }

        const firstName = profile.first_name || 'Joie de Vivre';
        const channel = getPreferredChannel(profile.phone);
        const message = `Bienvenue sur Joie de Vivre 🎉 Crée ton cercle d'amis pour ne jamais oublier un anniversaire et profiter de la générosité de tes proches 👉 joiedevivre-africa.com`;

        let sendResult: { success: boolean; error?: string } = { success: false };

        // WhatsApp template first
        console.log(`📤 [Phase2/WhatsApp] Sending join reminder to ${profile.phone}`);
        const waResult = await sendWhatsAppTemplate(
          profile.phone,
          'joiedevivre_join_reminder',
          'fr',
          [firstName],
          undefined,
          JOIN_REMINDER_IMAGE_URL
        );

        if (waResult.success) {
          sendResult = { success: true };
        } else {
          console.log(`⚠️ [Phase2/WhatsApp] Template failed: ${waResult.error}`);
          // Fallback SMS
          console.log(`📤 [Phase2/SMS] Sending join reminder to ${profile.phone}`);
          const smsResult = await sendSms(profile.phone, message);
          sendResult = { success: smsResult.success, error: smsResult.error };
        }

        // Log for deduplication
        await supabase
          .from('birthday_contact_alerts')
          .insert({
            user_id: profile.user_id,
            contact_phone: profile.phone,
            contact_name: firstName,
            alert_type: 'join_reminder_registered',
            channel: channel,
            days_before: 0,
            status: sendResult.success ? 'sent' : 'failed',
            sent_at: sendResult.success ? new Date().toISOString() : null,
            error_message: sendResult.error || null,
          });

        if (sendResult.success) {
          phase2Sent++;
          console.log(`✅ [Phase2] Join reminder sent to ${profile.phone} (${firstName})`);
        } else {
          phase2Errors++;
          console.log(`❌ [Phase2] Failed: ${profile.phone}: ${sendResult.error}`);
        }
      }
    }

    console.log(`Phase 2 completed: ${phase2Sent} sent, ${phase2Skipped} skipped, ${phase2Errors} errors`);
    console.log(`CRON total: Phase1(${totalSent}/${totalSkipped}/${totalErrors}) + Phase2(${phase2Sent}/${phase2Skipped}/${phase2Errors})`);

    return new Response(
      JSON.stringify({
        success: true,
        phase1: { sent: totalSent, skipped: totalSkipped, errors: totalErrors },
        phase2: { sent: phase2Sent, skipped: phase2Skipped, errors: phase2Errors },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in notify-contacts-join-reminder:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
