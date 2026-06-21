import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface UseAIChatProps {
  initialContext?: {
    page: string;
    stage: string;
  };
}

export const useAIChat = ({ initialContext }: UseAIChatProps = {}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [sessionId] = useState(() => crypto.randomUUID());
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  
  const { user } = useAuth();
  const { toast } = useToast();

  // Charger l'historique de conversation
  useEffect(() => {
    if (user) {
      loadConversationHistory();
    } else {
      setIsInitializing(false);
    }
  }, [user?.id]);

  // Mettre à jour les suggestions selon le contexte - utiliser stage directement pour éviter une boucle infinie
  useEffect(() => {
    updateSuggestions(initialContext?.stage || 'discovery');
  }, [initialContext?.stage]);

  const loadConversationHistory = async () => {
    if (!user) {
      setIsInitializing(false);
      return;
    }

    try {
      // Récupérer la dernière conversation active
      const { data: conversation, error: convError } = await supabase
        .from('ai_conversations')
        .select('id')
        .eq('user_id', user.id)
        .order('last_message_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (convError) {
        console.error('Error fetching conversation:', convError);
        setIsInitializing(false);
        return;
      }

      if (conversation) {
        setConversationId(conversation.id);

        // Charger les messages
        const { data: msgs, error: msgsError } = await supabase
          .from('ai_messages')
          .select('id, role, content')
          .eq('conversation_id', conversation.id)
          .order('created_at', { ascending: true })
          .limit(20);

        if (msgsError) {
          console.error('Error fetching messages:', msgsError);
        } else if (msgs) {
          setMessages(msgs.map(m => ({
            id: m.id,
            role: m.role as 'user' | 'assistant',
            content: m.content
          })));
        }
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
    } finally {
      setIsInitializing(false);
    }
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      console.log('📤 Envoi du message:', content);
      
      // Récupérer le conversationId si nécessaire
      let currentConversationId = conversationId;
      
      if (!currentConversationId) {
        const { data: conversations } = await supabase
          .from('ai_conversations')
          .select('id')
          .eq('session_id', sessionId)
          .order('created_at', { ascending: false })
          .limit(1);
        
        if (conversations && conversations.length > 0) {
          currentConversationId = conversations[0].id;
          setConversationId(currentConversationId);
        }
      }

      // Enregistrer le message utilisateur
      await supabase.from('ai_messages').insert({
        conversation_id: currentConversationId,
        role: 'user',
        content,
        page_context: initialContext?.page
      });

      // Appel direct avec streaming - utiliser les variables d'environnement
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      
      console.log('📡 Appel de la fonction edge...');
      
      const response = await fetch(
        `${supabaseUrl}/functions/v1/ai-chat-assistant`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({
            message: content,
            conversationId: currentConversationId,
            sessionId,
            context: initialContext
          }),
        }
      );

      console.log('📥 Réponse reçue, status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erreur inconnue' }));
        console.error('❌ Erreur de la fonction edge:', errorData);
        
        if (response.status === 429) {
          toast({
            title: 'Trop de demandes',
            description: 'Veuillez patienter quelques instants avant de réessayer.',
            variant: 'destructive'
          });
          setMessages(prev => prev.slice(0, -1));
          return;
        }
        if (response.status === 402) {
          toast({
            title: 'Crédits IA épuisés 💛',
            description:
              "L'assistant IA est temporairement indisponible. L'équipe a été notifiée — réessaie un peu plus tard.",
            variant: 'destructive',
          });
          setMessages(prev => prev.slice(0, -1));
          return;
        }
        const err: any = new Error(errorData.error || 'Erreur lors de l\'appel à l\'assistant');
        err.status = response.status;
        throw err;
      }

      // Traiter le streaming SSE
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      let assistantMessageId = crypto.randomUUID();

      // Ajouter un message assistant vide
      setMessages(prev => [...prev, {
        id: assistantMessageId,
        role: 'assistant',
        content: ''
      }]);

      let textBuffer = '';
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const deltaContent = parsed.choices?.[0]?.delta?.content as string | undefined;
            
            if (deltaContent) {
              assistantContent += deltaContent;
              
              // Mettre à jour le message en temps réel
              setMessages(prev => prev.map(msg => 
                msg.id === assistantMessageId
                  ? { ...msg, content: assistantContent }
                  : msg
              ));
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      // Sauvegarder le message de l'assistant
      if (conversationId) {
        await supabase
          .from('ai_messages')
          .insert({
            conversation_id: conversationId,
            role: 'assistant',
            content: assistantContent
          });
      }

    } catch (error: any) {
      console.error('Error sending message:', error);
      
      let errorMessage = "Une erreur est survenue. Veuillez réessayer.";
      
      if (error.message?.includes('Failed to fetch')) {
        errorMessage = "Impossible de contacter le serveur. Vérifiez votre connexion.";
      } else if (error.message?.includes('rate limit')) {
        errorMessage = "Trop de demandes. Veuillez patienter quelques instants.";
      } else if (error.status === 429) {
        errorMessage = "Trop de demandes. Veuillez patienter quelques instants.";
      } else if (error.status === 402) {
        errorMessage = "Service temporairement indisponible.";
      } else if (error.status === 504) {
        errorMessage = "La requête a pris trop de temps. Veuillez réessayer.";
      }
      
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive'
      });
      
      // Retirer le message utilisateur en cas d'erreur
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const markAsHelpful = async (messageId: string, helpful: boolean) => {
    try {
      await supabase
        .from('ai_messages')
        .update({ was_helpful: helpful })
        .eq('id', messageId);

      toast({
        title: helpful ? 'Merci pour votre retour ! 👍' : 'Désolé pour la gêne 😔',
        description: helpful 
          ? 'Nous sommes heureux de vous avoir aidé !' 
          : 'Nous allons améliorer nos réponses.',
      });
    } catch (error) {
      console.error('Error marking message as helpful:', error);
    }
  };

  const updateSuggestions = (stage: string) => {
    const suggestionsByStage: Record<string, string[]> = {
      discovery: [
        'Quels sont les services proposés ?',
        'Comment fonctionne la plateforme ?',
        'C\'est gratuit ?'
      ],
      onboarding: [
        'Quelles informations dois-je fournir ?',
        'Pourquoi ma date d\'anniversaire ?',
        'Comment protégez-vous mes données ?'
      ],
      setup_profile: [
        'Comment ajouter mes amis ?',
        'Pourquoi configurer mes préférences ?',
        'Comment recevoir des cadeaux ?'
      ],
      add_friends: [
        'Mes amis verront-ils mes informations ?',
        'Puis-je inviter des amis pas encore inscrits ?',
        'Comment gérer ma liste d\'amis ?'
      ],
      preferences: [
        'Pourquoi indiquer mes tailles ?',
        'Dois-je tout remplir ?',
        'Qui peut voir mes préférences ?'
      ],
      using_features: [
        'Comment créer une cagnotte ?',
        'Comment contribuer à une cagnotte ?',
        'Comment commander un cadeau ?'
      ],
      advanced: [
        'Comment faire une cagnotte surprise ?',
        'Qu\'est-ce que le système de réciprocité ?',
        'Comment devenir vendeur sur la plateforme ?'
      ]
    };

    setSuggestedQuestions(suggestionsByStage[stage] || suggestionsByStage.discovery);
  };

  const resetConversation = () => {
    setMessages([]);
    setConversationId(null);
    updateSuggestions(initialContext?.stage || 'discovery');
  };

  return {
    messages,
    isLoading,
    isInitializing,
    sendMessage,
    suggestedQuestions,
    markAsHelpful,
    resetConversation
  };
};
