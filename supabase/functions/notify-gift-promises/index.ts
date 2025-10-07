import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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

    const { record } = await req.json();
    
    if (!record || !record.beneficiary_contact_id) {
      console.log('No beneficiary contact for this fund');
      return new Response(JSON.stringify({ message: 'No beneficiary contact' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get beneficiary user_id from contacts
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('user_id, name')
      .eq('id', record.beneficiary_contact_id)
      .single();

    if (contactError || !contact) {
      console.error('Error fetching contact:', contactError);
      return new Response(JSON.stringify({ error: 'Contact not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const beneficiaryUserId = contact.user_id;
    const beneficiaryName = contact.name;

    // Get all unnotified gift promises for this beneficiary
    const { data: promises, error: promisesError } = await supabase
      .from('gift_promises')
      .select('id, user_id')
      .eq('post_author_id', beneficiaryUserId)
      .eq('is_notified', false);

    if (promisesError) {
      console.error('Error fetching promises:', promisesError);
      throw promisesError;
    }

    if (!promises || promises.length === 0) {
      console.log('No unnotified gift promises found');
      return new Response(JSON.stringify({ message: 'No promises to notify' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${promises.length} gift promises to notify`);

    // Create notifications for each promise
    for (const promise of promises) {
      // Create notification
      await supabase
        .from('scheduled_notifications')
        .insert({
          user_id: promise.user_id,
          notification_type: 'gift_promise_reminder',
          title: 'Rappel de promesse de cadeau 🎁',
          message: `Vous avez promis d'offrir un cadeau à ${beneficiaryName} ! Une cagnotte pour son anniversaire vient d'être créée.`,
          scheduled_for: new Date().toISOString(),
          delivery_methods: ['email', 'push', 'in_app'],
          metadata: {
            fund_id: record.id,
            promise_id: promise.id,
            beneficiary_name: beneficiaryName,
            fund_url: `/gifts?fund=${record.id}`
          }
        });

      // Mark promise as notified
      await supabase
        .from('gift_promises')
        .update({ is_notified: true })
        .eq('id', promise.id);
    }

    console.log(`Successfully notified ${promises.length} users about their gift promises`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        notified_count: promises.length 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in notify-gift-promises function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});