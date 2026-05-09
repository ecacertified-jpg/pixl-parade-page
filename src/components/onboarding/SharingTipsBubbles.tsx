import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const TIPS = [
  { emoji: '🎁', text: 'Plus tu partages, plus tu reçois de cadeaux et de messages d\'amour !' },
  { emoji: '💝', text: 'Tes amis ne devineront pas… sauf si tu leur envoies ta page !' },
  { emoji: '🎉', text: '1 partage = 1 surprise potentielle. Imagine 10 amis, 10 cadeaux !' },
  { emoji: '✨', text: 'Ta page est prête : ne la garde pas secrète, fais vibrer ton cercle !' },
  { emoji: '🥳', text: 'Les meilleurs anniversaires sont ceux qu\'on partage. À toi de jouer !' },
];

interface SharingTipsBubblesProps {
  className?: string;
}

export const SharingTipsBubbles = ({ className }: SharingTipsBubblesProps) => {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % TIPS.length);
    }, 3500);
    return () => clearInterval(id);
  }, [paused]);

  // Met en pause la rotation et masque la bulle pendant le toast festif
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { duration?: number } | undefined;
      const duration = detail?.duration ?? 4000;
      setPaused(true);
      const t = setTimeout(() => setPaused(false), duration);
      return () => clearTimeout(t);
    };
    window.addEventListener('jdv:festive-toast', handler);
    return () => window.removeEventListener('jdv:festive-toast', handler);
  }, []);

  const tip = TIPS[index];

  return (
    <div
      className={cn(
        'w-full max-w-sm mx-auto transition-opacity duration-300',
        paused ? 'opacity-0 pointer-events-none' : 'opacity-100',
        className,
      )}
      aria-hidden={paused}
    >
      <div className="flex items-end gap-2">
        {/* Avatar animé */}
        <motion.div
          animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0 shadow-md text-lg"
          aria-hidden
        >
          🎊
        </motion.div>

        {/* Bulle de chat */}
        <div className="relative flex-1 min-h-[64px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="relative rounded-2xl rounded-bl-sm border border-primary/20 bg-gradient-to-br from-primary/15 via-accent/15 to-heart/15 p-3 shadow-soft"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1], rotate: [0, 15, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -top-1.5 -right-1.5"
                aria-hidden
              >
                <Sparkles className="h-4 w-4 text-accent" />
              </motion.div>
              <p className="text-sm font-nunito text-foreground leading-snug text-left">
                <span className="mr-1">{tip.emoji}</span>
                {tip.text}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Indicateur de défilement */}
      <div className="flex justify-center gap-1.5 mt-2" aria-hidden>
        {TIPS.map((_, i) => (
          <motion.span
            key={i}
            animate={{
              scale: i === index ? 1.2 : 1,
              opacity: i === index ? 1 : 0.4,
            }}
            transition={{ duration: 0.3 }}
            className={cn(
              'h-1.5 w-1.5 rounded-full',
              i === index ? 'bg-primary' : 'bg-muted-foreground/40'
            )}
          />
        ))}
      </div>
    </div>
  );
};