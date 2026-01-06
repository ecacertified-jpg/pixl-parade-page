import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Environment variables
const WHATSAPP_ACCESS_TOKEN = Deno.env.get('WHATSAPP_ACCESS_TOKEN');
const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');
const WHATSAPP_VERIFY_TOKEN = Deno.env.get('WHATSAPP_VERIFY_TOKEN');
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// Rate limiting configuration
const RATE_LIMITS = { requests: 10, windowMs: 60000 }; // 10 req/min per phone
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(phoneNumber: string): boolean {
  const now = Date.now();
  const existing = rateLimitStore.get(phoneNumber);
  
  if (!existing || now > existing.resetTime) {
    rateLimitStore.set(phoneNumber, { count: 1, resetTime: now + RATE_LIMITS.windowMs });
    return true;
  }
  
  if (existing.count >= RATE_LIMITS.requests) {
    return false;
  }
  
  existing.count++;
  return true;
}

// Validate and sanitize user message
const MAX_MESSAGE_LENGTH = 1000;
const INJECTION_PATTERNS = [
  /ignore.*(previous|above|prior).*(instruction|prompt)/i,
  /you are now/i,
  /forget (that |)you/i,
  /system (prompt|message|role)/i,
  /repeat.*(previous|all|system)/i,
  /reveal.*(instruction|prompt|system)/i,
  /act as/i,
  /pretend (to be|you are)/i,
  /disregard/i,
];

function sanitizeMessage(message: string): string {
  let sanitized = message.substring(0, MAX_MESSAGE_LENGTH);
  
  for (const pattern of INJECTION_PATTERNS) {
    sanitized = sanitized.replace(pattern, '[FILTERED]');
  }
  
  return sanitized.replace(/[<>]/g, '');
}

// Send WhatsApp message via Cloud API
async function sendWhatsAppMessage(to: string, message: string): Promise<boolean> {
  try {
    console.log(`📤 Sending WhatsApp message to ${to}`);
    
    // WhatsApp has a 4096 character limit per message
    const truncatedMessage = message.substring(0, 4000);
    
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: to,
          type: 'text',
          text: { body: truncatedMessage }
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ WhatsApp API error:', response.status, errorText);
      return false;
    }

    const result = await response.json();
    console.log('✅ Message sent successfully:', result.messages?.[0]?.id);
    return true;
  } catch (error) {
    console.error('❌ Error sending WhatsApp message:', error);
    return false;
  }
}

// Build system prompt for WhatsApp AI
function buildWhatsAppSystemPrompt(): string {
  return `Tu es l'assistant WhatsApp de JOIE DE VIVRE, une plateforme qui célèbre les moments de bonheur en Côte d'Ivoire.

**RÈGLES IMPORTANTES :**
- Réponds de manière CONCISE (messages courts adaptés au mobile)
- Utilise des emojis 🎁🎉❤️ pour rendre les messages vivants
- Guide vers l'application joiedevivre.ci pour les actions complexes
- Tu vouvoies l'utilisateur
- Tu parles français avec des expressions ivoiriennes quand approprié

**Ta mission :**
- Accueillir chaleureusement les utilisateurs
- Répondre aux questions sur JOIE DE VIVRE
- Expliquer comment offrir des cadeaux et créer des cagnottes
- Inviter à télécharger/visiter l'application

**Fonctionnalités de JOIE DE VIVRE :**
🎁 **Cadeaux** : Commander des cadeaux pour ses proches
💰 **Cagnottes** : Collecter de l'argent ensemble pour un cadeau
❤️ **Liste de souhaits** : Partager ses préférences
👥 **Cercle d'amis** : Ajouter ses proches
🎉 **Occasions** : Anniversaires, mariages, promotions...
🏪 **Business** : Vendre sur la plateforme

**Limites :**
- Tu ne peux pas effectuer de transactions
- Pour les actions (commandes, cagnottes), redirige vers l'app
- Si la question n'est pas liée à JDV, réponds brièvement et ramène sur JDV

Réponds TOUJOURS en français. Sois bref et amical ! 🌟`;
}

// Generate AI response
async function generateAIResponse(messages: any[]): Promise<string> {
  try {
    console.log('🤖 Calling Lovable AI...');
    
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: messages,
        stream: false,
        max_tokens: 500 // Keep responses short for WhatsApp
      }),
    });

    if (!response.ok) {
      console.error('❌ AI API error:', response.status);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiMessage = data.choices?.[0]?.message?.content || 
      "Désolé, je n'ai pas pu générer une réponse. Visitez joiedevivre.ci pour plus d'aide ! 🎁";
    
    console.log('✅ AI response generated');
    return aiMessage;
  } catch (error) {
    console.error('❌ Error generating AI response:', error);
    return "Oops ! 😅 Une erreur s'est produite. Réessayez ou visitez joiedevivre.ci pour de l'aide.";
  }
}

