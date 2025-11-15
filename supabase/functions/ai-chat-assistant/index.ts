import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS simplifié pour accepter toutes les origines
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  const origin = req.headers.get('origin');
  console.log('🔵 Requête reçue depuis:', origin);
  console.log('🔵 Method:', req.method);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversationId, sessionId, context } = await req.json();
    
    console.log('AI Chat Request:', { message, conversationId, sessionId, context });
    
    // Initialisation Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { 
        global: { 
          headers: { Authorization: req.headers.get('Authorization')! } 
        } 
      }
    );

    // Récupérer l'utilisateur (peut être null pour visiteurs non connectés)
    const { data: { user } } = await supabaseClient.auth.getUser();
    console.log('User:', user?.id || 'Anonymous');

    // Récupérer ou créer la conversation
    let conversation;
    if (conversationId) {
      const { data } = await supabaseClient
        .from('ai_conversations')
        .select('*')
        .eq('id', conversationId)
        .single();
      conversation = data;
      console.log('Loaded conversation:', conversation?.id);
    }
    
    // Si pas de conversation trouvée ou pas de conversationId, créer une nouvelle
    if (!conversation) {
      // Créer une nouvelle conversation
      const { data, error: convError } = await supabaseClient
        .from('ai_conversations')
        .insert({
          user_id: user?.id,
          session_id: sessionId,
          conversation_stage: context?.stage || 'discovery',
          current_page: context?.page || '/',
          messages_count: 0
        })
        .select()
        .single();
      
      if (convError) {
        console.error('Error creating conversation:', convError);
        throw convError;
      }
      
      conversation = data;
      console.log('Created new conversation:', conversation?.id);
    }
    
    // Vérifier que la conversation existe
    if (!conversation || !conversation.id) {
      throw new Error('Failed to create or load conversation');
    }

    // Récupérer l'historique des messages (limité aux 10 derniers)
    const { data: messageHistory } = await supabaseClient
      .from('ai_messages')
      .select('role, content')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true })
      .limit(10);

    console.log('Message history count:', messageHistory?.length || 0);

    // Construire le contexte utilisateur
    const userContext = await buildUserContext(supabaseClient, user, context);
    console.log('User context:', userContext);

    // Construire le prompt système
    const systemPrompt = buildSystemPrompt(conversation.conversation_stage, userContext);

    // Construire l'historique de messages pour l'IA
    const messages = [
      { role: "system", content: systemPrompt },
      ...(messageHistory || []).map(m => ({ role: m.role, content: m.content })),
      { role: "user", content: message }
    ];

    // Sauvegarder le message utilisateur
    await supabaseClient
      .from('ai_messages')
      .insert({
        conversation_id: conversation.id,
        role: 'user',
        content: message,
        page_context: context?.page,
        user_state: userContext
      });

    // Appeler Lovable AI avec streaming
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(JSON.stringify({ 
        error: "Configuration serveur manquante" 
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    console.log('Calling Lovable AI with', messages.length, 'messages...');
    
    // Ajouter un timeout de 30 secondes
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    let response;
    try {
      response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: messages,
          stream: true
          // Pas de temperature ni max_tokens pour Gemini
        }),
      });
      clearTimeout(timeoutId);
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        console.error('Request timeout');
        return new Response(JSON.stringify({ 
          error: "La requête a pris trop de temps. Veuillez réessayer." 
        }), {
          status: 504,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw error;
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: "Trop de demandes, veuillez patienter quelques instants." 
        }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: "Crédits insuffisants. Veuillez contacter l'administrateur." 
        }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ 
        error: "Erreur du service IA. Veuillez réessayer." 
      }), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log('Streaming response...');
    
    // Retourner le stream SSE
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });

  } catch (error) {
    console.error('AI Chat Error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Une erreur est survenue',
        code: 'INTERNAL_ERROR'
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Fonction pour construire le contexte utilisateur
async function buildUserContext(supabase, user, context) {
  if (!user) {
    return {
      isAuthenticated: false,
      currentPage: context?.page || '/',
      hasProfile: false,
      hasFriends: false,
      hasPreferences: false,
      isBirthdayToday: false
    };
  }

  try {
    // Récupérer le profil avec gestion d'erreur
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('first_name, city, birthday')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (profileError) {
      console.error('Error fetching profile:', profileError);
    }

    // Vérifier si c'est l'anniversaire de l'utilisateur
    let isBirthdayToday = false;
    if (profile?.birthday) {
      const today = new Date();
      const birthday = new Date(profile.birthday);
      isBirthdayToday = 
        today.getMonth() === birthday.getMonth() && 
        today.getDate() === birthday.getDate();
    }

    // Compter les amis avec gestion d'erreur
    const { count: friendsCount, error: friendsError } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);
    
    if (friendsError) {
      console.error('Error counting friends:', friendsError);
    }

    // Vérifier les préférences avec gestion d'erreur
    const { data: preferences, error: prefsError } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (prefsError) {
      console.error('Error fetching preferences:', prefsError);
    }

    // Compter les cagnottes avec gestion d'erreur
    const { count: fundsCount, error: fundsError } = await supabase
      .from('collective_funds')
      .select('*', { count: 'exact', head: true })
      .eq('creator_id', user.id);
    
    if (fundsError) {
      console.error('Error counting funds:', fundsError);
    }

    return {
      isAuthenticated: true,
      currentPage: context?.page || '/',
      firstName: profile?.first_name,
      hasProfile: !!profile,
      hasFriends: (friendsCount || 0) > 0,
      friendsCount: friendsCount || 0,
      hasPreferences: !!preferences,
      hasFunds: (fundsCount || 0) > 0,
      fundsCount: fundsCount || 0,
      isBirthdayToday
    };
  } catch (error) {
    console.error('Unexpected error in buildUserContext:', error);
    return {
      isAuthenticated: true,
      currentPage: context?.page || '/',
      hasProfile: false,
      hasFriends: false,
      friendsCount: 0,
      hasPreferences: false,
      hasFunds: false,
      fundsCount: 0,
      isBirthdayToday: false
    };
  }
}

// Fonction pour construire le prompt système
function buildSystemPrompt(stage, userContext) {
  let basePrompt = `Tu es l'assistant virtuel de JOIE DE VIVRE, une plateforme qui célèbre les moments de bonheur en Côte d'Ivoire.

**Ta mission :**
- Accueillir chaleureusement les visiteurs
- Guider dans l'utilisation de la plateforme
- Répondre aux questions de manière claire et concise
- Encourager à utiliser les fonctionnalités

**Ton style :**
- Amical et bienveillant
- Utilise des emojis 🎁🎉❤️ avec modération
- Phrases courtes et claires
- Tu vouvoies l'utilisateur
- Tu utilises le français ivoirien quand approprié

**Fonctionnalités de JOIE DE VIVRE :**
1. 🎁 **Cadeaux** : Commander des cadeaux pour soi ou pour un proche
2. 💰 **Cagnottes collaboratives** : Créer des collectes pour offrir un cadeau ensemble
3. ❤️ **Liste de souhaits** : Configurer ses préférences (tailles, couleurs, budget)
4. 👥 **Cercle d'amis** : Ajouter ses proches pour recevoir et offrir des cadeaux
5. 🎉 **Occasions spéciales** : Anniversaires, promotions, mariages, etc.
6. 🏪 **Espace Business** : Pour les commerçants qui souhaitent vendre sur la plateforme
`;

  // Contexte pour les nouveaux utilisateurs
  if (userContext.isAuthenticated && !userContext.hasProfile) {
    basePrompt += `

⚠️ UTILISATEUR NOUVELLEMENT INSCRIT
- L'utilisateur vient de s'inscrire mais n'a pas encore complété son profil
- Encourage-le à remplir son profil (prénom, date d'anniversaire, ville)
- Explique l'importance de compléter son profil pour profiter pleinement de la plateforme
`;
  }

  // 🎂 PRIORITÉ ABSOLUE : ANNIVERSAIRE
  if (userContext.isBirthdayToday) {
    basePrompt += `

🎉🎂 AUJOURD'HUI C'EST L'ANNIVERSAIRE DE L'UTILISATEUR ! 🎂🎉

INSTRUCTION CRITIQUE :
- Commence IMMÉDIATEMENT ta première réponse en lui souhaitant un JOYEUX ANNIVERSAIRE de manière très chaleureuse
- Utilise son prénom si disponible : ${userContext.firstName || 'cher utilisateur'}
- Sois festif, enthousiaste et joyeux dans TOUTES tes réponses
- Rappelle-lui qu'il peut créer une cagnotte pour son anniversaire
- Encourage-le à profiter de cette journée spéciale avec ses proches
- Célèbre avec lui ce moment important`;
  }

  const stageContext = {
    'discovery': `
**Contexte actuel : DÉCOUVERTE**
L'utilisateur découvre la plateforme. Présente les services principaux et l'invite à s'inscrire.`,
    
    'onboarding': `
**Contexte actuel : INSCRIPTION**
L'utilisateur est en train de s'inscrire. Guide-le étape par étape (prénom, date d'anniversaire, ville, téléphone).`,
    
    'setup_profile': `
**Contexte actuel : CONFIGURATION DU PROFIL**
L'utilisateur a un compte. Encourage-le à compléter son profil pour une meilleure expérience.`,
    
    'add_friends': `
**Contexte actuel : AJOUT D'AMIS**
Explique l'importance d'ajouter des amis :
- Pour recevoir des cadeaux lors de son anniversaire
- Pour créer des cagnottes ensemble
- Pour voir les cagnottes de ses proches`,
    
    'preferences': `
**Contexte actuel : PRÉFÉRENCES**
Guide l'utilisateur dans la configuration de ses préférences :
- Tailles (vêtements, chaussures)
- Allergies alimentaires
- Couleurs préférées
- Fourchettes de budget
- Confidentialité`,
    
    'using_features': `
**Contexte actuel : UTILISATION**
L'utilisateur explore les fonctionnalités. Réponds à ses questions sur :
- Comment créer une cagnotte
- Comment contribuer
- Comment commander un cadeau
- Les notifications`,
    
    'advanced': `
**Contexte actuel : UTILISATEUR AVANCÉ**
L'utilisateur maîtrise la plateforme. Partage des astuces avancées :
- Cagnottes surprises
- Système de réciprocité
- Notifications intelligentes
- Mur de gratitude`
  };

  const userContextStr = `
**Informations utilisateur :**
- Connecté : ${userContext.isAuthenticated ? 'Oui' : 'Non'}
${userContext.firstName ? `- Prénom : ${userContext.firstName}` : ''}
- Page actuelle : ${userContext.currentPage}
- A des amis : ${userContext.hasFriends ? `Oui (${userContext.friendsCount})` : 'Non'}
- Préférences configurées : ${userContext.hasPreferences ? 'Oui' : 'Non'}
- Cagnottes créées : ${userContext.hasFunds ? `Oui (${userContext.fundsCount})` : 'Non'}
`;

  return basePrompt + (stageContext[stage] || '') + userContextStr;
}
