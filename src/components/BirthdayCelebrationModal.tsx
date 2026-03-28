import { useState, useEffect, useRef, useCallback } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { X, Send, Play, Heart, Sparkles, PartyPopper, Volume2, VolumeX, Share2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { BirthdayPageShareButton } from "./BirthdayPageShareButton";

interface BirthdayCelebrationModalProps {
  open: boolean;
  onClose: () => void;
  notification: {
    id: string;
    title: string;
    message: string;
    metadata?: any;
  };
}

interface WishMessage {
  id: string;
  sender_name: string;
  message_text: string;
  created_at: string;
  is_from_fund: boolean;
}

type CelebrationStep = 'confetti' | 'video' | 'messages' | 'thanks';

export const BirthdayCelebrationModal = ({ open, onClose, notification }: BirthdayCelebrationModalProps) => {
  const { user } = useAuth();
  const [step, setStep] = useState<CelebrationStep>('confetti');
  const [messages, setMessages] = useState<WishMessage[]>([]);
  const [customMessage, setCustomMessage] = useState('');
  const [sendingThanks, setSendingThanks] = useState(false);
  const [thanksSent, setThanksSent] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const confettiTriggered = useRef(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [birthdayPageSlug, setBirthdayPageSlug] = useState<string | null>(null);

  const age = notification.metadata?.age;
  const firstName = notification.title?.match(/Joyeux (?:\d+ ans )?(.+) !/)?.[1] || 'toi';
  const isMilestone = notification.metadata?.is_milestone;

  // Launch confetti
  const launchConfetti = useCallback(() => {
    if (confettiTriggered.current) return;
    confettiTriggered.current = true;

    const colors = ['#7A5DC7', '#FAD4E1', '#C084FC', '#F7C948', '#FF4D6D'];
    
    // Multiple bursts
    const fire = (particleRatio: number, opts: confetti.Options) => {
      confetti({
        ...opts,
        particleCount: Math.floor(200 * particleRatio),
        origin: { y: 0.7 },
        colors,
        zIndex: 9999,
      });
    };

    fire(0.25, { spread: 26, startVelocity: 55 });
    setTimeout(() => fire(0.2, { spread: 60 }), 200);
    setTimeout(() => fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 }), 400);
    setTimeout(() => fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 }), 600);
    setTimeout(() => fire(0.1, { spread: 120, startVelocity: 45 }), 800);

    // Extra for milestones
    if (isMilestone) {
      setTimeout(() => {
        confetti({ particleCount: 100, spread: 160, origin: { x: 0, y: 0.5 }, colors, zIndex: 9999 });
        confetti({ particleCount: 100, spread: 160, origin: { x: 1, y: 0.5 }, colors, zIndex: 9999 });
      }, 1200);
    }
  }, [isMilestone]);

  useEffect(() => {
    if (open && step === 'confetti') {
      launchConfetti();
      // Auto-advance to video after 5s
      const timer = setTimeout(() => setStep('video'), 5000);
      return () => clearTimeout(timer);
    }
  }, [open, step, launchConfetti]);

  // Load wish messages + birthday page slug
  useEffect(() => {
    if (!open || !user) return;
    const currentYear = new Date().getFullYear();

    supabase
      .from('birthday_wishes_messages')
      .select('id, sender_name, message_text, created_at, is_from_fund')
      .eq('birthday_user_id', user.id)
      .eq('celebration_year', currentYear)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setMessages(data);
      });

    // Look up birthday page slug
    supabase
      .from('birthday_pages')
      .select('slug')
      .eq('user_id', user.id)
      .eq('celebration_year', currentYear)
      .eq('is_active', true)
      .single()
      .then(({ data }) => {
        if (data) setBirthdayPageSlug(data.slug);
      });
  }, [open, user]);

  const handleVideoPlay = async () => {
    // Auto-send thanks when video plays
    if (!thanksSent && user) {
      try {
        await supabase.functions.invoke('send-birthday-thanks', {
          body: {}
        });
        setThanksSent(true);
      } catch (err) {
        console.error('Error sending auto-thanks:', err);
      }
    }
  };

  const handleSendCustomThanks = async () => {
    if (!customMessage.trim() || !user) return;
    setSendingThanks(true);

    try {
      await supabase.functions.invoke('send-birthday-thanks', {
        body: { customMessage: customMessage.trim() }
      });
      toast.success('Message de remerciement envoyé ! 💖');
      setCustomMessage('');
    } catch (err) {
      toast.error("Erreur lors de l'envoi");
    } finally {
      setSendingThanks(false);
    }
  };

  const getCelebrationMessage = () => {
    if (isMilestone && age) {
      return `✨ ${age} ans ! Un cap magnifique dans ta vie, ${firstName}. Chaque année passée est un trésor, chaque année à venir une promesse. Aujourd'hui, le monde célèbre TOI. Tu mérites tout le bonheur et l'amour qui t'entourent. Brille comme jamais ! 💎🎉`;
    }
    if (age) {
      return `🎂 Joyeux ${age} ans, ${firstName} ! Aujourd'hui est TON jour. Un jour pour célébrer ta vie, tes rêves et tout ce qui te rend unique. Que cette nouvelle année soit remplie de moments magiques, de rires et d'amour. Tu es extraordinaire ! ✨💖`;
    }
    return `🎂 Joyeux anniversaire, ${firstName} ! Aujourd'hui, c'est TOI que l'on célèbre. Ta présence illumine la vie de ceux qui t'entourent. Que cette journée soit aussi belle et exceptionnelle que tu l'es. Le meilleur reste à venir ! 🌟💖`;
  };

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const videoUrl = `${supabaseUrl}/storage/v1/object/public/assets/default-celebration.mp4`;

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-full h-[100dvh] p-0 border-0 rounded-none bg-black/95 sm:max-w-lg sm:h-auto sm:max-h-[90vh] sm:rounded-2xl overflow-hidden [&>button]:hidden">
        <div className="relative w-full h-full flex flex-col">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-50 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          <AnimatePresence mode="wait">
            {/* STEP 1: Confetti + Message */}
            {step === 'confetti' && (
              <motion.div
                key="confetti"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: "spring", duration: 0.8 }}
                className="flex-1 flex flex-col items-center justify-center p-6 text-center"
              >
                <motion.div
                  animate={{ rotate: [0, -10, 10, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <PartyPopper className="h-20 w-20 text-primary mb-6" />
                </motion.div>

                <motion.h1
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-3xl md:text-4xl font-bold text-white mb-4 font-poppins"
                >
                  {age ? `🎉 ${age} ans !` : '🎉 Joyeux Anniversaire !'}
                </motion.h1>

                <motion.p
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="text-lg text-white/90 max-w-md leading-relaxed font-nunito"
                >
                  {getCelebrationMessage()}
                </motion.p>

                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 1.2 }}
                  className="mt-8"
                >
                  <Button
                    onClick={() => setStep('video')}
                    className="bg-primary hover:bg-primary/90 text-white rounded-full px-8"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Voir la vidéo
                  </Button>
                </motion.div>
              </motion.div>
            )}

            {/* STEP 2: Video */}
            {step === 'video' && (
              <motion.div
                key="video"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col items-center justify-center bg-black relative"
              >
                <video
                  ref={videoRef}
                  src={videoUrl}
                  autoPlay
                  muted={isMuted}
                  playsInline
                  className="w-full h-full object-contain max-h-[70vh]"
                  onPlay={handleVideoPlay}
                  onEnded={() => setStep('messages')}
                />
                <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white bg-black/40 hover:bg-black/60 rounded-full"
                    onClick={() => {
                      setIsMuted(!isMuted);
                      if (videoRef.current) videoRef.current.muted = !isMuted;
                    }}
                  >
                    {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white bg-black/40 hover:bg-black/60 rounded-full"
                    onClick={() => setStep('messages')}
                  >
                    Passer →
                  </Button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: Messages des proches */}
            {step === 'messages' && (
              <motion.div
                key="messages"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="flex-1 flex flex-col bg-background text-foreground"
              >
                <div className="p-4 border-b">
                  <div className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-heart animate-pulse" />
                    <h2 className="text-lg font-bold font-poppins">Messages de tes proches</h2>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {messages.length > 0
                      ? `${messages.length} message(s) d'amour pour toi`
                      : "Tes proches pourront t'envoyer des messages ici"}
                  </p>
                </div>

                <ScrollArea className="flex-1 p-4">
                  {messages.length === 0 ? (
                    <div className="text-center py-12">
                      <Sparkles className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
                      <p className="text-sm text-muted-foreground">
                        Pas encore de messages. Tes amis peuvent t'en envoyer !
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {messages.map((msg, i) => (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="flex items-start gap-3 p-3 rounded-xl bg-card border"
                        >
                          <Avatar className="h-9 w-9 flex-shrink-0">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {(msg.sender_name || '?').charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm">{msg.sender_name || 'Un ami'}</span>
                              {msg.is_from_fund && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gift/20 text-gift">
                                  Contributeur
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{msg.message_text}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </ScrollArea>

                <div className="p-4 border-t">
                  <Button
                    className="w-full"
                    onClick={() => setStep('thanks')}
                  >
                    <Heart className="h-4 w-4 mr-2" />
                    Remercier mes proches
                  </Button>
                </div>
              </motion.div>
            )}

            {/* STEP 4: Remerciements personnalisés */}
            {step === 'thanks' && (
              <motion.div
                key="thanks"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="flex-1 flex flex-col bg-background text-foreground"
              >
                <div className="p-4 border-b">
                  <div className="flex items-center gap-2">
                    <Send className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-bold font-poppins">Envoyer un remerciement</h2>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {thanksSent
                      ? "✅ Des remerciements automatiques ont été envoyés"
                      : "Un remerciement automatique sera envoyé à tes proches"}
                  </p>
                </div>

                <div className="flex-1 p-4 space-y-4">
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                    <p className="text-sm text-muted-foreground">
                      Tu peux aussi rédiger un message personnalisé qui sera envoyé à tous ceux qui t'ont souhaité un bon anniversaire ou contribué à une cagnotte.
                    </p>
                  </div>

                  <Textarea
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder="Merci à tous pour vos messages d'amour ! Votre présence dans ma vie est le plus beau des cadeaux... 💖"
                    className="min-h-[120px] resize-none"
                    maxLength={500}
                  />

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{customMessage.length}/500</span>
                    <span>{messages.length} destinataire(s)</span>
                  </div>

                  <Button
                    className="w-full"
                    disabled={!customMessage.trim() || sendingThanks}
                    onClick={handleSendCustomThanks}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {sendingThanks ? 'Envoi en cours...' : 'Envoyer à tous'}
                  </Button>

                  <Button
                    variant="ghost"
                    className="w-full text-muted-foreground"
                    onClick={onClose}
                  >
                    Fermer la célébration
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
};
