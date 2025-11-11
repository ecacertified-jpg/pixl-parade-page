import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReciprocityCandidate {
  user_id: string;
  generosity_score: number;
  total_contributions_count: number;
  last_contribution_date: string | null;
  has_contributed_back: boolean;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    console.log('Starting reciprocity-based notifications check...');

    // Récupérer les cagnottes créées dans les dernières 24 heures
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: recentFunds, error: fundsError } = await supabaseClient
      .from('collective_funds')
      .select(`
        id,
        title,
        creator_id,
        target_amount,
        current_amount,
        currency,
        occasion,
        created_at,
        beneficiary_contact_id,
        profiles!collective_funds_creator_id_fkey(first_name, last_name)
      `)
      .eq('status', 'active')
      .gte('created_at', twentyFourHoursAgo)
      .order('created_at', { ascending: false });

    if (fundsError) {
      console.error('Error fetching recent funds:', fundsError);
      throw fundsError;
    }

    console.log(`Found ${recentFunds?.length || 0} recent funds`);

    let totalNotificationsSent = 0;
    let totalCandidatesFound = 0;

    // Pour chaque cagnotte récente
    for (const fund of recentFunds || []) {
      console.log(`Processing fund: ${fund.id} - ${fund.title}`);

      // Vérifier si des notifications ont déjà été envoyées pour cette cagnotte
      const { data: existingNotifications } = await supabaseClient
        .from('scheduled_notifications')
        .select('id')
        .eq('fund_id', fund.id)
        .eq('notification_type', 'reciprocity_opportunity')
        .limit(1);

      if (existingNotifications && existingNotifications.length > 0) {
        console.log(`Notifications already sent for fund ${fund.id}, skipping`);
        continue;
      }

      // Trouver les utilisateurs avec un fort score de réciprocité avec le créateur
      const { data: reciprocityCandidates, error: candidatesError } = await supabaseClient
        .from('reciprocity_tracking')
        .select(`
          donor_id,
          contribution_amount,
          created_at
        `)
        .eq('beneficiary_id', fund.creator_id)
        .order('created_at', { ascending: false });

      if (candidatesError) {
        console.error('Error fetching reciprocity candidates:', candidatesError);
        continue;
      }

      // Grouper par donor_id et calculer les scores
      const candidatesMap = new Map<string, {
        total_amount: number;
        count: number;
        last_date: string;
      }>();

      reciprocityCandidates?.forEach((item) => {
        if (!candidatesMap.has(item.donor_id)) {
          candidatesMap.set(item.donor_id, {
            total_amount: 0,
            count: 0,
            last_date: item.created_at,
          });
        }
        const candidate = candidatesMap.get(item.donor_id)!;
        candidate.total_amount += Number(item.contribution_amount);
        candidate.count++;
        if (item.created_at > candidate.last_date) {
          candidate.last_date = item.created_at;
        }
      });

      // Récupérer les scores de réciprocité pour ces utilisateurs
      const donorIds = Array.from(candidatesMap.keys());
      
      if (donorIds.length === 0) {
        console.log(`No reciprocity candidates found for fund ${fund.id}`);
        continue;
      }

      const { data: reciprocityScores } = await supabaseClient
        .from('reciprocity_scores')
        .select('user_id, generosity_score, badge_level')
        .in('user_id', donorIds);

      // Récupérer les préférences de notification des utilisateurs
      const { data: userPreferences } = await supabaseClient
        .from('user_reciprocity_preferences')
        .select('user_id, notify_on_friend_fund, min_reciprocity_score')
        .in('user_id', donorIds);

      const preferencesMap = new Map(
        userPreferences?.map((p) => [p.user_id, p]) || []
      );

      // Filtrer et prioriser les candidats
      const priorityCandidates: Array<{
        user_id: string;
        score: number;
        badge: string;
      }> = [];

      for (const [userId, data] of candidatesMap.entries()) {
        const preferences = preferencesMap.get(userId);
        const scoreData = reciprocityScores?.find((s) => s.user_id === userId);

        // Respecter les préférences de l'utilisateur
        if (preferences && !preferences.notify_on_friend_fund) {
          console.log(`User ${userId} has disabled friend fund notifications`);
          continue;
        }

        const generosityScore = scoreData?.generosity_score || 0;
        const minScore = preferences?.min_reciprocity_score || 30;

        // Vérifier si le score est suffisant
        if (generosityScore < minScore) {
          console.log(`User ${userId} score ${generosityScore} below threshold ${minScore}`);
          continue;
        }

        // Vérifier si l'utilisateur n'a pas déjà contribué
        const { data: hasContributed } = await supabaseClient
          .from('fund_contributions')
          .select('id')
          .eq('fund_id', fund.id)
          .eq('contributor_id', userId)
          .limit(1);

        if (hasContributed && hasContributed.length > 0) {
          console.log(`User ${userId} already contributed to fund ${fund.id}`);
          continue;
        }

        priorityCandidates.push({
          user_id: userId,
          score: generosityScore,
          badge: scoreData?.badge_level || 'newcomer',
        });
      }

      // Trier par score de générosité décroissant
      priorityCandidates.sort((a, b) => b.score - a.score);

      // Limiter à 20 notifications par cagnotte pour éviter le spam
      const topCandidates = priorityCandidates.slice(0, 20);
      totalCandidatesFound += topCandidates.length;

      console.log(`Found ${topCandidates.length} priority candidates for fund ${fund.id}`);

      // Créer les notifications
      const creatorName = fund.profiles
        ? `${fund.profiles.first_name || ''} ${fund.profiles.last_name || ''}`.trim()
        : 'Un ami';

      const occasionEmoji = {
        birthday: '🎂',
        wedding: '💍',
        academic: '🎓',
        promotion: '🎉',
        other: '🎁',
      }[fund.occasion || 'other'] || '🎁';

      for (const candidate of topCandidates) {
        // Calculer le montant suggéré basé sur l'historique
        const history = candidatesMap.get(candidate.user_id)!;
        const suggestedAmount = Math.round(history.total_amount / history.count);

        const notificationData = {
          user_id: candidate.user_id,
          notification_type: 'reciprocity_opportunity',
          title: `${occasionEmoji} ${creatorName} a besoin de votre aide`,
          message: `${creatorName} a créé une cagnotte "${fund.title}". Vous avez un score de réciprocité de ${candidate.score.toFixed(0)} avec cette personne.`,
          data: {
            fund_id: fund.id,
            fund_title: fund.title,
            creator_id: fund.creator_id,
            creator_name: creatorName,
            target_amount: fund.target_amount,
            current_amount: fund.current_amount,
            currency: fund.currency,
            occasion: fund.occasion,
            reciprocity_score: candidate.score,
            badge_level: candidate.badge,
            suggested_amount: suggestedAmount,
            history_contributions: history.count,
            last_contribution_date: history.last_date,
          },
          scheduled_for: new Date().toISOString(),
          fund_id: fund.id,
          priority: candidate.score >= 80 ? 'high' : candidate.score >= 60 ? 'medium' : 'normal',
        };

        const { error: notificationError } = await supabaseClient
          .from('scheduled_notifications')
          .insert(notificationData);

        if (notificationError) {
          console.error('Error creating notification:', notificationError);
        } else {
          totalNotificationsSent++;
          console.log(`Notification created for user ${candidate.user_id}`);

          // Envoyer la notification push immédiatement si l'utilisateur a activé les push
          try {
            await supabaseClient.functions.invoke('send-push-notification', {
              body: {
                userId: candidate.user_id,
                title: notificationData.title,
                body: notificationData.message,
                data: notificationData.data,
              },
            });
          } catch (pushError) {
            console.error('Error sending push notification:', pushError);
            // Continue même si le push échoue
          }
        }
      }
    }

    console.log(`Reciprocity notifications job completed:
      - Recent funds processed: ${recentFunds?.length || 0}
      - Total candidates found: ${totalCandidatesFound}
      - Total notifications sent: ${totalNotificationsSent}
    `);

    return new Response(
      JSON.stringify({
        success: true,
        fundsProcessed: recentFunds?.length || 0,
        candidatesFound: totalCandidatesFound,
        notificationsSent: totalNotificationsSent,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in notify-reciprocity-opportunities:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
