import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.54.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const GratitudeMessageSchema = z.object({
  gratitudeId: z.string().uuid({ message: "Invalid gratitude ID format" }),
  contributorName: z.string().min(1).max(100).trim(),
  beneficiaryName: z.string().min(1).max(100).trim(),
  amount: z.number().positive().max(100000000),
  currency: z.string().length(3).default('XOF'),
  fundTitle: z.string().min(1).max(200).trim(),
  occasion: z.string().max(100).optional()
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    
    // Validate input
    const validationResult = GratitudeMessageSchema.safeParse(body);
    if (!validationResult.success) {
      console.error("Validation failed:", validationResult.error);
      return new Response(JSON.stringify({ 
        error: "Données invalides",
        details: validationResult.error.errors 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    const { gratitudeId, contributorName, beneficiaryName, amount, currency, fundTitle, occasion } = validationResult.data;

    // Check if Lovable AI is available
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    let enhancedMessage = '';

    if (lovableApiKey) {
      // Use Lovable AI to generate a personalized gratitude message
      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            {
              role: 'system',
              content: 'Tu es un assistant qui génère des messages de gratitude chaleureux et authentiques en français pour l\'application JOIE DE VIVRE. Les messages doivent être courts (max 2 phrases), émotionnels et sincères.'
            },
            {
              role: 'user',
              content: `Génère un message de gratitude pour ${contributorName} qui vient de contribuer ${amount} ${currency} à la cagnotte "${fundTitle}" pour ${beneficiaryName}${occasion ? ` à l'occasion de ${occasion}` : ''}. Le message doit exprimer de la reconnaissance et célébrer ce geste généreux.`
            }
          ],
        }),
      });

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        enhancedMessage = aiData.choices[0].message.content;
      } else {
        console.error('AI generation failed, using fallback');
        enhancedMessage = `✨ ${contributorName} a contribué ${amount} ${currency} à la cagnotte "${fundTitle}". Merci pour ce geste généreux ! 💝`;
      }
    } else {
      // Fallback message without AI
      const templates = [
        `💝 Quelle générosité ! ${contributorName} vient d'apporter ${amount} ${currency} pour ${beneficiaryName}. Un geste qui réchauffe les cœurs ! ✨`,
        `🌟 ${contributorName} illumine cette journée avec une contribution de ${amount} ${currency} ! Merci pour ce bel élan de solidarité. 💫`,
        `✨ Le cœur généreux de ${contributorName} brille aujourd'hui : ${amount} ${currency} offerts avec amour pour ${beneficiaryName} ! 🎁`,
        `💖 ${contributorName} fait preuve d'une belle générosité : ${amount} ${currency} pour soutenir ${beneficiaryName}. Bravo ! 🌺`,
      ];
      enhancedMessage = templates[Math.floor(Math.random() * templates.length)];
    }

    // Update the gratitude message
    const { error: updateError } = await supabase
      .from('gratitude_wall')
      .update({ 
        message_text: enhancedMessage,
        updated_at: new Date().toISOString()
      })
      .eq('id', gratitudeId);

    if (updateError) {
      throw updateError;
    }

    return new Response(
      JSON.stringify({ message: 'Gratitude message enhanced successfully', enhancedMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error enhancing gratitude message:', error);
    return new Response(
      JSON.stringify({ 
        error: "Une erreur est survenue lors de l'amélioration du message",
        code: "INTERNAL_ERROR"
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
