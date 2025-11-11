import { useState, useEffect } from 'react';
import { MessageCircle, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { AIChatPanel } from './AIChatPanel';

export const AIChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

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
      <div className="fixed bottom-4 right-4 z-50">
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
              className="absolute bottom-16 right-0 bg-white rounded-lg shadow-xl p-3 max-w-xs mr-2"
            >
              <button
                onClick={() => setShowWelcome(false)}
                className="absolute -top-2 -right-2 bg-gray-200 rounded-full p-1 hover:bg-gray-300"
              >
                <X className="h-3 w-3" />
              </button>
              <div className="flex items-start gap-2">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Besoin d'aide ? 👋
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
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
