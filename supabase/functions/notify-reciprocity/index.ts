import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    console.error('Unauthorized access attempt to notify-reciprocity');
    return new Response(
      JSON.stringify({ error: 'Unauthorized', code: 'AUTH_REQUIRED' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { fund_id } = await req.json();

    console.log(`Processing reciprocity notifications for fund: ${fund_id}`);

    // Récupérer les candidats pour la réciprocité
    const { data: candidates, error } = await supabase
      .rpc('get_reciprocity_candidates', { fund_uuid: fund_id });

    if (error) {
      console.error('Error fetching candidates:', error);
      throw error;
    }

    console.log(`Found ${candidates?.length || 0} reciprocity candidates`);

    if (!candidates || candidates.length === 0) {
      return new Response(
        JSON.stringify({ success: true, notified_count: 0, message: 'No candidates found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Récupérer les infos de la cagnotte
    const { data: fund } = await supabase
      .from('collective_funds')
      .select('title, creator_id, occasion')
      .eq('id', fund_id)
      .single();

    if (!fund) {
      throw new Error('Fund not found');
    }

    // Récupérer le nom du créateur
    const { data: creator } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('user_id', fund.creator_id)
      .single();

    const creatorName = creator 
      ? `${creator.first_name || ''} ${creator.last_name || ''}`.trim() || 'Un utilisateur'
      : 'Un utilisateur';

    // Créer les notifications
    const notifications = candidates.map(candidate => ({
      user_id: candidate.candidate_id,
      notification_type: 'reciprocity_reminder',
      title: '🎁 C\'est le moment de rendre la pareille !',
      message: `${creatorName} a déjà contribué ${candidate.past_contribution_amount} XOF à ta cagnotte. Participe maintenant à "${fund.title}" !`,
      scheduled_for: new Date().toISOString(),
      delivery_methods: ['email', 'push', 'in_app'],
      metadata: {
        fund_id,
        past_contribution_amount: candidate.past_contribution_amount,
        past_contribution_date: candidate.past_contribution_date,
        generosity_score: candidate.generosity_score,
        fund_title: fund.title,
        creator_name: creatorName,
        occasion: fund.occasion
      }
    }));

    const { error: insertError } = await supabase
      .from('scheduled_notifications')
      .insert(notifications);

    if (insertError) {
      console.error('Error inserting notifications:', insertError);
      throw insertError;
    }

    console.log(`Successfully created ${notifications.length} reciprocity notifications`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        notified_count: candidates.length,
        fund_title: fund.title,
        creator: creatorName
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in notify-reciprocity function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
