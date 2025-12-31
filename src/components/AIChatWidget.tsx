import { useState, useEffect } from 'react';
import { MessageCircle, X, Sparkles, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { AIChatPanel } from './AIChatPanel';
import { useAuth } from '@/contexts/AuthContext';

const getTimeBasedGreeting = () => {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 12) {
    return {
      greeting: "Bonjour",
      emoji: "☀️",
      message: "Trouvez le cadeau idéal !",
      subEmoji: "🌅"
    };
  } else if (hour >= 12 && hour < 18) {
    return {
      greeting: "Bon après-midi",
      emoji: "🌤️",
      message: "Besoin d'une idée cadeau ?",
      subEmoji: "🎁"
    };
  } else {
    return {
      greeting: "Bonsoir",
      emoji: "🌙",
      message: "Explorez nos idées cadeaux !",
      subEmoji: "✨"
    };
  }
};

export const AIChatWidget = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [greeting, setGreeting] = useState(getTimeBasedGreeting());
  const [displayedText, setDisplayedText] = useState('');
  const [isTypingComplete, setIsTypingComplete] = useState(false);

  // Get user's first name if logged in
  const userName = user?.user_metadata?.full_name?.split(' ')[0] || 
                   user?.user_metadata?.name?.split(' ')[0] || 
                   user?.email?.split('@')[0];
  const isLoggedIn = !!user;

  // Update greeting when component mounts or becomes visible
  useEffect(() => {
    setGreeting(getTimeBasedGreeting());
  }, [showWelcome]);

  // Typing animation effect with personalized message
  useEffect(() => {
    if (showWelcome && !isOpen) {
      let fullText: string;
      
      if (isLoggedIn && userName) {
        fullText = `${userName}, ${greeting.message}`;
      } else {
        fullText = greeting.message;
      }
      
      setDisplayedText('');
      setIsTypingComplete(false);
      
      let currentIndex = 0;
      const typingInterval = setInterval(() => {
        if (currentIndex < fullText.length) {
          setDisplayedText(fullText.slice(0, currentIndex + 1));
          currentIndex++;
        } else {
          setIsTypingComplete(true);
          clearInterval(typingInterval);
        }
      }, 30);

      return () => clearInterval(typingInterval);
    }
  }, [showWelcome, isOpen, greeting.message, isLoggedIn, userName]);

  // Listen for custom events to open chat (from birthday notifications, etc.)
  useEffect(() => {
    const handleOpenChat = () => {
      setIsOpen(true);
      setHasNewMessage(false);
      setShowWelcome(false);
    };
    
    window.addEventListener('openAIChat', handleOpenChat);
    return () => window.removeEventListener('openAIChat', handleOpenChat);
  }, []);

  // Afficher le message de bienvenue après 3 secondes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isOpen) {
        setShowWelcome(true);
        setHasNewMessage(true);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    setHasNewMessage(false);
    setShowWelcome(false);
  };

  const handleStartChat = () => {
    setShowWelcome(false);
    setIsOpen(true);
    setHasNewMessage(false);
  };

  return (
    <>
      {/* Widget Container */}
      <div className="fixed bottom-20 md:bottom-4 right-4 z-50">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="mb-4"
            >
              <AIChatPanel onClose={() => setIsOpen(false)} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Button */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            onClick={handleToggle}
            size="icon"
            className="h-14 w-14 rounded-full shadow-lg bg-gradient-to-br from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 relative"
          >
            {isOpen ? (
              <X className="h-6 w-6 text-white" />
            ) : (
              <>
                <MessageCircle className="h-6 w-6 text-white" />
                {hasNewMessage && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full animate-pulse" />
                )}
              </>
            )}
          </Button>
        </motion.div>

        {/* Welcome Message Bubble - Enhanced Design */}
        <AnimatePresence>
          {showWelcome && !isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, x: 20 }}
              animate={{ 
                opacity: 1, 
                scale: 1, 
                x: 0,
                y: [0, -4, 0]
              }}
              exit={{ opacity: 0, scale: 0.8, x: 20 }}
              transition={{ 
                type: "spring",
                damping: 15,
                stiffness: 300,
                y: {
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }
              }}
              className="absolute bottom-20 right-0 mr-2"
            >
              {/* Glassmorphism Card */}
              <div className="relative bg-white/95 dark:bg-card/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-violet-500/20 border border-violet-200/50 dark:border-violet-500/20 p-4 max-w-[280px] overflow-hidden">
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-pink-500/5 pointer-events-none" />
                
                {/* Close button - Taille augmentée pour meilleure accessibilité */}
                <button
                  onClick={() => setShowWelcome(false)}
                  className="absolute top-1 right-1 p-2.5 rounded-full bg-muted/80 hover:bg-destructive/20 hover:text-destructive transition-all duration-200 z-10 min-w-[44px] min-h-[44px] flex items-center justify-center"
                  aria-label="Fermer le message de bienvenue"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>

                {/* Content */}
                <div className="relative z-10">
                  {/* Header with animated emoji */}
                  <div className="flex items-center gap-2 mb-3">
                    <motion.span
                      animate={{ rotate: [0, 14, -8, 14, -4, 10, 0] }}
                      transition={{ 
                        duration: 2.5, 
                        repeat: Infinity, 
                        repeatDelay: 1 
                      }}
                      className="text-xl"
                    >
                      {greeting.emoji}
                    </motion.span>
                    <h3 className="font-bold text-lg bg-gradient-to-r from-violet-600 to-pink-500 bg-clip-text text-transparent">
                      {greeting.greeting} !
                    </h3>
                  </div>

                  {/* Avatar and message */}
                  <div className="flex items-start gap-3">
                    {/* Enhanced Avatar with glow */}
                    <div className="relative flex-shrink-0">
                      <motion.div
                        animate={{ 
                          boxShadow: [
                            "0 0 0 0 rgba(139, 92, 246, 0.4)",
                            "0 0 0 8px rgba(139, 92, 246, 0)",
                          ]
                        }}
                        transition={{ 
                          duration: 1.5, 
                          repeat: Infinity 
                        }}
                        className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 flex items-center justify-center"
                      >
                        <motion.div
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <Sparkles className="h-5 w-5 text-white" />
                        </motion.div>
                      </motion.div>
                      {/* Glow ring */}
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-400 to-pink-400 blur-md opacity-40 -z-10" />
                    </div>

                    {/* Message text with typing animation */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground leading-relaxed">
                        {displayedText}
                        {!isTypingComplete && (
                          <motion.span
                            animate={{ opacity: [1, 0] }}
                            transition={{ duration: 0.5, repeat: Infinity }}
                            className="inline-block w-0.5 h-4 bg-violet-500 ml-0.5 align-middle"
                          />
                        )}
                        {isTypingComplete && <span className="ml-1">{greeting.subEmoji}</span>}
                      </p>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleStartChat}
                    className="w-full mt-4 py-2.5 px-4 rounded-xl bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-violet-500/25 transition-all duration-200 whitespace-nowrap"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Discutons !
                    <motion.div
                      animate={{ x: [0, 4, 0] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      <Send className="h-3.5 w-3.5" />
                    </motion.div>
                  </motion.button>
                </div>

                {/* Speech bubble tail */}
                <div className="absolute -bottom-2 right-6 w-4 h-4 bg-white/95 dark:bg-card/95 border-r border-b border-violet-200/50 dark:border-violet-500/20 transform rotate-45" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};
