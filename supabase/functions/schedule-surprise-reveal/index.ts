import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    console.log("🔍 Checking for surprises to reveal...");

    // Récupérer les surprises à révéler
    const { data: surprises, error: surprisesError } = await supabase
      .rpc('get_surprises_to_reveal');

    if (surprisesError) {
      console.error("Error fetching surprises:", surprisesError);
      throw surprisesError;
    }

    if (!surprises || surprises.length === 0) {
      console.log("✅ No surprises to reveal at this time");
      return new Response(
        JSON.stringify({ message: "No surprises to reveal", count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🎉 Found ${surprises.length} surprise(s) to reveal`);

    const results = [];

    for (const surprise of surprises) {
      console.log(`Processing surprise for fund ${surprise.fund_id}`);

      // Optionnel: Générer un chant IA si un prompt est fourni
      let audioUrl = null;
      if (surprise.surprise_song_prompt) {
        try {
          console.log("🎵 Generating AI song...");
          const { data: songData, error: songError } = await supabase.functions.invoke(
            'generate-ai-music',
            {
              body: {
                prompt: surprise.surprise_song_prompt,
                duration: 15
              }
            }
          );

          if (!songError && songData?.audioUrl) {
            audioUrl = songData.audioUrl;
            console.log("✅ Song generated successfully");
          } else {
            console.warn("⚠️ Failed to generate song:", songError);
          }
        } catch (error) {
          console.error("Error generating song:", error);
        }
      }

      // Créer une publication automatique pour la révélation
      try {
        const { data: post, error: postError } = await supabase
          .from('posts')
          .insert({
            user_id: surprise.creator_id,
            content: `🎉 SURPRISE RÉVÉLÉE ! 🎁\n\n${surprise.surprise_message}`,
            visibility: 'friends',
            is_published: true,
            metadata: {
              fund_id: surprise.fund_id,
              is_surprise_reveal: true,
              audio_url: audioUrl
            }
          })
          .select()
          .single();

        if (postError) {
          console.error("Error creating post:", postError);
        } else {
          console.log("✅ Surprise reveal post created:", post.id);
        }
      } catch (error) {
        console.error("Error creating reveal post:", error);
      }

      // Récupérer les contributeurs pour la notification
      const { data: contributors } = await supabase
        .from('surprise_contributors')
        .select('contributor_id')
        .eq('fund_id', surprise.fund_id);

      // Notifier le bénéficiaire
      if (surprise.beneficiary_contact_id) {
        const { data: contact } = await supabase
          .from('contacts')
          .select('user_id')
          .eq('id', surprise.beneficiary_contact_id)
          .single();

        if (contact?.user_id) {
          await supabase
            .from('scheduled_notifications')
            .insert({
              user_id: contact.user_id,
              notification_type: 'surprise_revealed',
              title: '🎉 SURPRISE ! Un cadeau t\'attend !',
              message: 'Tes amis t\'ont préparé une belle surprise. Découvre-la maintenant !',
              scheduled_for: new Date().toISOString(),
              delivery_methods: ['email', 'push', 'in_app'],
              metadata: {
                fund_id: surprise.fund_id,
                audio_url: audioUrl
              }
            });
        }
      }

      // Marquer la surprise comme révélée
      await supabase.rpc('mark_surprise_revealed', { p_fund_id: surprise.fund_id });

      results.push({
        fund_id: surprise.fund_id,
        revealed: true,
        audio_generated: !!audioUrl,
        contributors_notified: contributors?.length || 0
      });
    }

    console.log(`✅ Successfully revealed ${results.length} surprise(s)`);

    return new Response(
      JSON.stringify({
        success: true,
        count: results.length,
        results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error("Error in schedule-surprise-reveal:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