serve(async (req) => {
  const url = new URL(req.url);
  console.log(`🔵 ${req.method} request to WhatsApp webhook`);

  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Initialize Supabase with service role for database operations
  const supabase = createClient(
    SUPABASE_URL ?? '',
    SUPABASE_SERVICE_ROLE_KEY ?? ''
  );

  // ============ WEBHOOK VERIFICATION (GET) ============
  if (req.method === 'GET') {
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    console.log('🔐 Webhook verification request:', { mode, token: token?.substring(0, 10) + '...' });

    if (mode === 'subscribe' && token === WHATSAPP_VERIFY_TOKEN) {
      console.log('✅ Webhook verified successfully');
      return new Response(challenge, { 
        status: 200,
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    console.log('❌ Webhook verification failed');
    return new Response('Forbidden', { status: 403 });
  }

  // ============ MESSAGE HANDLING (POST) ============
  if (req.method === 'POST') {
    try {
      const body = await req.json();
      console.log('📨 Webhook payload received');

      // Validate it's a WhatsApp message
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;
      
      if (!value) {
        console.log('⚠️ No value in webhook payload');
        return new Response('OK', { status: 200, headers: corsHeaders });
      }

      // Handle message status updates
      if (value.statuses) {
        console.log('📊 Status update received:', value.statuses[0]?.status);
        
        const status = value.statuses[0];
        if (status?.id) {
          // Update message status in database
          await supabase
            .from('whatsapp_messages')
            .update({ status: status.status })
            .eq('whatsapp_message_id', status.id);
        }
        
        return new Response('OK', { status: 200, headers: corsHeaders });
      }

      // Handle incoming messages
      const message = value.messages?.[0];
      if (!message) {
        console.log('⚠️ No message in webhook payload');
        return new Response('OK', { status: 200, headers: corsHeaders });
      }

      const senderPhone = message.from;
      const messageText = message.text?.body || '';
      const messageId = message.id;
      const messageType = message.type || 'text';

      console.log(`📩 Message from ${senderPhone}: "${messageText.substring(0, 50)}..."`);

      // Check rate limit
      if (!checkRateLimit(senderPhone)) {
        console.log(`⚠️ Rate limit exceeded for ${senderPhone}`);
        await sendWhatsAppMessage(
          senderPhone,
          "Vous envoyez des messages trop rapidement. 😅 Veuillez patienter quelques secondes."
        );
        return new Response('OK', { status: 200, headers: corsHeaders });
      }

      // Get or create conversation
      let { data: conversation } = await supabase
        .from('whatsapp_conversations')
        .select('*')
        .eq('phone_number', senderPhone)
        .single();

      if (!conversation) {
        // Extract display name from contacts if available
        const contactName = value.contacts?.[0]?.profile?.name;
        
        const { data: newConv, error: convError } = await supabase
          .from('whatsapp_conversations')
          .insert({
            phone_number: senderPhone,
            display_name: contactName,
            status: 'active'
          })
          .select()
          .single();

        if (convError) {
          console.error('❌ Error creating conversation:', convError);
          return new Response('OK', { status: 200, headers: corsHeaders });
        }

        conversation = newConv;
        console.log('📝 Created new conversation:', conversation.id);
      }

      // Save incoming message
      const { error: msgError } = await supabase
        .from('whatsapp_messages')
        .insert({
          conversation_id: conversation.id,
          direction: 'inbound',
          content: messageText,
          message_type: messageType,
          whatsapp_message_id: messageId,
          status: 'delivered'
        });

      if (msgError) {
        console.error('❌ Error saving message:', msgError);
      }

      // Get message history for context (last 10 messages)
      const { data: messageHistory } = await supabase
        .from('whatsapp_messages')
        .select('direction, content')
        .eq('conversation_id', conversation.id)
        .order('created_at', { ascending: true })
        .limit(10);

      // Build messages for AI
      const aiMessages = [
        { role: "system", content: buildWhatsAppSystemPrompt() },
        ...(messageHistory || []).map(m => ({
          role: m.direction === 'inbound' ? 'user' : 'assistant',
          content: m.content
        })),
        { role: "user", content: `[USER_MESSAGE]${sanitizeMessage(messageText)}[/USER_MESSAGE]` }
      ];

      // Generate AI response
      const aiResponse = await generateAIResponse(aiMessages);

      // Save outgoing message
      const { data: savedOutMsg } = await supabase
        .from('whatsapp_messages')
        .insert({
          conversation_id: conversation.id,
          direction: 'outbound',
          content: aiResponse,
          message_type: 'text',
          status: 'sent'
        })
        .select()
        .single();

      // Send response via WhatsApp
      const sent = await sendWhatsAppMessage(senderPhone, aiResponse);
      
      if (sent && savedOutMsg) {
        // Update with WhatsApp message ID after successful send
        // Note: The actual WhatsApp message ID comes from the send response
        await supabase
          .from('whatsapp_messages')
          .update({ status: 'sent' })
          .eq('id', savedOutMsg.id);
      }

      console.log('✅ Message processed successfully');
      return new Response('OK', { status: 200, headers: corsHeaders });

    } catch (error) {
      console.error('❌ Error processing webhook:', error);
      // Always return 200 to prevent Meta from retrying
      return new Response('OK', { status: 200, headers: corsHeaders });
    }
  }

  return new Response('Method not allowed', { status: 405, headers: corsHeaders });
});
