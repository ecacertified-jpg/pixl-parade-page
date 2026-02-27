import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendWhatsAppTemplate, formatPhoneForTwilio } from "../_shared/sms-sender.ts";

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

    // Get all friends of the beneficiary via contact_relationships
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

    // Extract friend IDs and deduplicate
    const friendIds = [...new Set(
      (friendships || []).map(f => 
        f.user_a === beneficiary_user_id ? f.user_b : f.user_a
      )
    )];

    console.log('Friend IDs to notify:', friendIds);

    // Create notifications for each friend (only if there are friends)
    if (friendIds.length > 0) {
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

      const { data: insertedNotifications, error: insertError } = await supabase
        .from('scheduled_notifications')
        .insert(notifications)
        .select('id');

      if (insertError) {
        console.error('Error inserting notifications:', insertError);
        throw insertError;
      }

      console.log(`✅ Created ${insertedNotifications?.length || 0} scheduled notifications`);

      // Also create in-app notifications
      const inAppNotifications = friendIds.map(friendId => ({
        user_id: friendId,
        type: 'fund_invitation',
        title: `Cotisation pour ${beneficiaryName}`,
        message: `${business_name} invite à contribuer pour offrir "${product_name}" à ${beneficiaryName}`,
        metadata: {
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
    }

    // ── BLOCK 1: WhatsApp to friends via contact_relationships ──
    const { data: friendProfiles } = await supabase
      .from('profiles')
      .select('user_id, first_name, phone')
      .in('user_id', friendIds.length > 0 ? friendIds : ['__none__']);

    const formattedTarget = target_amount?.toLocaleString('fr-FR') || '0';
    let whatsappSentCount = 0;
    const notifiedPhones = new Set<string>(); // Track phones already notified for dedup

    for (const friend of (friendProfiles || [])) {
      if (!friend.phone) continue;
      const normalizedPhone = formatPhoneForTwilio(friend.phone);
      try {
        const result = await sendWhatsAppTemplate(
          friend.phone,
          'joiedevivre_group_contribution',
          'fr',
          [friend.first_name || 'Ami(e)', beneficiaryName, formattedTarget, product_name],
          [fund_id]
        );
        if (result.success) {
          whatsappSentCount++;
          notifiedPhones.add(normalizedPhone);
        }
      } catch (e) {
        console.error(`WhatsApp error for ${friend.user_id}:`, e);
      }
      // Even on failure, mark as notified to avoid double-sending
      notifiedPhones.add(normalizedPhone);
    }

    console.log(`📱 WhatsApp (friends): ${whatsappSentCount}/${friendProfiles?.length || 0}`);

    // ── BLOCK 2: WhatsApp to contacts from the contacts table ──
    const { data: addressBookContacts, error: contactsError } = await supabase
      .from('contacts')
      .select('id, name, phone')
      .eq('user_id', beneficiary_user_id)
      .not('phone', 'is', null);

    if (contactsError) {
      console.error('Error fetching contacts:', contactsError);
    }

    let contactsWhatsappSent = 0;
    const contactsWithPhone = (addressBookContacts || []).filter(c => c.phone && c.phone.trim() !== '');

    console.log(`Found ${contactsWithPhone.length} contacts with phone numbers in address book`);

    for (const contact of contactsWithPhone) {
      const normalizedPhone = formatPhoneForTwilio(contact.phone!);
      // Dedup: skip if already notified via contact_relationships
      if (notifiedPhones.has(normalizedPhone)) {
        console.log(`⏭️ Skipping contact "${contact.name}" (already notified via friends)`);
        continue;
      }
      try {
        const firstName = contact.name?.split(' ')[0] || 'Ami(e)';
        const result = await sendWhatsAppTemplate(
          contact.phone!,
          'joiedevivre_group_contribution',
          'fr',
          [firstName, beneficiaryName, formattedTarget, product_name],
          [fund_id]
        );
        if (result.success) contactsWhatsappSent++;
      } catch (e) {
        console.error(`WhatsApp error for contact "${contact.name}":`, e);
      }
      notifiedPhones.add(normalizedPhone);
    }

    console.log(`📱 WhatsApp (contacts): ${contactsWhatsappSent}/${contactsWithPhone.length}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Notified ${friendIds.length} friends + ${contactsWithPhone.length} contacts`,
        notified_count: friendIds.length,
        whatsapp_sent: whatsappSentCount,
        contacts_whatsapp_sent: contactsWhatsappSent
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
