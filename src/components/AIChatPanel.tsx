import { useState, useRef, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, Send, ThumbsUp, ThumbsDown, X, RotateCcw, Loader2, Bot, Star } from 'lucide-react';
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

// Déterminer l'étape selon l'URL
function determineStage(pathname: string): string {
  if (pathname === '/auth') return 'onboarding';
  if (pathname === '/dashboard') return 'setup_profile';
  if (pathname.includes('preferences')) return 'preferences';
  if (pathname.includes('gifts') || pathname.includes('shop')) return 'using_features';
  return 'discovery';
}

export const AIChatPanel = ({ onClose }: AIChatPanelProps) => {
  const [inputValue, setInputValue] = useState('');
  const [showResetDialog, setShowResetDialog] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  
  // Mémoriser le stage pour éviter les recalculs
  const stage = useMemo(() => determineStage(location.pathname), [location.pathname]);
  
  const { 
    messages, 
    isLoading, 
    isInitializing,
    sendMessage, 
    suggestedQuestions,
    markAsHelpful,
    resetConversation
  } = useAIChat({
    initialContext: {
      page: location.pathname,
      stage
    }
  });

  // Auto-scroll vers le bas
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
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
    <Card className="w-full md:w-[400px] h-[520px] md:h-[620px] max-h-[calc(100vh-200px)] flex flex-col shadow-2xl border-0 overflow-hidden bg-gradient-to-b from-white to-violet-50/30">
      {/* Header avec effet glassmorphism et particules */}
      <div className="relative bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 p-4 text-white overflow-hidden">
        {/* Particules décoratives */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{ y: [-10, 10, -10], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute top-2 left-8"
          >
            <Star className="h-3 w-3 text-white/40" />
          </motion.div>
          <motion.div
            animate={{ y: [10, -10, 10], opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 3, repeat: Infinity, delay: 1 }}
            className="absolute top-6 right-16"
          >
            <Star className="h-2 w-2 text-white/30" />
          </motion.div>
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 5, repeat: Infinity }}
            className="absolute bottom-2 left-1/3"
          >
            <Sparkles className="h-4 w-4 text-white/20" />
          </motion.div>
        </div>

        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div 
              className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center ring-2 ring-white/30"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <motion.div
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Sparkles className="h-5 w-5" />
              </motion.div>
            </motion.div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm">Assistant JOIE DE VIVRE</h3>
                <span className="px-1.5 py-0.5 bg-white/20 rounded text-[10px] font-medium backdrop-blur-sm">IA</span>
              </div>
              <div className="flex items-center gap-1.5">
                <motion.span 
                  className="h-2 w-2 bg-green-400 rounded-full"
                  animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                <p className="text-xs opacity-90">En ligne</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowResetDialog(true)}
              className="text-white hover:bg-white/20 h-8 w-8 backdrop-blur-sm transition-all duration-200 hover:scale-110"
              title="Réinitialiser la conversation"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-white/20 h-8 w-8 backdrop-blur-sm transition-all duration-200 hover:scale-110"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-transparent to-violet-50/20"
      >
        {isInitializing ? (
          <div className="flex items-center justify-center h-full">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Loader2 className="h-8 w-8 text-violet-500" />
            </motion.div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.length === 0 && (
              <WelcomeMessage onQuickAction={handleQuickAction} />
            )}

          <AnimatePresence>
            {messages.map((msg, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className={`max-w-[85%] rounded-2xl p-3.5 shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-violet-500/20'
                      : 'bg-white/80 backdrop-blur-sm text-gray-900 border border-violet-100 shadow-violet-100/50'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  
                  {/* Feedback buttons pour les messages de l'assistant */}
                  {msg.role === 'assistant' && index === messages.length - 1 && !isLoading && (
                    <div className="flex gap-3 mt-2.5 pt-2.5 border-t border-violet-100">
                      <motion.button
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => markAsHelpful(msg.id, true)}
                        className="text-gray-400 hover:text-green-500 transition-colors"
                      >
                        <ThumbsUp className="h-3.5 w-3.5" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => markAsHelpful(msg.id, false)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <ThumbsDown className="h-3.5 w-3.5" />
                      </motion.button>
                    </div>
                  )}
                </motion.div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing indicator amélioré */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-violet-100 shadow-sm">
                <div className="flex gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="h-2.5 w-2.5 bg-gradient-to-br from-violet-400 to-purple-500 rounded-full"
                      animate={{ y: [-2, 2, -2] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

            {/* Suggested Questions améliorées */}
            {suggestedQuestions.length > 0 && !isLoading && messages.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2 mt-4"
              >
                <p className="text-xs text-violet-600 font-semibold flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  Questions suggérées
                </p>
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
                      className="w-full text-left justify-start text-xs h-auto py-2.5 bg-white/60 backdrop-blur-sm border-violet-200 hover:bg-violet-50 hover:border-violet-300 transition-all duration-200"
                    >
                      {q}
                    </Button>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* Input zone redesignée */}
      <div className="p-4 bg-white/80 backdrop-blur-sm border-t border-violet-100">
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Posez votre question..."
              disabled={isLoading}
              className="flex-1 bg-violet-50/50 border-violet-200 focus:border-violet-400 focus:ring-violet-400/20 rounded-xl pl-4 pr-4 py-2.5 placeholder:text-violet-400"
            />
          </div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={handleSend}
              disabled={!inputValue.trim() || isLoading}
              size="icon"
              className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-lg shadow-violet-500/30 transition-all duration-200"
            >
              <Send className="h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Dialog de confirmation */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent className="border-violet-200">
          <AlertDialogHeader>
            <AlertDialogTitle>Réinitialiser la conversation ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action supprimera tout l'historique de la conversation actuelle. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetConfirm} className="bg-violet-500 hover:bg-violet-600">
              Réinitialiser
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

// Message de bienvenue avec design glassmorphism
const WelcomeMessage = ({ onQuickAction }: { onQuickAction: (q: string) => void }) => {
  const quickActions = [
    { emoji: '🎁', label: 'Offrir un cadeau', action: 'Comment puis-je offrir un cadeau sur JOIE DE VIVRE ?', color: 'from-pink-400 to-rose-500' },
    { emoji: '💰', label: 'Créer une cagnotte', action: 'Qu\'est-ce qu\'une cagnotte collaborative et comment ça marche ?', color: 'from-amber-400 to-orange-500' },
    { emoji: '👥', label: 'Ajouter des amis', action: 'Comment ajouter mes amis sur la plateforme ?', color: 'from-blue-400 to-cyan-500' },
    { emoji: '⚙️', label: 'Mes préférences', action: 'Comment configurer mes préférences de cadeaux ?', color: 'from-violet-400 to-purple-500' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-5"
    >
      {/* Message de bienvenue avec glassmorphism */}
      <motion.div 
        className="relative bg-white/70 backdrop-blur-md rounded-2xl p-5 border border-violet-200/50 shadow-xl shadow-violet-500/10 overflow-hidden"
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        {/* Gradient décoratif */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-violet-200/40 to-pink-200/40 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
        
        <div className="relative flex items-start gap-4">
          {/* Avatar animé */}
          <motion.div 
            className="relative flex-shrink-0"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <div className="h-14 w-14 rounded-full bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Bot className="h-7 w-7 text-white" />
            </div>
            {/* Ring lumineux */}
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-violet-400/50"
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.div>
          
          <div className="flex-1">
            <motion.h4 
              className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-pink-600 mb-1.5 text-lg"
              animate={{ backgroundPosition: ['0%', '100%', '0%'] }}
              transition={{ duration: 5, repeat: Infinity }}
            >
              Bienvenue sur JOIE DE VIVRE ! ✨
            </motion.h4>
            <p className="text-sm text-gray-600 leading-relaxed">
              Je suis votre assistant virtuel. Comment puis-je vous aider aujourd'hui ?
            </p>
          </div>
        </div>
      </motion.div>

      {/* Séparateur décoratif */}
      <div className="flex items-center gap-3 px-2">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-violet-300 to-transparent" />
        <Sparkles className="h-3 w-3 text-violet-400" />
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-violet-300 to-transparent" />
      </div>

      {/* Cartes d'actions avec animations staggered */}
      <div className="grid grid-cols-2 gap-3">
        {quickActions.map((action, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
          >
            <motion.button
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onQuickAction(action.action)}
              className="w-full h-auto py-4 px-3 flex flex-col items-center gap-2.5 text-center bg-white/60 backdrop-blur-sm rounded-xl border border-violet-200/50 hover:border-violet-300 hover:bg-white/80 transition-all duration-300 shadow-sm hover:shadow-lg hover:shadow-violet-500/10 group"
            >
              <motion.div 
                className={`h-11 w-11 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center shadow-md`}
                whileHover={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 0.5 }}
              >
                <span className="text-2xl filter drop-shadow-sm">{action.emoji}</span>
              </motion.div>
              <span className="text-xs font-medium text-gray-700 group-hover:text-violet-700 transition-colors">
                {action.label}
              </span>
            </motion.button>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
