import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, Send, ThumbsUp, ThumbsDown, X, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAIChat } from '@/hooks/useAIChat';
import { useLocation } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface AIChatPanelProps {
  onClose: () => void;
}

export const AIChatPanel = ({ onClose }: AIChatPanelProps) => {
  const [inputValue, setInputValue] = useState('');
  const [showResetDialog, setShowResetDialog] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  
  const { 
    messages, 
    isLoading, 
    sendMessage, 
    suggestedQuestions,
    markAsHelpful,
    resetConversation
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

  const handleResetConfirm = () => {
    resetConversation();
    setShowResetDialog(false);
  };

  return (
    <Card className="w-full md:w-[400px] h-[550px] md:h-[650px] max-h-[calc(100vh-150px)] flex flex-col shadow-2xl border border-primary/10 overflow-hidden rounded-2xl backdrop-blur-sm">
      {/* Header */}
      <div className="bg-gradient-to-br from-violet-500 via-purple-600 to-fuchsia-600 p-5 text-white flex items-center justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent_50%)]" />
        <div className="flex items-center gap-3 relative z-10">
          <motion.div 
            className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg ring-2 ring-white/30"
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            <Sparkles className="h-5 w-5" />
          </motion.div>
          <div>
            <h3 className="font-bold text-base">Assistant JOIE DE VIVRE</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="h-2 w-2 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50" />
              <p className="text-xs opacity-95 font-medium">En ligne</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 relative z-10">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowResetDialog(true)}
            className="text-white hover:bg-white/20 h-9 w-9 rounded-lg transition-all hover:scale-105"
            title="Réinitialiser la conversation"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white hover:bg-white/20 h-9 w-9 rounded-lg transition-all hover:scale-105"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollRef} className="flex-1 p-4 bg-gradient-to-b from-background via-muted/5 to-background">
        <div className="space-y-4">
          {messages.length === 0 && (
            <WelcomeMessage onQuickAction={handleQuickAction} />
          )}

          <AnimatePresence mode="popLayout">
            {messages.map((msg, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-br from-violet-500 to-purple-600 text-white'
                      : 'bg-muted/80 backdrop-blur-sm text-foreground border border-border/50'
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  
                  {/* Feedback buttons pour les messages de l'assistant */}
                  {msg.role === 'assistant' && index === messages.length - 1 && !isLoading && (
                    <motion.div 
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex gap-2 mt-3 pt-3 border-t border-border/50"
                    >
                      <button
                        onClick={() => markAsHelpful(msg.id, true)}
                        className="text-muted-foreground hover:text-green-600 transition-all hover:scale-110"
                        title="Utile"
                      >
                        <ThumbsUp className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => markAsHelpful(msg.id, false)}
                        className="text-muted-foreground hover:text-red-600 transition-all hover:scale-110"
                        title="Pas utile"
                      >
                        <ThumbsDown className="h-4 w-4" />
                      </button>
                    </motion.div>
                  )}
                </motion.div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing indicator */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex justify-start"
            >
              <div className="bg-muted/80 backdrop-blur-sm rounded-2xl p-4 border border-border/50 shadow-sm">
                <div className="flex gap-1.5">
                  <motion.span 
                    className="h-2.5 w-2.5 bg-violet-500 rounded-full" 
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                  />
                  <motion.span 
                    className="h-2.5 w-2.5 bg-purple-500 rounded-full" 
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                  />
                  <motion.span 
                    className="h-2.5 w-2.5 bg-fuchsia-500 rounded-full" 
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Suggested Questions */}
          {suggestedQuestions.length > 0 && !isLoading && messages.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2 pt-2"
            >
              <p className="text-xs text-muted-foreground font-semibold">Questions suggérées :</p>
              {suggestedQuestions.map((q, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickAction(q)}
                    className="w-full text-left justify-start text-xs h-auto py-3 hover:bg-primary/5 hover:border-primary/30 transition-all hover:scale-[1.02] rounded-xl"
                  >
                    {q}
                  </Button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Posez votre question..."
            disabled={isLoading}
            className="flex-1 rounded-xl border-border/50 focus:border-primary/50 bg-background"
          />
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={handleSend}
              disabled={!inputValue.trim() || isLoading}
              size="icon"
              className="bg-gradient-to-br from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 rounded-xl shadow-lg h-10 w-10"
            >
              <Send className="h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Dialog de confirmation */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Réinitialiser la conversation ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action supprimera tout l'historique de la conversation actuelle. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetConfirm}>
              Réinitialiser
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-5"
    >
      <div className="bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 dark:from-violet-950/20 dark:via-purple-950/20 dark:to-fuchsia-950/20 rounded-2xl p-5 border-2 border-violet-200/50 dark:border-violet-800/50 shadow-lg">
        <div className="flex items-start gap-4">
          <motion.div 
            className="h-12 w-12 rounded-full bg-gradient-to-br from-violet-500 via-purple-600 to-fuchsia-600 flex items-center justify-center flex-shrink-0 shadow-lg"
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            <Sparkles className="h-6 w-6 text-white" />
          </motion.div>
          <div className="flex-1">
            <h4 className="font-bold text-foreground mb-2 text-lg">
              Bienvenue sur JOIE DE VIVRE ! 🎉
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Je suis votre assistant virtuel. Comment puis-je vous aider aujourd'hui ?
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {quickActions.map((action, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1, duration: 0.3 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              variant="outline"
              onClick={() => onQuickAction(action.action)}
              className="h-auto py-4 flex flex-col items-center gap-2 text-center rounded-xl border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all shadow-sm hover:shadow-md"
            >
              <span className="text-3xl">{action.emoji}</span>
              <span className="text-xs font-medium leading-tight">{action.label}</span>
            </Button>
          </motion.div>
        ))}
      </div>
    </motion.div>
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
