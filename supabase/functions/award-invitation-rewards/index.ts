import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Badge thresholds for referral program
const REFERRAL_BADGES = [
  { key: 'ambassador_bronze', name: 'Ambassadeur Bronze', threshold: 5 },
  { key: 'ambassador_silver', name: 'Ambassadeur Argent', threshold: 10 },
  { key: 'ambassador_gold', name: 'Ambassadeur Or', threshold: 20 },
  { key: 'ambassador_platinum', name: 'Ambassadeur Platine', threshold: 50 },
  { key: 'ambassador_legend', name: 'Légende', threshold: 100 },
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { invitation_id, inviter_id } = await req.json();

    if (!invitation_id || !inviter_id) {
      throw new Error('Missing required parameters');
    }

    console.log(`Processing rewards for invitation ${invitation_id} by user ${inviter_id}`);

    // 1. Award 50 points for accepted invitation
    const { error: pointsError } = await supabase
      .from('invitation_rewards')
      .insert({
        user_id: inviter_id,
        invitation_id: invitation_id,
        reward_type: 'points',
        reward_value: { points: 50 },
        claimed: false,
      });

    if (pointsError) {
      console.error('Error awarding points:', pointsError);
      throw pointsError;
    }

    console.log('Points reward created successfully');

    // 2. Check total accepted invitations for badge unlock
    const { data: acceptedInvitations, error: countError } = await supabase
      .from('invitations')
      .select('id', { count: 'exact' })
      .eq('inviter_id', inviter_id)
      .eq('status', 'accepted');

    if (countError) {
      console.error('Error counting invitations:', countError);
      throw countError;
    }

    const acceptedCount = acceptedInvitations?.length || 0;
    console.log(`User has ${acceptedCount} accepted invitations`);

    // 3. Check if user unlocked a new badge
    for (const badge of REFERRAL_BADGES) {
      if (acceptedCount === badge.threshold) {
        console.log(`User reached threshold for ${badge.key}`);

        // Check if badge already awarded
        const { data: existingBadge } = await supabase
          .from('user_badges')
          .select('id')
          .eq('user_id', inviter_id)
          .eq('badge_key', badge.key)
          .maybeSingle();

        if (!existingBadge) {
          // Award badge
          const { error: badgeRewardError } = await supabase
            .from('invitation_rewards')
            .insert({
              user_id: inviter_id,
              invitation_id: invitation_id,
              reward_type: 'badge',
              reward_value: { 
                badge_key: badge.key,
                badge_name: badge.name 
              },
              claimed: false,
            });

          if (badgeRewardError) {
            console.error('Error creating badge reward:', badgeRewardError);
          } else {
            console.log(`Badge reward ${badge.key} created successfully`);

            // Actually award the badge to user_badges
            const { error: userBadgeError } = await supabase
              .from('user_badges')
              .insert({
                user_id: inviter_id,
                badge_key: badge.key,
                earned_at: new Date().toISOString(),
              });

            if (userBadgeError) {
              console.error('Error awarding user badge:', userBadgeError);
            }

            // Send badge unlock notification
            await supabase.from('scheduled_notifications').insert({
              user_id: inviter_id,
              notification_type: 'badge_unlocked',
              title: `🏆 Nouveau badge débloqué !`,
              message: `Félicitations ! Vous avez débloqué le badge "${badge.name}"`,
              scheduled_for: new Date().toISOString(),
              delivery_methods: ['push', 'in_app'],
              metadata: {
                badge_key: badge.key,
                badge_name: badge.name,
              },
            });
          }
        }
        break;
      }
    }

    // 4. Send notification for points
    await supabase.from('scheduled_notifications').insert({
      user_id: inviter_id,
      notification_type: 'referral_reward',
      title: '🎉 Invitation acceptée !',
      message: 'Votre ami a accepté votre invitation. +50 points à réclamer !',
      scheduled_for: new Date().toISOString(),
      delivery_methods: ['push', 'in_app'],
      metadata: {
        invitation_id: invitation_id,
        points: 50,
      },
    });

    console.log('Rewards processing completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        accepted_count: acceptedCount,
        message: 'Rewards awarded successfully' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error in award-invitation-rewards:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
