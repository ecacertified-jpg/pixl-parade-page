import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BadgeCheck {
  badgeKey: string;
  requirementType: 'count' | 'amount' | 'milestone';
  threshold: number;
  query: (supabase: any, userId: string) => Promise<number>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`Checking badges for user: ${userId}`);

    const newBadges: string[] = [];

    // Define all badge checks
    const badgeChecks: BadgeCheck[] = [
      // Generous Donor badges (contribution count)
      {
        badgeKey: 'generous_donor_1',
        requirementType: 'count',
        threshold: 5,
        query: async (supabase, userId) => {
          const { count } = await supabase
            .from('fund_contributions')
            .select('*', { count: 'exact', head: true })
            .eq('contributor_id', userId);
          return count || 0;
        }
      },
      {
        badgeKey: 'generous_donor_2',
        requirementType: 'count',
        threshold: 10,
        query: async (supabase, userId) => {
          const { count } = await supabase
            .from('fund_contributions')
            .select('*', { count: 'exact', head: true })
            .eq('contributor_id', userId);
          return count || 0;
        }
      },
      {
        badgeKey: 'generous_donor_3',
        requirementType: 'count',
        threshold: 25,
        query: async (supabase, userId) => {
          const { count } = await supabase
            .from('fund_contributions')
            .select('*', { count: 'exact', head: true })
            .eq('contributor_id', userId);
          return count || 0;
        }
      },
      {
        badgeKey: 'generous_donor_4',
        requirementType: 'count',
        threshold: 50,
        query: async (supabase, userId) => {
          const { count } = await supabase
            .from('fund_contributions')
            .select('*', { count: 'exact', head: true })
            .eq('contributor_id', userId);
          return count || 0;
        }
      },
      {
        badgeKey: 'generous_donor_5',
        requirementType: 'count',
        threshold: 100,
        query: async (supabase, userId) => {
          const { count } = await supabase
            .from('fund_contributions')
            .select('*', { count: 'exact', head: true })
            .eq('contributor_id', userId);
          return count || 0;
        }
      },
      
      // Big Spender badges (total amount donated)
      {
        badgeKey: 'big_spender_1',
        requirementType: 'amount',
        threshold: 50000,
        query: async (supabase, userId) => {
          const { data } = await supabase
            .from('fund_contributions')
            .select('amount')
            .eq('contributor_id', userId);
          return data?.reduce((sum, c) => sum + Number(c.amount), 0) || 0;
        }
      },
      {
        badgeKey: 'big_spender_2',
        requirementType: 'amount',
        threshold: 100000,
        query: async (supabase, userId) => {
          const { data } = await supabase
            .from('fund_contributions')
            .select('amount')
            .eq('contributor_id', userId);
          return data?.reduce((sum, c) => sum + Number(c.amount), 0) || 0;
        }
      },
      {
        badgeKey: 'big_spender_3',
        requirementType: 'amount',
        threshold: 250000,
        query: async (supabase, userId) => {
          const { data } = await supabase
            .from('fund_contributions')
            .select('amount')
            .eq('contributor_id', userId);
          return data?.reduce((sum, c) => sum + Number(c.amount), 0) || 0;
        }
      },
      {
        badgeKey: 'big_spender_4',
        requirementType: 'amount',
        threshold: 500000,
        query: async (supabase, userId) => {
          const { data } = await supabase
            .from('fund_contributions')
            .select('amount')
            .eq('contributor_id', userId);
          return data?.reduce((sum, c) => sum + Number(c.amount), 0) || 0;
        }
      },
      {
        badgeKey: 'big_spender_5',
        requirementType: 'amount',
        threshold: 1000000,
        query: async (supabase, userId) => {
          const { data } = await supabase
            .from('fund_contributions')
            .select('amount')
            .eq('contributor_id', userId);
          return data?.reduce((sum, c) => sum + Number(c.amount), 0) || 0;
        }
      },

      // Fund Creator badges
      {
        badgeKey: 'fund_creator_1',
        requirementType: 'count',
        threshold: 3,
        query: async (supabase, userId) => {
          const { count } = await supabase
            .from('collective_funds')
            .select('*', { count: 'exact', head: true })
            .eq('creator_id', userId);
          return count || 0;
        }
      },
      {
        badgeKey: 'fund_creator_2',
        requirementType: 'count',
        threshold: 10,
        query: async (supabase, userId) => {
          const { count } = await supabase
            .from('collective_funds')
            .select('*', { count: 'exact', head: true })
            .eq('creator_id', userId);
          return count || 0;
        }
      },
      {
        badgeKey: 'fund_creator_3',
        requirementType: 'count',
        threshold: 25,
        query: async (supabase, userId) => {
          const { count } = await supabase
            .from('collective_funds')
            .select('*', { count: 'exact', head: true })
            .eq('creator_id', userId);
          return count || 0;
        }
      },
      {
        badgeKey: 'fund_creator_4',
        requirementType: 'count',
        threshold: 50,
        query: async (supabase, userId) => {
          const { count } = await supabase
            .from('collective_funds')
            .select('*', { count: 'exact', head: true })
            .eq('creator_id', userId);
          return count || 0;
        }
      },
      {
        badgeKey: 'fund_creator_5',
        requirementType: 'count',
        threshold: 100,
        query: async (supabase, userId) => {
          const { count } = await supabase
            .from('collective_funds')
            .select('*', { count: 'exact', head: true })
            .eq('creator_id', userId);
          return count || 0;
        }
      },

      // Successful Funds badges (funds that reached target)
      {
        badgeKey: 'successful_funds_1',
        requirementType: 'count',
        threshold: 3,
        query: async (supabase, userId) => {
          const { count } = await supabase
            .from('collective_funds')
            .select('*', { count: 'exact', head: true })
            .eq('creator_id', userId)
            .gte('current_amount', supabase.rpc('target_amount'));
          return count || 0;
        }
      },
      {
        badgeKey: 'successful_funds_2',
        requirementType: 'count',
        threshold: 10,
        query: async (supabase, userId) => {
          const { data } = await supabase
            .from('collective_funds')
            .select('current_amount, target_amount')
            .eq('creator_id', userId);
          return data?.filter(f => Number(f.current_amount) >= Number(f.target_amount)).length || 0;
        }
      },
      {
        badgeKey: 'successful_funds_3',
        requirementType: 'count',
        threshold: 25,
        query: async (supabase, userId) => {
          const { data } = await supabase
            .from('collective_funds')
            .select('current_amount, target_amount')
            .eq('creator_id', userId);
          return data?.filter(f => Number(f.current_amount) >= Number(f.target_amount)).length || 0;
        }
      },
      {
        badgeKey: 'successful_funds_4',
        requirementType: 'count',
        threshold: 50,
        query: async (supabase, userId) => {
          const { data } = await supabase
            .from('collective_funds')
            .select('current_amount, target_amount')
            .eq('creator_id', userId);
          return data?.filter(f => Number(f.current_amount) >= Number(f.target_amount)).length || 0;
        }
      },
      {
        badgeKey: 'successful_funds_5',
        requirementType: 'count',
        threshold: 100,
        query: async (supabase, userId) => {
          const { data } = await supabase
            .from('collective_funds')
            .select('current_amount, target_amount')
            .eq('creator_id', userId);
          return data?.filter(f => Number(f.current_amount) >= Number(f.target_amount)).length || 0;
        }
      },

      // Community badges (friends count)
      {
        badgeKey: 'social_butterfly',
        requirementType: 'count',
        threshold: 10,
        query: async (supabase, userId) => {
          const { count } = await supabase
            .from('contacts')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);
          return count || 0;
        }
      },
      {
        badgeKey: 'network_builder',
        requirementType: 'count',
        threshold: 25,
        query: async (supabase, userId) => {
          const { count } = await supabase
            .from('contacts')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);
          return count || 0;
        }
      },
      {
        badgeKey: 'community_leader',
        requirementType: 'count',
        threshold: 50,
        query: async (supabase, userId) => {
          const { count } = await supabase
            .from('contacts')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);
          return count || 0;
        }
      },
      {
        badgeKey: 'super_connector',
        requirementType: 'count',
        threshold: 100,
        query: async (supabase, userId) => {
          const { count } = await supabase
            .from('contacts')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);
          return count || 0;
        }
      },
      {
        badgeKey: 'legend_connector',
        requirementType: 'count',
        threshold: 250,
        query: async (supabase, userId) => {
          const { count } = await supabase
            .from('contacts')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);
          return count || 0;
        }
      },

      // Gratitude Master badge
      {
        badgeKey: 'gratitude_master',
        requirementType: 'count',
        threshold: 25,
        query: async (supabase, userId) => {
          const { count } = await supabase
            .from('gift_thanks')
            .select('*', { count: 'exact', head: true })
            .eq('sender_id', userId);
          return count || 0;
        }
      },

      // Party Planner badge
      {
        badgeKey: 'party_planner',
        requirementType: 'count',
        threshold: 10,
        query: async (supabase, userId) => {
          const { count } = await supabase
            .from('collective_funds')
            .select('*', { count: 'exact', head: true })
            .eq('creator_id', userId)
            .eq('is_surprise', true);
          return count || 0;
        }
      }
    ];

    // Check each badge
    for (const check of badgeChecks) {
      try {
        // Check if user already has this badge
        const { data: existingBadge } = await supabase
          .from('user_badges')
          .select('id')
          .eq('user_id', userId)
          .eq('badge_key', check.badgeKey)
          .single();

        if (existingBadge) {
          console.log(`User already has badge: ${check.badgeKey}`);
          continue;
        }

        // Get current value for this metric
        const currentValue = await check.query(supabase, userId);
        console.log(`${check.badgeKey}: ${currentValue}/${check.threshold}`);

        // Award badge if threshold is met
        if (currentValue >= check.threshold) {
          const { error: insertError } = await supabase
            .from('user_badges')
            .insert({
              user_id: userId,
              badge_key: check.badgeKey,
              progress_value: currentValue,
              metadata: {
                awarded_at: new Date().toISOString(),
                current_value: currentValue,
                threshold: check.threshold
              }
            });

          if (insertError && insertError.code !== '23505') { // Ignore duplicate errors
            console.error(`Error awarding badge ${check.badgeKey}:`, insertError);
          } else {
            newBadges.push(check.badgeKey);
            console.log(`✨ Badge awarded: ${check.badgeKey}`);

            // Create notification for new badge
            const { data: badgeDef } = await supabase
              .from('badge_definitions')
              .select('name, icon, description')
              .eq('badge_key', check.badgeKey)
              .single();

            if (badgeDef) {
              await supabase
                .from('scheduled_notifications')
                .insert({
                  user_id: userId,
                  notification_type: 'badge_earned',
                  title: `${badgeDef.icon} Nouveau Badge Débloqué !`,
                  message: `Félicitations ! Vous avez obtenu le badge "${badgeDef.name}" : ${badgeDef.description}`,
                  priority_score: 80,
                  scheduled_for: new Date().toISOString(),
                  metadata: {
                    badge_key: check.badgeKey,
                    badge_name: badgeDef.name,
                    badge_icon: badgeDef.icon
                  }
                });
            }
          }
        }
      } catch (badgeError) {
        console.error(`Error checking badge ${check.badgeKey}:`, badgeError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        userId,
        newBadgesAwarded: newBadges.length,
        badges: newBadges
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Award badges error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
