import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendWhatsApp } from '../_shared/sms-sender.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const APP_URL = Deno.env.get('APP_URL') || 'https://joiedevivre-africa.com';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: expired, error } = await supabaseAdmin.rpc('expire_wave_subscriptions');
    if (error) throw new Error(error.message);

    const list = (expired as Array<{ expired_user_id: string; previous_tier: string }>) || [];
    let notified = 0;

    for (const row of list) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('phone, first_name')
        .eq('user_id', row.expired_user_id)
        .maybeSingle();
      if (!profile?.phone) continue;
      const name = profile.first_name ? `${profile.first_name}, ` : '';
      const msg = `${name}ton abonnement JDV ${row.previous_tier} a expiré. Tu repasses en Gratuit mais tes données restent intactes. Reviens quand tu veux : ${APP_URL}/pricing`;
      const r = await sendWhatsApp(profile.phone, msg);
      if (r.success) notified++;
    }

    return new Response(JSON.stringify({ success: true, expired: list.length, notified }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('wave-subscription-expire error:', e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});