import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const RefundRequestSchema = z.object({
  fund_id: z.string().uuid({ message: "Invalid fund ID format" }),
  user_id: z.string().uuid({ message: "Invalid user ID format" }),
  fund_title: z.string().min(1).max(200).optional()
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    // Validate input
    const validationResult = RefundRequestSchema.safeParse(body);
    if (!validationResult.success) {
      console.error("Validation failed:", validationResult.error);
      return new Response(JSON.stringify({ 
        error: "Données invalides",
        details: validationResult.error.errors 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    const { fund_id, user_id, fund_title } = validationResult.data;

    if (!fund_id || !user_id) {
      return new Response(JSON.stringify({ error: "Paramètres manquants" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    console.log(`Demande de remboursement pour fund_id: ${fund_id}, user_id: ${user_id}`);

    // Vérifier que l'utilisateur a bien contribué à cette cotisation
    const { data: contribution, error: contributionError } = await supabase
      .from('fund_contributions')
      .select('id, amount, currency')
      .eq('fund_id', fund_id)
      .eq('contributor_id', user_id)
      .single();

    if (contributionError || !contribution) {
      console.error("Contribution non trouvée:", contributionError);
      return new Response(JSON.stringify({ error: "Contribution non trouvée" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Vérifier que la cotisation est bien expirée
    const { data: fund, error: fundError } = await supabase
      .from('collective_funds')
      .select('status, title')
      .eq('id', fund_id)
      .single();

    if (fundError || !fund || fund.status !== 'expired') {
      console.error("Cotisation non expirée ou non trouvée:", fundError);
      return new Response(JSON.stringify({ error: "Cette cotisation n'est pas expirée ou n'existe pas" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Appeler la fonction de base de données pour traiter la demande de remboursement
    const { data: refundRequestId, error: refundError } = await supabase
      .rpc('request_refund_from_service', {
        p_fund_id: fund_id,
        p_user_id: user_id,
        p_amount: contribution.amount,
        p_currency: contribution.currency || 'XOF'
      });

    if (refundError) {
      console.error("Erreur lors de la création de la demande de remboursement:", refundError);
      throw refundError;
    }

    console.log(`Demande de remboursement créée avec l'ID: ${refundRequestId}`);

    return new Response(JSON.stringify({ 
      success: true,
      message: "Demande de remboursement envoyée avec succès",
      refund_request_id: refundRequestId,
      amount: contribution.amount,
      currency: contribution.currency || 'XOF'
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Erreur dans request-refund:", error);
    return new Response(JSON.stringify({ 
      error: "Une erreur est survenue lors du traitement de votre demande",
      code: "INTERNAL_ERROR"
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});