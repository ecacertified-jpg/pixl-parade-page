import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendWhatsAppTemplate } from "../_shared/sms-sender.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-source',
};

/** Trim all string params to avoid Meta API #100 errors from trailing spaces */
function trimParams(params: string[]): string[] {
  return params.map(p => p.trim());
}

/** Truncate params to avoid Meta API rejections on overly long values */
function safeParam(value: string, maxLen = 200): string {
  const cleaned = value.trim();
  return cleaned.length > maxLen ? cleaned.substring(0, maxLen) : cleaned;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fund_id } = await req.json();
    if (!fund_id) {
      return new Response(JSON.stringify({ error: 'fund_id required' }), { status: 400, headers: corsHeaders });
    }

    console.log(`🚀 [notify-fund-ready] Processing fund ${fund_id}`);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Verify fund is at target
    const { data: fund, error: fundError } = await supabase
      .from('collective_funds')
      .select('id, title, current_amount, target_amount, status, creator_id, beneficiary_contact_id')
      .eq('id', fund_id)
      .single();

    if (fundError || !fund) {
      console.error('❌ Fund not found:', fundError);
      return new Response(JSON.stringify({ error: 'Fund not found' }), { status: 404, headers: corsHeaders });
    }

    if (fund.current_amount < fund.target_amount) {
      console.log('⏭️ Fund not yet at target, skipping');
      return new Response(JSON.stringify({ skipped: true, reason: 'not_at_target' }), { headers: corsHeaders });
    }

    // Find linked business fund
    const { data: bf } = await supabase
      .from('business_collective_funds')
      .select('fund_id, business_id, product_id, beneficiary_user_id')
      .eq('fund_id', fund_id)
      .single();

    if (!bf) {
      console.log('⏭️ Not a business fund, skipping');
      return new Response(JSON.stringify({ skipped: true, reason: 'not_business_fund' }), { headers: corsHeaders });
    }

    // Deduplication: check if already sent
    const { data: existingNotif } = await supabase
      .from('scheduled_notifications')
      .select('id')
      .eq('notification_type', 'fund_ready_business')
      .eq('action_data->>fund_id', bf.fund_id)
      .limit(1);

    if (existingNotif && existingNotif.length > 0) {
      console.log(`⏭️ Notification already sent for fund ${bf.fund_id}`);
      return new Response(JSON.stringify({ skipped: true, reason: 'already_sent' }), { headers: corsHeaders });
    }

    // Get business account
    const { data: business } = await supabase
      .from('business_accounts')
      .select('user_id, business_name, phone')
      .eq('id', bf.business_id)
      .single();

    if (!business) {
      console.warn(`⚠️ Business not found for ID ${bf.business_id}`);
      return new Response(JSON.stringify({ error: 'Business not found' }), { status: 404, headers: corsHeaders });
    }

    // Get product name
    const { data: product } = await supabase
      .from('products')
      .select('name')
      .eq('id', bf.product_id)
      .single();

    const productName = product?.name || 'Produit';
    const fundTitle = fund.title || 'Cagnotte';
    const fundAmount = fund.target_amount || fund.current_amount || 0;

    // Get beneficiary name
    let beneficiaryName = 'le bénéficiaire';
    if (bf.beneficiary_user_id) {
      const { data: beneficiary } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('user_id', bf.beneficiary_user_id)
        .single();

      if (beneficiary) {
        beneficiaryName = [beneficiary.first_name, beneficiary.last_name].filter(Boolean).join(' ') || 'le bénéficiaire';
      }
    }

    // Get business owner first name
    const { data: ownerProfile } = await supabase
      .from('profiles')
      .select('first_name')
      .eq('user_id', business.user_id)
      .single();

    const ownerFirstName = ownerProfile?.first_name || business.business_name;

    // =============================================
    // SECTION 1: Notify vendor (existing logic)
    // =============================================
    let whatsappSent = false;
    if (business.phone) {
      try {
        const waResult = await sendWhatsAppTemplate(
          business.phone,
          'joiedevivre_fund_ready',
          'fr',
          trimParams([safeParam(ownerFirstName), safeParam(beneficiaryName), String(fundAmount), safeParam(productName), safeParam(beneficiaryName)]),
          [bf.fund_id] // CTA button: /business/orders/{fund_id}
        );
        whatsappSent = waResult.success;
        console.log(`📱 WhatsApp to ${business.business_name}: ${waResult.success ? '✅' : '❌ ' + waResult.error}`);
      } catch (waError) {
        console.error(`❌ WhatsApp failed for ${business.business_name}:`, waError);
      }
    } else {
      console.warn(`⚠️ No phone for business ${business.business_name}`);
    }

    // Create in-app notification for vendor (also serves as deduplication marker)
    await supabase
      .from('scheduled_notifications')
      .insert({
        user_id: business.user_id,
        notification_type: 'fund_ready_business',
        smart_notification_category: 'business_order',
        title: '🎁 Cagnotte prête - Commande à préparer !',
        message: `La cagnotte "${fundTitle}" a atteint ${fundAmount} XOF. Produit : ${productName}. Bénéficiaire : ${beneficiaryName}. Merci de préparer la commande.`,
        scheduled_for: new Date().toISOString(),
        delivery_methods: ['in_app', 'push'],
        priority_score: 95,
        action_data: {
          fund_id: bf.fund_id,
          product_id: bf.product_id,
          product_name: productName,
          beneficiary_name: beneficiaryName,
          amount: fundAmount,
          action_type: 'prepare_order'
        }
      });

    console.log(`✅ Vendor notification created for ${business.business_name} (fund: ${fundTitle})`);

    // =============================================
    // SECTION 2: Notify friends (new logic)
    // =============================================
    console.log(`🎉 [notify-fund-ready] Starting friend notifications for fund ${fund_id}`);

    const sentPhones = new Set<string>();
    const allNotifiedUserIds = new Set<string>();
    let friendWaSent = 0;
    let friendWaFailed = 0;

    // Exclude vendor phone from friend notifications
    if (business.phone) {
      sentPhones.add(business.phone.replace(/\s+/g, ''));
    }
    // Exclude vendor user_id
    allNotifiedUserIds.add(business.user_id);

    // Helper: send fund_completed WhatsApp + in-app notification
    async function notifyFriend(profile: { user_id: string; first_name: string | null; phone: string | null }, source: string) {
      const recipientName = profile.first_name || 'Ami(e)';

      // WhatsApp
      if (profile.phone) {
        const normalizedPhone = profile.phone.replace(/\s+/g, '');
        if (!sentPhones.has(normalizedPhone)) {
          try {
            await sendWhatsAppTemplate(
              profile.phone,
              'joiedevivre_fund_completed',
              'fr',
              trimParams([safeParam(recipientName), safeParam(fundTitle), safeParam(beneficiaryName), String(fundAmount)]),
              [fund_id] // CTA: /f/{fund_id}
            );
            sentPhones.add(normalizedPhone);
            friendWaSent++;
            console.log(`📱 Fund completed WA -> ${source} ${profile.user_id}: ✅`);
          } catch (err) {
            friendWaFailed++;
            console.error(`❌ Fund completed WA failed for ${source} ${profile.user_id}:`, err);
          }
        } else {
          console.log(`⏭️ Dedup phone: ${normalizedPhone} already sent (${source} ${profile.user_id})`);
        }
      }

      // In-app notification (always, regardless of phone)
      if (!allNotifiedUserIds.has(profile.user_id)) {
        allNotifiedUserIds.add(profile.user_id);
        await supabase
          .from('scheduled_notifications')
          .insert({
            user_id: profile.user_id,
            notification_type: 'fund_completed',
            smart_notification_category: 'fund_milestone',
            title: '🎉 Objectif atteint !',
            message: `La cagnotte "${fundTitle}" pour ${beneficiaryName} a atteint son objectif de ${fundAmount} XOF ! Merci pour votre générosité.`,
            scheduled_for: new Date().toISOString(),
            delivery_methods: ['in_app', 'push'],
            priority_score: 85,
            action_data: {
              fund_id: fund_id,
              beneficiary_name: beneficiaryName,
              amount: fundAmount,
              action_type: 'view_fund'
            }
          });
      }
    }

    // A. Contributors
    const { data: contributions } = await supabase
      .from('fund_contributions')
      .select('contributor_id')
      .eq('fund_id', fund_id);

    const uniqueContributorIds = [...new Set((contributions || []).map(c => c.contributor_id))];
    console.log(`👥 Contributors: ${uniqueContributorIds.length}`);

    if (uniqueContributorIds.length > 0) {
      const { data: contributorProfiles } = await supabase
        .from('profiles')
        .select('user_id, first_name, phone')
        .in('user_id', uniqueContributorIds);

      for (const profile of (contributorProfiles || [])) {
        await notifyFriend(profile, 'contributor');
      }
    }

    // B. Friends of the creator (can_see_funds = true)
    const { data: creatorFriendRels } = await supabase
      .from('contact_relationships')
      .select('user_a, user_b')
      .or(`user_a.eq.${fund.creator_id},user_b.eq.${fund.creator_id}`)
      .eq('can_see_funds', true);

    const creatorFriendIds = (creatorFriendRels || [])
      .map(rel => rel.user_a === fund.creator_id ? rel.user_b : rel.user_a)
      .filter(id => !allNotifiedUserIds.has(id));

    const uniqueCreatorFriendIds = [...new Set(creatorFriendIds)];
    console.log(`👫 Creator friends: ${uniqueCreatorFriendIds.length}`);

    if (uniqueCreatorFriendIds.length > 0) {
      const { data: friendProfiles } = await supabase
        .from('profiles')
        .select('user_id, first_name, phone')
        .in('user_id', uniqueCreatorFriendIds);

      for (const profile of (friendProfiles || [])) {
        await notifyFriend(profile, 'creator_friend');
      }
    }

    // C. Friends of the beneficiary (via linked_user_id)
    let beneficiaryUserId = bf.beneficiary_user_id;
    if (!beneficiaryUserId && fund.beneficiary_contact_id) {
      const { data: beneficiaryContact } = await supabase
        .from('contacts')
        .select('linked_user_id')
        .eq('id', fund.beneficiary_contact_id)
        .single();
      beneficiaryUserId = beneficiaryContact?.linked_user_id;
    }

    if (beneficiaryUserId) {
      const { data: beneficiaryFriendRels } = await supabase
        .from('contact_relationships')
        .select('user_a, user_b')
        .or(`user_a.eq.${beneficiaryUserId},user_b.eq.${beneficiaryUserId}`)
        .eq('can_see_funds', true);

      const beneficiaryFriendIds = (beneficiaryFriendRels || [])
        .map(rel => rel.user_a === beneficiaryUserId ? rel.user_b : rel.user_a)
        .filter(id => !allNotifiedUserIds.has(id));

      const uniqueBeneficiaryFriendIds = [...new Set(beneficiaryFriendIds)];
      console.log(`👫 Beneficiary friends: ${uniqueBeneficiaryFriendIds.length}`);

      if (uniqueBeneficiaryFriendIds.length > 0) {
        const { data: bFriendProfiles } = await supabase
          .from('profiles')
          .select('user_id, first_name, phone')
          .in('user_id', uniqueBeneficiaryFriendIds);

        for (const profile of (bFriendProfiles || [])) {
          await notifyFriend(profile, 'beneficiary_friend');
        }
      }
    }

    console.log(`✅ [notify-fund-ready] Done. Vendor: ${business.business_name}, FriendWA: ${friendWaSent} sent / ${friendWaFailed} failed, Unique phones: ${sentPhones.size}, Notified users: ${allNotifiedUserIds.size}`);

    return new Response(JSON.stringify({
      success: true,
      whatsapp_sent: whatsappSent,
      business: business.business_name,
      fund: fundTitle,
      friends_notified: {
        whatsapp_sent: friendWaSent,
        whatsapp_failed: friendWaFailed,
        unique_phones: sentPhones.size,
        users_notified: allNotifiedUserIds.size
      }
    }), { headers: corsHeaders });

  } catch (error) {
    console.error('❌ [notify-fund-ready] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
});
