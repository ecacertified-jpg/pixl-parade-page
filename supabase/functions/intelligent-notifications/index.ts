import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendWhatsAppTemplate } from "../_shared/sms-sender.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Verify service role authorization for background tasks
function verifyServiceAuth(req: Request): boolean {
  const authHeader = req.headers.get('authorization');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!authHeader || !serviceKey) {
    return false;
  }
  
  // Check for Bearer token with service role key
  const token = authHeader.replace('Bearer ', '');
  return token === serviceKey;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Verify service role authentication - only allow internal/cron calls
  if (!verifyServiceAuth(req)) {
    console.error('Unauthorized access attempt to intelligent-notifications');
    return new Response(
      JSON.stringify({ error: 'Unauthorized', code: 'AUTH_REQUIRED' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("🔍 Analyzing user patterns for intelligent notifications...");

    // Récupérer tous les utilisateurs actifs
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('user_id')
      .limit(100);

    if (usersError) {
      console.error("Error fetching users:", usersError);
      throw usersError;
    }

    if (!users || users.length === 0) {
      console.log("✅ No users to analyze");
      return new Response(
        JSON.stringify({ message: "No users found", count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📊 Analyzing ${users.length} users...`);

    let notificationsCreated = 0;

    for (const user of users) {
      const userId = user.user_id;

      // 1. ALERTE ÉQUILIBRE - Détecte déséquilibre de réciprocité
      try {
        const { data: imbalances } = await supabase
          .rpc('detect_reciprocity_imbalance', { p_user_id: userId });

        if (imbalances && imbalances.length > 0) {
          for (const imbalance of imbalances.slice(0, 3)) { // Top 3 seulement
            await supabase
              .from('scheduled_notifications')
              .insert({
                user_id: userId,
                notification_type: 'reciprocity_balance_alert',
                smart_notification_category: 'balance_alert',
                title: '💝 Pensez à rendre la pareille',
                message: `${imbalance.friend_name} vous a offert ${imbalance.received_count} cadeau${imbalance.received_count > 1 ? 'x' : ''}. Voir les occasions à venir pour lui ?`,
                scheduled_for: new Date().toISOString(),
                delivery_methods: ['in_app', 'push'],
                priority_score: Math.min(100, imbalance.imbalance_score),
                action_data: {
                  friend_id: imbalance.friend_id,
                  friend_name: imbalance.friend_name,
                  received_count: imbalance.received_count,
                  action_type: 'view_friend_occasions'
                }
              });
            notificationsCreated++;
          }
        }
      } catch (error) {
        console.error(`Error detecting imbalance for user ${userId}:`, error);
      }

      // 2. RAPPEL DOUCEUR - Anniversaires imminents sans cagnotte
      try {
        const { data: birthdays } = await supabase
          .rpc('detect_upcoming_birthdays_without_fund', { p_user_id: userId });

        if (birthdays && birthdays.length > 0) {
          for (const birthday of birthdays) {
            const contributorsText = birthday.existing_contributors > 0
              ? `${birthday.existing_contributors} ami${birthday.existing_contributors > 1 ? 's' : ''} ${birthday.existing_contributors > 1 ? 'ont' : 'a'} déjà contribué. `
              : '';

            await supabase
              .from('scheduled_notifications')
              .insert({
                user_id: userId,
                notification_type: 'upcoming_birthday_reminder',
                smart_notification_category: 'gentle_reminder',
                title: `🎂 Anniversaire de ${birthday.contact_name} dans ${birthday.days_until} jours`,
                message: `${contributorsText}Créer une cagnotte surprise ?`,
                scheduled_for: new Date().toISOString(),
                delivery_methods: ['in_app', 'push', 'email'],
                priority_score: 90 - (birthday.days_until * 5), // Plus proche = plus prioritaire
                action_data: {
                  contact_id: birthday.contact_id,
                  contact_name: birthday.contact_name,
                  birthday: birthday.birthday,
                  days_until: birthday.days_until,
                  existing_contributors: birthday.existing_contributors,
                  action_type: 'create_fund'
                }
              });
            notificationsCreated++;
          }
        }
      } catch (error) {
        console.error(`Error detecting birthdays for user ${userId}:`, error);
      }
    }

    // 3. EFFET DOMINO - Analyser les contributions récentes (dernières 24h)
    try {
      const { data: recentContributions } = await supabase
        .from('fund_contributions')
        .select('id, fund_id, contributor_id, created_at')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (recentContributions) {
        for (const contribution of recentContributions) {
          const { data: domino } = await supabase
            .rpc('detect_domino_effect', {
              p_fund_id: contribution.fund_id,
              p_contributor_id: contribution.contributor_id
            })
            .single();

          if (domino && domino.triggered_contributions >= 2) {
            await supabase
              .from('scheduled_notifications')
              .insert({
                user_id: contribution.contributor_id,
                notification_type: 'domino_effect',
                smart_notification_category: 'domino_effect',
                title: '🎉 Votre geste a inspiré d\'autres !',
                message: `Ton geste a inspiré ${domino.triggered_contributions} personne${domino.triggered_contributions > 1 ? 's' : ''} à contribuer pour un total de ${domino.total_amount_triggered} XOF !`,
                scheduled_for: new Date().toISOString(),
                delivery_methods: ['in_app', 'push'],
                priority_score: 85,
                action_data: {
                  fund_id: contribution.fund_id,
                  triggered_contributions: domino.triggered_contributions,
                  total_amount: domino.total_amount_triggered,
                  action_type: 'view_fund'
                }
              });
            notificationsCreated++;
          }
        }
      }
    } catch (error) {
      console.error("Error detecting domino effects:", error);
    }

    // 4. CÉLÉBRATION COLLECTIVE - Fonds qui viennent d'atteindre 100%
    try {
      const { data: completedFunds } = await supabase
        .from('collective_funds')
        .select('id, creator_id, title, current_amount, target_amount')
        .eq('status', 'target_reached')
        .gte('updated_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()); // Dernière heure

      if (completedFunds) {
        for (const fund of completedFunds) {
          // Récupérer tous les contributeurs
          const { data: contributors } = await supabase
            .from('fund_contributions')
            .select('contributor_id')
            .eq('fund_id', fund.id);

          if (contributors) {
            // Notifier tous les contributeurs
            for (const contributor of contributors) {
              await supabase
                .from('scheduled_notifications')
                .insert({
                  user_id: contributor.contributor_id,
                  notification_type: 'fund_completed_celebration',
                  smart_notification_category: 'collective_celebration',
                  title: '🎉 Objectif atteint !',
                  message: `La cagnotte "${fund.title}" a atteint 100% grâce à vous et ${contributors.length - 1} autre${contributors.length > 2 ? 's' : ''} généreux contributeur${contributors.length > 2 ? 's' : ''} !`,
                  scheduled_for: new Date().toISOString(),
                  delivery_methods: ['in_app', 'push'],
                  priority_score: 95,
                  action_data: {
                    fund_id: fund.id,
                    fund_title: fund.title,
                    contributors_count: contributors.length,
                    action_type: 'view_fund'
                  }
                });
              notificationsCreated++;
            }
          }
        }
      }
    } catch (error) {
      console.error("Error detecting completed funds:", error);
    }

    // 5. NOTIFICATION PRESTATAIRE - Cagnotte business à 100%
    try {
      // Re-query completed funds from last hour (independent of section 4 scope)
      const { data: recentCompletedFunds } = await supabase
        .from('collective_funds')
        .select('id, title, current_amount, target_amount')
        .eq('status', 'target_reached')
        .gte('updated_at', new Date(Date.now() - 60 * 60 * 1000).toISOString());

      const completedFundIds = (recentCompletedFunds || []).map(f => f.id);

      if (completedFundIds.length > 0) {
        // Find business funds linked to completed collective funds
        const { data: businessFunds } = await supabase
          .from('business_collective_funds')
          .select('fund_id, business_id, product_id, beneficiary_user_id')
          .in('fund_id', completedFundIds);

        if (businessFunds && businessFunds.length > 0) {
          console.log(`🏢 Found ${businessFunds.length} business funds linked to completed funds`);

          for (const bf of businessFunds) {
            try {
              // Deduplication: check if notification already sent for this fund
              const { data: existingNotif } = await supabase
                .from('scheduled_notifications')
                .select('id')
                .eq('notification_type', 'fund_ready_business')
                .eq('action_data->>fund_id', bf.fund_id)
                .limit(1);

              if (existingNotif && existingNotif.length > 0) {
                console.log(`⏭️ Skipping fund ${bf.fund_id} - notification already sent`);
                continue;
              }

              // Get business account (phone + name)
              const { data: business } = await supabase
                .from('business_accounts')
                .select('user_id, business_name, phone')
                .eq('id', bf.business_id)
                .single();

              if (!business) {
                console.warn(`⚠️ Business not found for ID ${bf.business_id}`);
                continue;
              }

              // Get product name
              const { data: product } = await supabase
                .from('products')
                .select('name')
                .eq('id', bf.product_id)
                .single();

              // Get fund details
              const fundData = (recentCompletedFunds || []).find(f => f.id === bf.fund_id);
              const fundTitle = fundData?.title || 'Cagnotte';
              const fundAmount = fundData?.target_amount || fundData?.current_amount || 0;

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

              const productName = product?.name || 'Produit';

              // Get business owner first name for greeting
              const { data: ownerProfile } = await supabase
                .from('profiles')
                .select('first_name')
                .eq('user_id', business.user_id)
                .single();

              const ownerFirstName = ownerProfile?.first_name || business.business_name;

              // Send WhatsApp template to vendor (fallback-safe)
              if (business.phone) {
                try {
                  const waResult = await sendWhatsAppTemplate(
                    business.phone,
                    'joiedevivre_fund_ready',
                    'fr',
                    [ownerFirstName, fundTitle, String(fundAmount), productName, beneficiaryName],
                    [bf.fund_id] // CTA button: "Voir la commande" -> /business/orders/{fund_id}
                  );
                  console.log(`📱 WhatsApp to vendor ${business.business_name}: ${waResult.success ? '✅' : '❌ ' + waResult.error}`);
                } catch (waError) {
                  console.error(`❌ WhatsApp send failed for ${business.business_name}:`, waError);
                  // Continue - in-app notification will still be created
                }
              } else {
                console.warn(`⚠️ No phone for business ${business.business_name}, skipping WhatsApp`);
              }

              // Always create in-app notification for the vendor
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
              notificationsCreated++;
              console.log(`✅ Vendor notification created for ${business.business_name} (fund: ${fundTitle})`);

            } catch (bfError) {
              console.error(`Error processing business fund ${bf.fund_id}:`, bfError);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error notifying business vendors:", error);
    }

    console.log(`✅ Created ${notificationsCreated} intelligent notifications`);

    return new Response(
      JSON.stringify({
        success: true,
        notifications_created: notificationsCreated,
        users_analyzed: users.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error("[SERVER] Error in intelligent-notifications:", error);
    return new Response(
      JSON.stringify({ 
        error: 'Une erreur est survenue lors de l\'analyse des notifications intelligentes',
        code: 'INTERNAL_ERROR'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
