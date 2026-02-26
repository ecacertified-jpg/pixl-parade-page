import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendWhatsAppTemplate } from "../_shared/sms-sender.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotifyRequest {
  fund_id: string;
  beneficiary_user_id: string;
  business_name: string;
  product_name: string;
  target_amount: number;
  currency: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { 
      fund_id, 
      beneficiary_user_id, 
      business_name, 
      product_name, 
      target_amount, 
      currency 
    }: NotifyRequest = await req.json();

    console.log('📧 Notifying friends for business fund:', { fund_id, beneficiary_user_id, business_name });

    // Get beneficiary profile
    const { data: beneficiaryProfile, error: profileError } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('user_id', beneficiary_user_id)
      .single();

    if (profileError) {
      console.error('Error fetching beneficiary profile:', profileError);
    }

    const beneficiaryName = beneficiaryProfile 
      ? `${beneficiaryProfile.first_name || ''} ${beneficiaryProfile.last_name || ''}`.trim() || 'un ami'
      : 'un ami';

    // Get all friends of the beneficiary
    const { data: friendships, error: friendshipError } = await supabase
      .from('contact_relationships')
      .select('user_a, user_b, can_see_funds')
      .or(`user_a.eq.${beneficiary_user_id},user_b.eq.${beneficiary_user_id}`)
      .eq('can_see_funds', true);

    if (friendshipError) {
      console.error('Error fetching friendships:', friendshipError);
      throw friendshipError;
    }

    console.log(`Found ${friendships?.length || 0} friends with can_see_funds=true`);

    if (!friendships || friendships.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No friends to notify',
          notified_count: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract friend IDs
    const friendIds = friendships.map(f => 
      f.user_a === beneficiary_user_id ? f.user_b : f.user_a
    );

    console.log('Friend IDs to notify:', friendIds);

    // Create notifications for each friend
    const notifications = friendIds.map(friendId => ({
      user_id: friendId,
      notification_type: 'business_fund_invitation',
      title: `🎁 Cotisation pour ${beneficiaryName}`,
      message: `${business_name} a créé une cotisation pour offrir "${product_name}" à ${beneficiaryName}. Objectif: ${target_amount.toLocaleString()} ${currency}. Participez !`,
      scheduled_for: new Date().toISOString(),
      delivery_methods: ['push', 'in_app'],
      metadata: {
        fund_id,
        beneficiary_user_id,
        beneficiary_name: beneficiaryName,
        business_name,
        product_name,
        target_amount,
        currency,
        action_url: `/dashboard?fund=${fund_id}`
      }
    }));

    // Insert notifications
    const { data: insertedNotifications, error: insertError } = await supabase
      .from('scheduled_notifications')
      .insert(notifications)
      .select('id');

    if (insertError) {
      console.error('Error inserting notifications:', insertError);
      throw insertError;
    }

    console.log(`✅ Created ${insertedNotifications?.length || 0} notifications`);

    // Also create in-app notifications
    const inAppNotifications = friendIds.map(friendId => ({
      user_id: friendId,
      type: 'fund_invitation',
      title: `Cotisation pour ${beneficiaryName}`,
      message: `${business_name} invite à contribuer pour offrir "${product_name}" à ${beneficiaryName}`,
      data: {
        fund_id,
        beneficiary_user_id,
        business_name,
        product_name
      }
    }));

    const { error: inAppError } = await supabase
      .from('notifications')
      .insert(inAppNotifications);

    if (inAppError) {
      console.warn('Warning: Failed to create in-app notifications:', inAppError);
    }

    // Send WhatsApp template to friends with phone numbers
    const { data: friendProfiles } = await supabase
      .from('profiles')
      .select('user_id, first_name, phone')
      .in('user_id', friendIds);

    const formattedTarget = target_amount?.toLocaleString('fr-FR') || '0';
    let whatsappSentCount = 0;

    for (const friend of (friendProfiles || [])) {
      if (!friend.phone) continue;
      try {
        const result = await sendWhatsAppTemplate(
          friend.phone,
          'joiedevivre_group_contribution',
          'fr',
          [friend.first_name || 'Ami(e)', beneficiaryName, formattedTarget, product_name],
          [fund_id]
        );
        if (result.success) whatsappSentCount++;
      } catch (e) {
        console.error(`WhatsApp error for ${friend.user_id}:`, e);
      }
    }

    console.log(`📱 WhatsApp sent: ${whatsappSentCount}/${friendProfiles?.length || 0}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Notified ${friendIds.length} friends`,
        notified_count: friendIds.length,
        whatsapp_sent: whatsappSentCount
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in notify-business-fund-friends:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
