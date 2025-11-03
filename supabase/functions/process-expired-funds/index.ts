import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ExpiredFund {
  id: string;
  title: string;
  creator_id: string;
  target_amount: number;
  current_amount: number;
  currency: string;
  contributors: Array<{
    id: string;
    contributor_id: string;
    amount: number;
    currency: string;
    profiles?: {
      first_name: string;
      last_name: string;
    }
  }>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    console.log("Démarrage du traitement des cotisations expirées");

    // Récupérer les cotisations expirées (deadline dépassé + statut actif + objectif non atteint)
    const { data: expiredFunds, error: fetchError } = await supabase
      .from('collective_funds')
      .select(`
        id,
        title,
        creator_id,
        target_amount,
        current_amount,
        currency,
        fund_contributions!inner(
          id,
          contributor_id,
          amount,
          currency,
          profiles:contributor_id(first_name, last_name)
        )
      `)
      .lt('deadline_date', new Date().toISOString().split('T')[0]) // deadline dépassé
      .eq('status', 'active')
      .lt('current_amount', supabase.rpc('target_amount')); // objectif non atteint

    if (fetchError) {
      console.error("Erreur lors de la récupération des fonds expirés:", fetchError);
      throw fetchError;
    }

    console.log(`${expiredFunds?.length || 0} cotisations expirées trouvées`);

    if (!expiredFunds || expiredFunds.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Aucune cotisation expirée à traiter",
        processed: 0 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let processedCount = 0;

    for (const fund of expiredFunds.map(f => ({
      ...f,
      contributors: f.fund_contributions.map(contrib => ({
        ...contrib,
        profiles: contrib.profiles?.[0] // Take first profile since it's an array from the query
      }))
    })) as ExpiredFund[]) {
      try {
        console.log(`Traitement de la cotisation expirée: ${fund.title} (${fund.id})`);

        // 1. Marquer la cotisation comme expirée
        const { error: updateError } = await supabase
          .from('collective_funds')
          .update({ status: 'expired' })
          .eq('id', fund.id);

        if (updateError) {
          console.error(`Erreur lors de la mise à jour du statut pour ${fund.id}:`, updateError);
          continue;
        }

        // 2. Créer des entrées de remboursement pour chaque contributeur
        const refunds = fund.contributors.map(contribution => ({
          fund_id: fund.id,
          contributor_id: contribution.contributor_id,
          amount: contribution.amount,
          currency: contribution.currency || fund.currency,
          status: 'pending',
          reason: 'fund_expired',
          metadata: {
            fund_title: fund.title,
            contributor_name: contribution.profiles 
              ? `${contribution.profiles.first_name} ${contribution.profiles.last_name}`.trim()
              : 'Contributeur inconnu',
            expiry_date: new Date().toISOString()
          }
        }));

        if (refunds.length > 0) {
          const { error: refundError } = await supabase
            .from('refunds')
            .insert(refunds);

          if (refundError) {
            console.error(`Erreur lors de la création des remboursements pour ${fund.id}:`, refundError);
          } else {
            console.log(`${refunds.length} remboursements créés pour la cotisation ${fund.id}`);
          }
        }

        // 3. Envoyer des notifications de remboursement aux contributeurs
        for (const contribution of fund.contributors) {
          const contributorName = contribution.profiles 
            ? `${contribution.profiles.first_name} ${contribution.profiles.last_name}`.trim()
            : 'Cher contributeur';

          const { error: notificationError } = await supabase
            .from('scheduled_notifications')
            .insert({
              user_id: contribution.contributor_id,
              notification_type: 'fund_expired_refund',
              title: 'Cotisation expirée - Remboursement en cours 💰',
              message: `La cotisation "${fund.title}" a expiré. Votre contribution de ${contribution.amount} ${contribution.currency || fund.currency} sera remboursée. Un remboursement de ${contribution.amount} ${contribution.currency || fund.currency} est en cours de traitement.`,
              scheduled_for: new Date().toISOString(),
              delivery_methods: ['email', 'push', 'in_app'],
              metadata: {
                fund_id: fund.id,
                fund_title: fund.title,
                refund_amount: contribution.amount,
                refund_currency: contribution.currency || fund.currency
              }
            });

          if (notificationError) {
            console.error(`Erreur lors de l'envoi de notification à ${contribution.contributor_id}:`, notificationError);
          }
        }

        // 4. Notifier le créateur de la cotisation
        const { error: creatorNotificationError } = await supabase
          .from('scheduled_notifications')
          .insert({
            user_id: fund.creator_id,
            notification_type: 'fund_expired_creator',
            title: 'Cotisation expirée ⏰',
            message: `Votre cotisation "${fund.title}" a expiré sans atteindre l\'objectif. Les contributeurs ont été remboursés automatiquement.`,
            scheduled_for: new Date().toISOString(),
            delivery_methods: ['email', 'push', 'in_app'],
            metadata: {
              fund_id: fund.id,
              fund_title: fund.title,
              target_amount: fund.target_amount,
              current_amount: fund.current_amount,
              contributors_count: fund.contributors.length
            }
          });

        if (creatorNotificationError) {
          console.error(`Erreur lors de l'envoi de notification au créateur ${fund.creator_id}:`, creatorNotificationError);
        }

        processedCount++;
        console.log(`Cotisation ${fund.id} traitée avec succès`);

      } catch (error) {
        console.error(`Erreur lors du traitement de la cotisation ${fund.id}:`, error);
      }
    }

    console.log(`Traitement terminé: ${processedCount} cotisations traitées`);

    return new Response(JSON.stringify({ 
      success: true, 
      message: `${processedCount} cotisations expirées traitées avec succès`,
      processed: processedCount 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[SERVER] Erreur dans process-expired-funds:", error);
    return new Response(JSON.stringify({ 
      error: 'Une erreur est survenue lors du traitement des cotisations expirées',
      code: 'INTERNAL_ERROR'
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});