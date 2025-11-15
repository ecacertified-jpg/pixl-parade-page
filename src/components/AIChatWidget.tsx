import { useState, useEffect } from 'react';
import { MessageCircle, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { AIChatPanel } from './AIChatPanel';

export const AIChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

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

        {/* Welcome Message Bubble */}
        <AnimatePresence>
          {showWelcome && !isOpen && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="absolute bottom-16 right-0 bg-background border-2 border-primary/20 rounded-2xl shadow-2xl p-4 max-w-[280px] mr-2"
            >
              <button
                onClick={() => setShowWelcome(false)}
                className="absolute -top-2 -right-2 bg-muted hover:bg-muted/80 rounded-full p-1.5 shadow-md transition-colors"
                aria-label="Fermer"
              >
                <X className="h-3.5 w-3.5 text-foreground" />
              </button>
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 pt-0.5">
                  <p className="text-base font-semibold text-foreground mb-1.5">
                    Besoin d'aide ? 👋
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Je suis là pour vous guider sur JOIE DE VIVRE !
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};
