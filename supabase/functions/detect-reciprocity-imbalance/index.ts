import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ImbalanceUser {
  user_id: string;
  total_received: number;
  total_contributed: number;
  contributions_received_count: number;
  contributions_given_count: number;
  last_contribution_date: string | null;
  imbalance_ratio: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🔍 Starting reciprocity imbalance detection...');

    // Detect users with severe imbalances
    const { data: imbalancedUsers, error: queryError } = await supabase.rpc(
      'detect_reciprocity_imbalances'
    ) as { data: ImbalanceUser[] | null, error: any };

    if (queryError) {
      console.error('Error querying imbalances:', queryError);
      
      // Fallback query if RPC doesn't exist
      const { data: users } = await supabase
        .from('reciprocity_scores')
        .select(`
          user_id,
          total_amount_given,
          total_contributions_count
        `);

      if (!users) throw new Error('Failed to fetch reciprocity data');

      // Calculate imbalances manually
      const processedUsers: ImbalanceUser[] = [];
      
      for (const user of users) {
        // Get contributions received
        const { data: received } = await supabase
          .from('reciprocity_tracking')
          .select('contribution_amount, created_at')
          .eq('beneficiary_id', user.user_id);

        const totalReceived = received?.reduce((sum, r) => sum + Number(r.contribution_amount), 0) || 0;
        const receivedCount = received?.length || 0;
        
        // Get last contribution date
        const { data: lastContrib } = await supabase
          .from('reciprocity_tracking')
          .select('created_at')
          .eq('donor_id', user.user_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        // Calculate imbalance
        const totalGiven = Number(user.total_amount_given) || 0;
        const givenCount = user.total_contributions_count || 0;
        
        // Skip if user hasn't received much
        if (totalReceived < 10000) continue;
        
        // Calculate ratio (received / given)
        const ratio = totalGiven > 0 ? totalReceived / totalGiven : totalReceived;
        
        // Detect severe imbalance: received > 25K but given < 5K OR ratio > 5
        if ((totalReceived > 25000 && totalGiven < 5000) || (ratio > 5 && totalReceived > 15000)) {
          const daysSinceLastContrib = lastContrib?.created_at 
            ? Math.floor((Date.now() - new Date(lastContrib.created_at).getTime()) / (1000 * 60 * 60 * 24))
            : null;

          processedUsers.push({
            user_id: user.user_id,
            total_received: totalReceived,
            total_contributed: totalGiven,
            contributions_received_count: receivedCount,
            contributions_given_count: givenCount,
            last_contribution_date: lastContrib?.created_at || null,
            imbalance_ratio: ratio,
          });
        }
      }

      console.log(`Found ${processedUsers.length} users with imbalances (manual calculation)`);
      
      // Create alerts for each imbalanced user
      let alertsCreated = 0;
      
      for (const user of processedUsers) {
        // Check if alert already exists for this user (within last 30 days)
        const { data: existingAlert } = await supabase
          .from('reciprocity_imbalance_alerts')
          .select('id')
          .eq('user_id', user.user_id)
          .eq('status', 'pending')
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
          .maybeSingle();

        if (existingAlert) {
          console.log(`Alert already exists for user ${user.user_id}`);
          continue;
        }

        // Determine severity
        const severity = user.imbalance_ratio > 10 ? 'critical' :
                        user.imbalance_ratio > 7 ? 'high' :
                        user.imbalance_ratio > 4 ? 'medium' : 'low';

        // Generate recommended action
        const recommendedAction = user.contributions_given_count === 0
          ? 'Contacter l\'utilisateur pour encourager la participation communautaire'
          : user.total_contributed < 5000
          ? 'Envoyer une notification rappelant l\'importance de la réciprocité'
          : 'Surveiller l\'activité et envoyer un rappel personnalisé';

        // Create alert
        const { error: insertError } = await supabase
          .from('reciprocity_imbalance_alerts')
          .insert({
            user_id: user.user_id,
            alert_type: 'severe_imbalance',
            severity,
            total_received: user.total_received,
            total_contributed: user.total_contributed,
            imbalance_ratio: user.imbalance_ratio,
            contributions_received_count: user.contributions_received_count,
            contributions_given_count: user.contributions_given_count,
            days_since_last_contribution: user.last_contribution_date 
              ? Math.floor((Date.now() - new Date(user.last_contribution_date).getTime()) / (1000 * 60 * 60 * 24))
              : null,
            recommended_action: recommendedAction,
            status: 'pending',
          });

        if (insertError) {
          console.error(`Failed to create alert for user ${user.user_id}:`, insertError);
        } else {
          alertsCreated++;
          console.log(`✅ Created ${severity} alert for user ${user.user_id} (ratio: ${user.imbalance_ratio.toFixed(2)})`);
        }
      }

      console.log(`✅ Detection complete: ${alertsCreated} new alerts created`);

      return new Response(
        JSON.stringify({
          success: true,
          usersAnalyzed: users.length,
          imbalancedUsersFound: processedUsers.length,
          alertsCreated,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Original RPC path (if it exists)
    console.log(`Found ${imbalancedUsers?.length || 0} users with imbalances`);

    let alertsCreated = 0;
    for (const user of imbalancedUsers || []) {
      // Check if alert already exists
      const { data: existingAlert } = await supabase
        .from('reciprocity_imbalance_alerts')
        .select('id')
        .eq('user_id', user.user_id)
        .eq('status', 'pending')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .maybeSingle();

      if (existingAlert) continue;

      const severity = user.imbalance_ratio > 10 ? 'critical' :
                      user.imbalance_ratio > 7 ? 'high' :
                      user.imbalance_ratio > 4 ? 'medium' : 'low';

      const recommendedAction = user.contributions_given_count === 0
        ? 'Contacter l\'utilisateur pour encourager la participation communautaire'
        : user.total_contributed < 5000
        ? 'Envoyer une notification rappelant l\'importance de la réciprocité'
        : 'Surveiller l\'activité et envoyer un rappel personnalisé';

      const { error: insertError } = await supabase
        .from('reciprocity_imbalance_alerts')
        .insert({
          user_id: user.user_id,
          alert_type: 'severe_imbalance',
          severity,
          total_received: user.total_received,
          total_contributed: user.total_contributed,
          imbalance_ratio: user.imbalance_ratio,
          contributions_received_count: user.contributions_received_count,
          contributions_given_count: user.contributions_given_count,
          days_since_last_contribution: user.last_contribution_date 
            ? Math.floor((Date.now() - new Date(user.last_contribution_date).getTime()) / (1000 * 60 * 60 * 24))
            : null,
          recommended_action: recommendedAction,
          status: 'pending',
        });

      if (!insertError) alertsCreated++;
    }

    console.log(`✅ Created ${alertsCreated} new alerts`);

    return new Response(
      JSON.stringify({
        success: true,
        imbalancedUsersFound: imbalancedUsers?.length || 0,
        alertsCreated,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in detect-reciprocity-imbalance:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});