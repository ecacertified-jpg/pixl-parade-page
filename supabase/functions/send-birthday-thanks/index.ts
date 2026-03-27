import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { sendPushNotification } from "../_shared/web-push.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { customMessage } = await req.json().catch(() => ({}));
    const birthdayUserId = user.id;
    const currentYear = new Date().getFullYear();

    console.log(`[send-birthday-thanks] Processing thanks for user ${birthdayUserId}, year ${currentYear}`);

    // Get birthday user's name
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('user_id', birthdayUserId)
      .single();
    
    const birthdayName = profile?.first_name || 'Un ami';

    // 1. Get all message senders (not yet thanked)
    const { data: messages } = await supabase
      .from('birthday_wishes_messages')
      .select('id, sender_id, sender_name')
      .eq('birthday_user_id', birthdayUserId)
      .eq('celebration_year', currentYear)
      .eq('thanks_sent', false);

    // 2. Get all fund contributors for this user's birthday funds
    const { data: funds } = await supabase
      .from('collective_funds')
      .select('id')
      .eq('beneficiary_contact_id', birthdayUserId)
      .eq('occasion', 'birthday');

    let contributorIds: string[] = [];
    if (funds && funds.length > 0) {
      const fundIds = funds.map(f => f.id);
      const { data: contributions } = await supabase
        .from('fund_contributions')
        .select('contributor_id')
        .in('fund_id', fundIds);
      
      contributorIds = [...new Set((contributions || []).map(c => c.contributor_id).filter(Boolean))];
    }

    // Combine unique recipient IDs (message senders + contributors)
    const allRecipientIds = new Set<string>();
    const messageSenderIds: string[] = [];

    for (const msg of messages || []) {
      if (msg.sender_id && msg.sender_id !== birthdayUserId) {
        allRecipientIds.add(msg.sender_id);
        messageSenderIds.push(msg.sender_id);
      }
    }
    for (const cId of contributorIds) {
      if (cId !== birthdayUserId) {
        allRecipientIds.add(cId);
      }
    }

    console.log(`[send-birthday-thanks] ${allRecipientIds.size} unique recipients to thank`);

    let sentCount = 0;

    for (const recipientId of allRecipientIds) {
      try {
        const isMessager = messageSenderIds.includes(recipientId);
        const isContributor = contributorIds.includes(recipientId);

        let thankMessage: string;
        if (customMessage) {
          thankMessage = customMessage;
        } else if (isMessager && isContributor) {
          thankMessage = `${birthdayName} te remercie chaleureusement pour ton message et ta contribution à sa cagnotte d'anniversaire ! 💖🎁`;
        } else if (isContributor) {
          thankMessage = `${birthdayName} te remercie pour ta généreuse contribution à sa cagnotte d'anniversaire ! 🎁✨`;
        } else {
          thankMessage = `${birthdayName} te remercie pour ton beau message d'anniversaire ! 💖🎂`;
        }

        // Insert in-app notification
        await supabase.from('scheduled_notifications').insert({
          user_id: recipientId,
          notification_type: 'birthday_thanks',
          title: `🙏 Remerciement de ${birthdayName}`,
          message: thankMessage,
          priority_score: 80,
          scheduled_for: new Date().toISOString(),
          metadata: {
            from_user_id: birthdayUserId,
            type: 'birthday_thanks',
            is_custom: !!customMessage
          }
        });

        // Push notification
        const { data: pushSubs } = await supabase
          .from('push_subscriptions')
          .select('*')
          .eq('user_id', recipientId);

        for (const sub of pushSubs || []) {
          try {
            await sendPushNotification(
              {
                endpoint: sub.endpoint,
                keys: { p256dh: sub.p256dh, auth: sub.auth }
              },
              JSON.stringify({
                title: `🙏 Remerciement de ${birthdayName}`,
                body: thankMessage,
                icon: '/icons/icon-192x192.png',
                tag: `birthday-thanks-${birthdayUserId}-${currentYear}`
              })
            );
          } catch (pushErr) {
            console.warn(`Push failed for subscription ${sub.id}:`, pushErr);
          }
        }

        sentCount++;
      } catch (err) {
        console.error(`Error thanking recipient ${recipientId}:`, err);
      }
    }

    // Mark messages as thanked
    if (messages && messages.length > 0) {
      const messageIds = messages.map(m => m.id);
      await supabase
        .from('birthday_wishes_messages')
        .update({ thanks_sent: true })
        .in('id', messageIds);
    }

    // If custom message, also add to gratitude wall
    if (customMessage) {
      for (const recipientId of allRecipientIds) {
        await supabase.from('gratitude_wall').insert({
          contributor_id: birthdayUserId,
          beneficiary_id: recipientId,
          message_type: 'personal',
          message_text: customMessage,
          is_public: false,
        }).catch(() => {}); // Ignore errors
      }
    }

    console.log(`[send-birthday-thanks] Sent ${sentCount} thank you notifications`);

    return new Response(
      JSON.stringify({ success: true, sentCount }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('send-birthday-thanks error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
