import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendSms, sendWhatsApp, sendWhatsAppTemplate, formatPhoneForTwilio, isValidPhoneForSms, getPreferredChannel } from "../_shared/sms-sender.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FundReminder {
  id: string;
  fund_id: string;
  target_user_id: string;
  target_phone: string;
  reminder_date: string;
  reminder_number: number;
}

interface CollectiveFund {
  id: string;
  title: string;
  status: string;
  current_amount: number;
  target_amount: number;
  deadline_date: string;
  share_token: string;
  creator_id: string;
  beneficiary_contact_id: string | null;
}

interface Profile {
  first_name: string | null;
  last_name: string | null;
}

interface Contact {
  name: string | null;
}

/**
 * Builds the SMS message based on reminder number and fund progress
 */
function buildSmsMessage(
  reminder: FundReminder,
  fund: CollectiveFund,
  creatorName: string,
  beneficiaryName: string
): string {
  const progressPercent = fund.target_amount > 0 
    ? Math.round((fund.current_amount / fund.target_amount) * 100)
    : 0;
  
  const daysRemaining = Math.ceil(
    (new Date(fund.deadline_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  
  const fundUrl = `joiedevivre-africa.com/c/${fund.share_token}`;
  
  // Dernier rappel (J-1)
  if (reminder.reminder_number === -1) {
    return `DERNIER JOUR: Cagnotte pour ${beneficiaryName} à ${progressPercent}%. Contribue maintenant! ${fundUrl}`;
  }
  
  // Premier rappel (création)
  if (reminder.reminder_number === 1) {
    const targetFormatted = fund.target_amount.toLocaleString('fr-FR');
    return `${creatorName} a lancé une cagnotte pour ${beneficiaryName}! Objectif: ${targetFormatted} XOF. Participe: ${fundUrl}`;
  }
  
  // Rappels suivants
  return `Rappel: La cagnotte pour ${beneficiaryName} a atteint ${progressPercent}%. Plus que ${daysRemaining}j! ${fundUrl}`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔔 [CRON] Starting fund contribution reminders check...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get today's pending reminders
    const today = new Date().toISOString().split('T')[0];
    console.log(`📅 Processing reminders for date: ${today}`);
    
    const { data: reminders, error: remindersError } = await supabase
      .from('fund_contribution_reminders')
      .select('*')
      .eq('reminder_date', today)
      .eq('status', 'pending')
      .limit(100);
    
    if (remindersError) {
      console.error('❌ Error fetching reminders:', remindersError);
      throw remindersError;
    }
    
    if (!reminders || reminders.length === 0) {
      console.log('✅ No pending reminders for today');
      return new Response(
        JSON.stringify({ success: true, processed: 0, message: 'No pending reminders' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`📬 Found ${reminders.length} reminders to process`);
    
    const results = {
      sent: 0,
      skipped: 0,
      failed: 0,
      details: [] as Array<{ id: string; status: string; reason?: string }>
    };
    
    // Process each reminder
    for (const reminder of reminders as FundReminder[]) {
      try {
        console.log(`\n📨 Processing reminder ${reminder.id} for fund ${reminder.fund_id}`);
        
        // 1. Check fund status
        const { data: fund, error: fundError } = await supabase
          .from('collective_funds')
          .select('id, title, status, current_amount, target_amount, deadline_date, share_token, creator_id, beneficiary_contact_id')
          .eq('id', reminder.fund_id)
          .single();
        
        if (fundError || !fund) {
          console.log(`⏭️ Skipping: Fund not found`);
          await supabase
            .from('fund_contribution_reminders')
            .update({ status: 'skipped', skip_reason: 'fund_closed' })
            .eq('id', reminder.id);
          results.skipped++;
          results.details.push({ id: reminder.id, status: 'skipped', reason: 'fund_not_found' });
          continue;
        }
        
        // 2. Check if fund is still active
        if (fund.status !== 'active') {
          console.log(`⏭️ Skipping: Fund status is ${fund.status}`);
          await supabase
            .from('fund_contribution_reminders')
            .update({ status: 'skipped', skip_reason: 'fund_closed' })
            .eq('id', reminder.id);
          results.skipped++;
          results.details.push({ id: reminder.id, status: 'skipped', reason: 'fund_closed' });
          continue;
        }
        
        // 3. Check if goal is reached
        if (fund.current_amount >= fund.target_amount) {
          console.log(`⏭️ Skipping: Goal reached (${fund.current_amount}/${fund.target_amount})`);
          await supabase
            .from('fund_contribution_reminders')
            .update({ status: 'skipped', skip_reason: 'goal_reached' })
            .eq('id', reminder.id);
          results.skipped++;
          results.details.push({ id: reminder.id, status: 'skipped', reason: 'goal_reached' });
          continue;
        }
        
        // 4. Check if user already contributed
        const { count: contributionCount } = await supabase
          .from('fund_contributions')
          .select('*', { count: 'exact', head: true })
          .eq('fund_id', reminder.fund_id)
          .eq('contributor_id', reminder.target_user_id);
        
        if (contributionCount && contributionCount > 0) {
          console.log(`⏭️ Skipping: User already contributed`);
          await supabase
            .from('fund_contribution_reminders')
            .update({ status: 'skipped', skip_reason: 'contributed' })
            .eq('id', reminder.id);
          results.skipped++;
          results.details.push({ id: reminder.id, status: 'skipped', reason: 'already_contributed' });
          continue;
        }
        
        // 5. Validate phone number
        if (!isValidPhoneForSms(reminder.target_phone)) {
          console.log(`⏭️ Skipping: Invalid phone number`);
          await supabase
            .from('fund_contribution_reminders')
            .update({ status: 'skipped', skip_reason: 'invalid_phone' })
            .eq('id', reminder.id);
          results.skipped++;
          results.details.push({ id: reminder.id, status: 'skipped', reason: 'invalid_phone' });
          continue;
        }
        
        // 6. Get creator name
        const { data: creatorProfile } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('user_id', fund.creator_id)
          .single();
        
        const creatorName = creatorProfile?.first_name || 'Un ami';
        
        // 7. Get beneficiary name
        let beneficiaryName = 'un proche';
        if (fund.beneficiary_contact_id) {
          const { data: contact } = await supabase
            .from('contacts')
            .select('name')
            .eq('id', fund.beneficiary_contact_id)
            .single();
          
          if (contact?.name) {
            beneficiaryName = contact.name.split(' ')[0]; // First name only
          }
        }
        
        // 8. Build and send SMS
        const message = buildSmsMessage(
          reminder,
          fund as CollectiveFund,
          creatorName,
          beneficiaryName
        );
        
        const formattedPhone = formatPhoneForTwilio(reminder.target_phone);
        const channel = getPreferredChannel(formattedPhone);
        console.log(`📱 Sending via ${channel}: "${message.substring(0, 50)}..."`);
        
        let sendResult;
        if (channel === 'whatsapp') {
          // Try template first, fallback to free text
          const remaining = fund.target_amount - fund.current_amount;
          sendResult = await sendWhatsAppTemplate(
            formattedPhone,
            'joiedevivre_contribution_reminder',
            'fr',
            [fund.title || beneficiaryName, `${remaining.toLocaleString('fr-FR')} XOF`]
          );
          if (!sendResult.success) {
            console.log(`⚠️ [WhatsApp] Template failed, trying free text: ${sendResult.error}`);
            sendResult = await sendWhatsApp(formattedPhone, message);
          }
        } else {
          sendResult = await sendSms(formattedPhone, message);
        }
        
        if (sendResult.success) {
          console.log(`✅ [${channel}] Sent successfully: ${sendResult.sid}`);
          await supabase
            .from('fund_contribution_reminders')
            .update({ 
              status: 'sent', 
              sent_at: new Date().toISOString() 
            })
            .eq('id', reminder.id);
          results.sent++;
          results.details.push({ id: reminder.id, status: 'sent' });
        } else {
          console.error(`❌ [${channel}] Failed: ${sendResult.error}`);
          await supabase
            .from('fund_contribution_reminders')
            .update({ status: 'skipped', skip_reason: `${channel}_failed` })
            .eq('id', reminder.id);
          results.failed++;
          results.details.push({ id: reminder.id, status: 'failed', reason: sendResult.error });
        }
        
      } catch (reminderError) {
        console.error(`❌ Error processing reminder ${reminder.id}:`, reminderError);
        results.failed++;
        results.details.push({ 
          id: reminder.id, 
          status: 'failed', 
          reason: reminderError.message 
        });
      }
    }
    
    console.log(`\n📊 Summary: ${results.sent} sent, ${results.skipped} skipped, ${results.failed} failed`);
    
    return new Response(
      JSON.stringify({
        success: true,
        processed: reminders.length,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('❌ Fatal error in check-fund-contribution-reminders:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
