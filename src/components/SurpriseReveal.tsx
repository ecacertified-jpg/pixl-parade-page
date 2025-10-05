import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Gift, Music, Heart, Users } from "lucide-react";
import confetti from "canvas-confetti";

interface SurpriseRevealProps {
  fundTitle: string;
  surpriseMessage: string;
  totalAmount: number;
  contributorsCount: number;
  contributors: Array<{
    id: string;
    name: string;
    avatar?: string;
  }>;
  audioUrl?: string;
  onClose?: () => void;
}

export const SurpriseReveal = ({
  fundTitle,
  surpriseMessage,
  totalAmount,
  contributorsCount,
  contributors,
  audioUrl,
  onClose
}: SurpriseRevealProps) => {
  const [step, setStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    // Animation d'entrée avec confettis
    const timer1 = setTimeout(() => {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      setStep(1);
    }, 500);

    const timer2 = setTimeout(() => setStep(2), 2000);
    const timer3 = setTimeout(() => setStep(3), 4000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  const handlePlayAudio = () => {
    if (!audioUrl) return;
    
    const audio = new Audio(audioUrl);
    audio.play();
    setIsPlaying(true);
    
    audio.onended = () => setIsPlaying(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <AnimatePresence>
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: "spring" }}
          className="max-w-2xl w-full mx-4"
        >
          <Card className="p-8 bg-gradient-to-br from-primary/20 via-background to-primary/10 border-2 border-primary">
            <div className="space-y-6 text-center">
              {/* Étape 1: Icône animée */}
              <AnimatePresence>
                {step >= 1 && (
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ duration: 0.6, type: "spring", bounce: 0.5 }}
                    className="flex justify-center"
                  >
                    <div className="p-6 rounded-full bg-primary/20">
                      <Gift className="h-16 w-16 text-primary animate-bounce" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Étape 2: Titre surprise */}
              <AnimatePresence>
                {step >= 2 && (
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="space-y-2"
                  >
                    <h1 className="text-4xl font-bold flex items-center justify-center gap-3">
                      <Sparkles className="h-8 w-8 text-primary animate-pulse" />
                      SURPRISE !
                      <Sparkles className="h-8 w-8 text-primary animate-pulse" />
                    </h1>
                    <p className="text-xl font-semibold text-primary">{fundTitle}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Étape 3: Message et détails */}
              <AnimatePresence>
                {step >= 3 && (
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="space-y-6"
                  >
                    {/* Message personnalisé */}
                    <div className="p-6 rounded-lg bg-background/50 border border-primary/30">
                      <p className="text-lg leading-relaxed whitespace-pre-wrap">
                        {surpriseMessage}
                      </p>
                    </div>

                    {/* Montant collecté */}
                    <div className="flex items-center justify-center gap-4 p-4 rounded-lg bg-primary/10">
                      <Heart className="h-6 w-6 text-primary" />
                      <div>
                        <div className="text-3xl font-bold text-primary">
                          {totalAmount.toLocaleString()} XOF
                        </div>
                        <div className="text-sm text-muted-foreground">
                          collectés avec amour
                        </div>
                      </div>
                    </div>

                    {/* Contributeurs */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>Grâce à {contributorsCount} personne{contributorsCount > 1 ? 's' : ''} généreuse{contributorsCount > 1 ? 's' : ''}</span>
                      </div>
                      
                      <div className="flex flex-wrap justify-center gap-2">
                        {contributors.slice(0, 10).map((contributor) => (
                          <div
                            key={contributor.id}
                            className="flex items-center gap-2 px-3 py-2 rounded-full bg-primary/10 border border-primary/20"
                          >
                            {contributor.avatar ? (
                              <img
                                src={contributor.avatar}
                                alt={contributor.name}
                                className="h-6 w-6 rounded-full"
                              />
                            ) : (
                              <div className="h-6 w-6 rounded-full bg-primary/30 flex items-center justify-center text-xs font-bold">
                                {contributor.name.charAt(0)}
                              </div>
                            )}
                            <span className="text-sm font-medium">{contributor.name}</span>
                          </div>
                        ))}
                        {contributorsCount > 10 && (
                          <div className="px-3 py-2 rounded-full bg-primary/10 border border-primary/20">
                            <span className="text-sm font-medium">
                              +{contributorsCount - 10} autres
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bouton chant IA */}
                    {audioUrl && (
                      <Button
                        onClick={handlePlayAudio}
                        disabled={isPlaying}
                        size="lg"
                        className="w-full"
                      >
                        <Music className="mr-2 h-5 w-5" />
                        {isPlaying ? "Lecture en cours..." : "🎵 Écouter votre chant personnalisé"}
                      </Button>
                    )}

                    {/* Bouton fermer */}
                    <Button
                      onClick={onClose}
                      variant="outline"
                      size="lg"
                      className="w-full"
                    >
                      Merci à tous ! 💝
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
