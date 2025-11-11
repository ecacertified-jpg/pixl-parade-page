import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, Send, ThumbsUp, ThumbsDown, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAIChat } from '@/hooks/useAIChat';
import { useLocation } from 'react-router-dom';

interface AIChatPanelProps {
  onClose: () => void;
}

export const AIChatPanel = ({ onClose }: AIChatPanelProps) => {
  const [inputValue, setInputValue] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  
  const { 
    messages, 
    isLoading, 
    sendMessage, 
    suggestedQuestions,
    markAsHelpful 
  } = useAIChat({
    initialContext: {
      page: location.pathname,
      stage: determineStage(location.pathname)
    }
  });

  // Auto-scroll vers le bas
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;
    
    await sendMessage(inputValue);
    setInputValue('');
  };

  const handleQuickAction = async (question: string) => {
    await sendMessage(question);
  };

  return (
    <Card className="w-full md:w-[380px] h-[500px] md:h-[600px] max-h-[calc(100vh-200px)] flex flex-col shadow-2xl border-2 border-primary/20 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-500 to-purple-600 p-4 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Assistant JOIE DE VIVRE</h3>
            <p className="text-xs opacity-90">En ligne</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-white hover:bg-white/20"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 && (
            <WelcomeMessage onQuickAction={handleQuickAction} />
          )}

          <AnimatePresence>
            {messages.map((msg, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    msg.role === 'user'
                      ? 'bg-violet-500 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  
                  {/* Feedback buttons pour les messages de l'assistant */}
                  {msg.role === 'assistant' && index === messages.length - 1 && !isLoading && (
                    <div className="flex gap-2 mt-2 pt-2 border-t border-gray-200">
                      <button
                        onClick={() => markAsHelpful(msg.id, true)}
                        className="text-gray-500 hover:text-green-600 transition-colors"
                      >
                        <ThumbsUp className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => markAsHelpful(msg.id, false)}
                        className="text-gray-500 hover:text-red-600 transition-colors"
                      >
                        <ThumbsDown className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing indicator */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-gray-100 rounded-lg p-3">
                <div className="flex gap-1">
                  <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </motion.div>
          )}

          {/* Suggested Questions */}
          {suggestedQuestions.length > 0 && !isLoading && messages.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-gray-500 font-medium">Questions suggérées :</p>
              {suggestedQuestions.map((q, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAction(q)}
                  className="w-full text-left justify-start text-xs h-auto py-2"
                >
                  {q}
                </Button>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Posez votre question..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading}
            size="icon"
            className="bg-violet-500 hover:bg-violet-600"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

// Message de bienvenue avec actions rapides
const WelcomeMessage = ({ onQuickAction }: { onQuickAction: (q: string) => void }) => {
  const quickActions = [
    { emoji: '🎁', label: 'Comment offrir un cadeau ?', action: 'Comment puis-je offrir un cadeau sur JOIE DE VIVRE ?' },
    { emoji: '💰', label: 'Qu\'est-ce qu\'une cagnotte ?', action: 'Qu\'est-ce qu\'une cagnotte collaborative et comment ça marche ?' },
    { emoji: '👥', label: 'Ajouter des amis', action: 'Comment ajouter mes amis sur la plateforme ?' },
    { emoji: '⚙️', label: 'Configurer mes préférences', action: 'Comment configurer mes préférences de cadeaux ?' },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-lg p-4 border border-violet-200">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-1">
              Bienvenue sur JOIE DE VIVRE ! 🎉
            </h4>
            <p className="text-sm text-gray-600">
              Je suis votre assistant virtuel. Comment puis-je vous aider aujourd'hui ?
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {quickActions.map((action, i) => (
          <Button
            key={i}
            variant="outline"
            onClick={() => onQuickAction(action.action)}
            className="h-auto py-3 flex flex-col items-center gap-1 text-center"
          >
            <span className="text-2xl">{action.emoji}</span>
            <span className="text-xs">{action.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
};

// Déterminer l'étape selon l'URL
function determineStage(pathname: string): string {
  if (pathname === '/auth') return 'onboarding';
  if (pathname === '/dashboard') return 'setup_profile';
  if (pathname.includes('preferences')) return 'preferences';
  if (pathname.includes('gifts') || pathname.includes('shop')) return 'using_features';
  return 'discovery';
}
