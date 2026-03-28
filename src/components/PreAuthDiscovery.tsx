import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, Heart, Camera, Users, Gift, PartyPopper, MessageCircle, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import confetti from 'canvas-confetti';
import { useGoogleAnalytics } from '@/hooks/useGoogleAnalytics';

interface PreAuthDiscoveryProps {
  onClose: () => void;
  onSignUp: () => void;
}

const MOCK_MESSAGES = [
  { name: 'Aminata', text: 'Joyeux anniversaire ma chérie ! 🎉 Tu mérites tout le bonheur du monde ❤️', avatar: '👩🏾' },
  { name: 'Koffi', text: 'Mon frère, que cette année te soit encore plus belle ! On t\'aime fort 🎂', avatar: '👨🏾' },
  { name: 'Fatou', text: 'Happy birthday ! J\'ai contribué à ta cagnotte, profite bien 🎁', avatar: '👩🏾‍🦱' },
];

const MOCK_PHOTOS = ['🎂', '🎉', '🎊', '🥳', '🎈', '🎁'];

export function PreAuthDiscovery({ onClose, onSignUp }: PreAuthDiscoveryProps) {
  const [step, setStep] = useState(0);
  const { trackEvent } = useGoogleAnalytics();
  const [cagnotteProgress, setCagnotteProgress] = useState(0);

  useEffect(() => {
    trackEvent('discovery_started');
    localStorage.setItem('jdv_discovery_seen', 'true');
  }, []);

  // Confetti on step 0
  useEffect(() => {
    if (step === 0) {
      const timer = setTimeout(() => {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 }, colors: ['#7A5DC7', '#C084FC', '#FAD4E1', '#F7C948'] });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [step]);

  // Animate cagnotte on step 1
  useEffect(() => {
    if (step === 1) {
      const interval = setInterval(() => {
        setCagnotteProgress(prev => {
          if (prev >= 65) { clearInterval(interval); return 65; }
          return prev + 2;
        });
      }, 30);
      return () => clearInterval(interval);
    }
  }, [step]);

  const handleComplete = () => {
    trackEvent('discovery_completed');
    onSignUp();
  };

  const nextStep = () => setStep(s => Math.min(s + 1, 2));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-background flex flex-col overflow-hidden"
    >
      {/* Close */}
      <button onClick={onClose} className="absolute top-4 right-4 z-10 p-2 rounded-full bg-muted/50 hover:bg-muted transition-colors">
        <X className="h-5 w-5 text-muted-foreground" />
      </button>

      {/* Progress dots */}
      <div className="flex justify-center gap-2 pt-6 pb-2">
        {[0, 1, 2].map(i => (
          <div key={i} className={`h-2 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-primary' : 'w-2 bg-muted-foreground/30'}`} />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div
            key="step0"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-8"
          >
            {/* Floating emojis */}
            <div className="relative w-40 h-40">
              {['🎂', '🎁', '🎉', '❤️', '🥳'].map((emoji, i) => (
                <motion.span
                  key={i}
                  className="absolute text-4xl"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{
                    opacity: 1, scale: 1,
                    x: [0, Math.cos(i * 72 * Math.PI / 180) * 60],
                    y: [0, Math.sin(i * 72 * Math.PI / 180) * 60],
                  }}
                  transition={{ delay: 0.3 + i * 0.15, duration: 0.6, type: 'spring' }}
                  style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
                >
                  {emoji}
                </motion.span>
              ))}
              <motion.div
                className="absolute inset-0 rounded-full bg-primary/10"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 3 }}
              />
            </div>

            <div className="space-y-4 max-w-sm">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-3xl font-bold text-foreground font-poppins"
              >
                Imaginez...
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="text-lg text-muted-foreground font-nunito leading-relaxed"
              >
                Que <span className="text-primary font-semibold">tous vos proches</span> se réunissent pour célébrer votre anniversaire avec des messages, des photos et un cadeau collectif...
              </motion.p>
            </div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}>
              <Button onClick={nextStep} size="lg" variant="gradient" className="gap-2 text-base">
                Voir comment <ChevronRight className="h-5 w-5" />
              </Button>
            </motion.div>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="flex-1 flex flex-col px-4 py-4 overflow-y-auto"
          >
            <h2 className="text-xl font-bold text-center font-poppins mb-1">Votre page anniversaire</h2>
            <p className="text-sm text-muted-foreground text-center mb-4 font-nunito">Chaque anniversaire devient une célébration collective</p>

            {/* Mock birthday page preview */}
            <div className="bg-card rounded-2xl border shadow-sm overflow-hidden max-w-md mx-auto w-full">
              {/* Header */}
              <div className="bg-gradient-to-r from-primary/20 to-accent/20 p-4 text-center">
                <div className="text-5xl mb-2">🎂</div>
                <h3 className="font-bold text-lg font-poppins">Joyeux anniversaire Sarah !</h3>
                <p className="text-sm text-muted-foreground">28 ans • 15 Mars 2026</p>
              </div>

              {/* Cagnotte */}
              <div className="p-4 border-b">
                <div className="flex items-center gap-2 mb-2">
                  <Gift className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Cagnotte collective</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                    style={{ width: `${cagnotteProgress}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>{Math.round(cagnotteProgress * 500)}F CFA</span>
                  <span>50 000F CFA</span>
                </div>
              </div>

              {/* Messages */}
              <div className="p-4 border-b space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <MessageCircle className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Messages ({MOCK_MESSAGES.length})</span>
                </div>
                {MOCK_MESSAGES.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.2 }}
                    className="flex gap-3 p-3 bg-secondary/30 rounded-xl"
                  >
                    <span className="text-2xl">{msg.avatar}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{msg.name}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{msg.text}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Album preview */}
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Camera className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Album souvenir</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {MOCK_PHOTOS.map((emoji, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5 + i * 0.1 }}
                      className="aspect-square bg-secondary/50 rounded-lg flex items-center justify-center text-2xl"
                    >
                      {emoji}
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-center mt-6 pb-4">
              <Button onClick={nextStep} size="lg" variant="gradient" className="gap-2">
                C'est incroyable ! <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-6"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="text-6xl"
            >
              🚀
            </motion.div>

            <h2 className="text-2xl font-bold font-poppins">Prêt à vivre ça ?</h2>
            <p className="text-muted-foreground font-nunito max-w-sm">
              Créez votre compte gratuit et transformez chaque anniversaire en moment inoubliable
            </p>

            {/* Benefits */}
            <div className="grid grid-cols-2 gap-3 max-w-sm w-full">
              {[
                { icon: PartyPopper, label: 'Page virale', desc: 'Partageable sur WhatsApp' },
                { icon: Camera, label: 'Album souvenir', desc: 'Photos & vidéos' },
                { icon: Users, label: 'Cagnotte collective', desc: 'Contributions groupées' },
                { icon: Heart, label: 'Messages', desc: 'Mur de vœux' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="p-3 bg-card border rounded-xl text-left"
                >
                  <item.icon className="h-5 w-5 text-primary mb-1" />
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </motion.div>
              ))}
            </div>

            <div className="space-y-3 w-full max-w-sm mt-2">
              <Button onClick={handleComplete} size="lg" variant="gradient" className="w-full text-base gap-2">
                <Star className="h-5 w-5" />
                Créer mon compte gratuitement
              </Button>
              <Button onClick={onClose} variant="ghost" size="sm" className="w-full text-muted-foreground">
                Peut-être plus tard
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
