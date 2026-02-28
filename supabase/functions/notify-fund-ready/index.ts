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
      .select('id, title, current_amount, target_amount, status')
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

    // Send WhatsApp template
    let whatsappSent = false;
    if (business.phone) {
      try {
        const waResult = await sendWhatsAppTemplate(
          business.phone,
          'joiedevivre_fund_ready',
          'fr',
          [ownerFirstName, fundTitle, String(fundAmount), productName, beneficiaryName],
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

    // Create in-app notification (also serves as deduplication marker)
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

    return new Response(JSON.stringify({
      success: true,
      whatsapp_sent: whatsappSent,
      business: business.business_name,
      fund: fundTitle
    }), { headers: corsHeaders });

  } catch (error) {
    console.error('❌ [notify-fund-ready] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
});
