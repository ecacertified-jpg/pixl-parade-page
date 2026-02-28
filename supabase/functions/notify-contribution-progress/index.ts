import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendWhatsAppTemplate } from "../_shared/sms-sender.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-source',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fund_id, contributor_id } = await req.json();
    if (!fund_id || !contributor_id) {
      return new Response(JSON.stringify({ error: 'fund_id and contributor_id required' }), { status: 400, headers: corsHeaders });
    }

    console.log(`🚀 [notify-contribution-progress] fund=${fund_id}, contributor=${contributor_id}`);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 1. Fetch fund info
    const { data: fund, error: fundError } = await supabase
      .from('collective_funds')
      .select('id, title, current_amount, target_amount, currency, deadline_date, beneficiary_contact_id, creator_id, status')
      .eq('id', fund_id)
      .single();

    if (fundError || !fund) {
      console.error('❌ Fund not found:', fundError);
      return new Response(JSON.stringify({ error: 'Fund not found' }), { status: 404, headers: corsHeaders });
    }

    // Skip if fund already completed/expired
    if (fund.status === 'completed' || fund.status === 'expired' || fund.status === 'cancelled') {
      console.log(`⏭️ Fund status is ${fund.status}, skipping`);
      return new Response(JSON.stringify({ skipped: true, reason: 'fund_not_active' }), { headers: corsHeaders });
    }

    // 2. Deduplication: check if notification sent in last 4 hours for this fund
    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
    const { data: recentNotif } = await supabase
      .from('scheduled_notifications')
      .select('id')
      .eq('notification_type', 'contribution_progress_update')
      .gte('scheduled_for', fourHoursAgo)
      .filter('action_data->>fund_id', 'eq', fund_id)
      .limit(1);

    if (recentNotif && recentNotif.length > 0) {
      console.log(`⏭️ Deduplication: notification already sent for fund ${fund_id} in last 4h`);
      return new Response(JSON.stringify({ skipped: true, reason: 'dedup_4h' }), { headers: corsHeaders });
    }

    // 3. Calculate progression
    const percentage = Math.min(100, Math.round((fund.current_amount / fund.target_amount) * 100));
    const currentAmountStr = String(fund.current_amount || 0);

    // 4. Calculate days remaining (birthday first, then deadline)
    let daysRemaining = 'bientôt';
    if (fund.beneficiary_contact_id) {
      const { data: contact } = await supabase
        .from('contacts')
        .select('birthday, name')
        .eq('id', fund.beneficiary_contact_id)
        .single();

      if (contact?.birthday) {
        const today = new Date();
        const birthday = new Date(contact.birthday);
        let nextBirthday = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate());
        if (nextBirthday <= today) {
          nextBirthday = new Date(today.getFullYear() + 1, birthday.getMonth(), birthday.getDate());
        }
        const diffDays = Math.ceil((nextBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        daysRemaining = String(diffDays);
      }
    }
    if (daysRemaining === 'bientôt' && fund.deadline_date) {
      const deadline = new Date(fund.deadline_date);
      const today = new Date();
      const diffDays = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays > 0) {
        daysRemaining = String(diffDays);
      }
    }

    // 5. Get contributor name
    const { data: contributorProfile } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('user_id', contributor_id)
      .single();

    const contributorName = contributorProfile
      ? [contributorProfile.first_name, contributorProfile.last_name].filter(Boolean).join(' ') || 'Un ami'
      : 'Un ami';

    // 6. Get beneficiary name
    let beneficiaryName = 'le bénéficiaire';
    if (fund.beneficiary_contact_id) {
      const { data: contact } = await supabase
        .from('contacts')
        .select('name')
        .eq('id', fund.beneficiary_contact_id)
        .single();
      if (contact?.name) beneficiaryName = contact.name;
    }
    if (beneficiaryName === 'le bénéficiaire' && fund.title?.includes(' pour ')) {
      beneficiaryName = fund.title.split(' pour ').pop() || beneficiaryName;
    }

    // 7. Get existing contributors (excluding current contributor)
    const { data: contributions } = await supabase
      .from('fund_contributions')
      .select('contributor_id')
      .eq('fund_id', fund_id);

    const uniqueContributorIds = [...new Set(
      (contributions || [])
        .map(c => c.contributor_id)
        .filter(id => id !== contributor_id)
    )];

    // 8. Get contributors' phones
    let updatesSent = 0;
    if (uniqueContributorIds.length > 0) {
      const { data: contributorProfiles } = await supabase
        .from('profiles')
        .select('user_id, first_name, phone')
        .in('user_id', uniqueContributorIds);

      for (const profile of (contributorProfiles || [])) {
        if (!profile.phone) continue;
        const recipientName = profile.first_name || 'Ami(e)';
        try {
          await sendWhatsAppTemplate(
            profile.phone,
            'joiedevivre_contribution_update',
            'fr',
            [recipientName, contributorName, beneficiaryName, String(percentage), currentAmountStr, daysRemaining],
            [fund_id] // CTA: /f/{fund_id}
          );
          updatesSent++;
        } catch (err) {
          console.error(`❌ WhatsApp update failed for ${profile.user_id}:`, err);
        }
      }
    }

    // 9. Get friends of creator who haven't contributed -> nudge
    let nudgesSent = 0;
    const { data: friendRels } = await supabase
      .from('contact_relationships')
      .select('user_a, user_b, can_see_funds')
      .or(`user_a.eq.${fund.creator_id},user_b.eq.${fund.creator_id}`)
      .eq('can_see_funds', true);

    const friendIds = (friendRels || [])
      .map(rel => rel.user_a === fund.creator_id ? rel.user_b : rel.user_a)
      .filter(id => id !== contributor_id && !uniqueContributorIds.includes(id));

    const uniqueFriendIds = [...new Set(friendIds)];

    if (uniqueFriendIds.length > 0) {
      const { data: friendProfiles } = await supabase
        .from('profiles')
        .select('user_id, first_name, phone')
        .in('user_id', uniqueFriendIds);

      for (const profile of (friendProfiles || [])) {
        if (!profile.phone) continue;
        const recipientName = profile.first_name || 'Ami(e)';
        try {
          await sendWhatsAppTemplate(
            profile.phone,
            'joiedevivre_contribution_nudge',
            'fr',
            [recipientName, contributorName, beneficiaryName, String(percentage), daysRemaining],
            [fund_id] // CTA: /f/{fund_id}
          );
          nudgesSent++;
        } catch (err) {
          console.error(`❌ WhatsApp nudge failed for ${profile.user_id}:`, err);
        }
      }
    }

    // 10. Create deduplication marker + in-app notification for creator
    await supabase
      .from('scheduled_notifications')
      .insert({
        user_id: fund.creator_id,
        notification_type: 'contribution_progress_update',
        smart_notification_category: 'fund_update',
        title: '💰 Nouvelle contribution !',
        message: `${contributorName} a contribué à la cagnotte "${fund.title}". Progression : ${percentage}% (${currentAmountStr} ${fund.currency || 'XOF'}).`,
        scheduled_for: new Date().toISOString(),
        delivery_methods: ['in_app'],
        priority_score: 70,
        action_data: {
          fund_id: fund_id,
          contributor_name: contributorName,
          percentage,
          current_amount: fund.current_amount,
          days_remaining: daysRemaining
        }
      });

    console.log(`✅ [notify-contribution-progress] Done. Updates: ${updatesSent}, Nudges: ${nudgesSent}`);

    return new Response(JSON.stringify({
      success: true,
      updates_sent: updatesSent,
      nudges_sent: nudgesSent,
      percentage,
      days_remaining: daysRemaining
    }), { headers: corsHeaders });

  } catch (error) {
    console.error('❌ [notify-contribution-progress] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
});
