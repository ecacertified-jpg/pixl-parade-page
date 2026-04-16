import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Cake, Users, Gift, Heart, PartyPopper, MessageCircle, Star, Sparkles, TrendingUp, Clock, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import confetti from 'canvas-confetti';
import { useGoogleAnalytics } from '@/hooks/useGoogleAnalytics';

interface PreAuthDiscoveryProps {
  onClose: () => void;
  onSignUp: () => void;
}

interface DiscoveryAnswers {
  purpose?: string;
  timing?: string;
  desire?: string;
  guest_count?: string;
}

interface QuizOption {
  value: string;
  label: string;
  icon: React.ReactNode;
  encouragement: string;
}

interface QuizQuestion {
  id: keyof DiscoveryAnswers;
  title: string;
  subtitle: string;
  options: QuizOption[];
}

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'purpose',
    title: "C'est pour...",
    subtitle: 'Dites-nous qui sera célébré 🎉',
    options: [
      { value: 'my_birthday', label: 'Mon anniversaire', icon: <Cake className="h-6 w-6" />, encouragement: '🎂 Super ! Vous méritez une fête inoubliable !' },
      { value: 'friend_birthday', label: "L'anniversaire d'un proche", icon: <Heart className="h-6 w-6" />, encouragement: '❤️ Quel beau geste ! Votre proche sera touché(e)' },
      { value: 'other_event', label: 'Un autre événement', icon: <PartyPopper className="h-6 w-6" />, encouragement: '🎊 Chaque moment mérite d\'être célébré !' },
    ],
  },
  {
    id: 'timing',
    title: "L'événement, c'est...",
    subtitle: 'Pour mieux vous préparer ⏰',
    options: [
      { value: 'less_1_month', label: 'Dans moins d\'un mois', icon: <Clock className="h-6 w-6" />, encouragement: '⚡ Pas de panique, on va tout organiser rapidement !' },
      { value: '1_to_3_months', label: 'Dans 1 à 3 mois', icon: <Clock className="h-6 w-6" />, encouragement: '👍 Parfait ! Vous avez le temps de bien préparer' },
      { value: 'more_3_months', label: 'Dans plus de 3 mois', icon: <Clock className="h-6 w-6" />, encouragement: '🌟 Excellent ! Plus on anticipe, plus c\'est beau' },
      { value: 'already_passed', label: 'C\'est déjà passé', icon: <Clock className="h-6 w-6" />, encouragement: '📸 Il n\'est jamais trop tard pour créer des souvenirs !' },
    ],
  },
  {
    id: 'desire',
    title: 'Ce qui vous ferait le plus plaisir ?',
    subtitle: 'Choisissez ce qui compte le plus 💫',
    options: [
      { value: 'messages', label: 'Recevoir des messages de mes proches', icon: <MessageCircle className="h-6 w-6" />, encouragement: '💌 Les mots sont les plus beaux cadeaux — c\'est le choix n°1 !' },
      { value: 'collective_gift', label: 'Un cadeau collectif', icon: <Gift className="h-6 w-6" />, encouragement: '🎁 Ensemble, on offre mieux ! Nos utilisateurs récoltent en moyenne 35 000F' },
      { value: 'surprise', label: 'Une surprise organisée', icon: <Sparkles className="h-6 w-6" />, encouragement: '🤫 On adore les surprises ! On vous aide à tout organiser' },
      { value: 'everything', label: 'Tout ça !', icon: <Crown className="h-6 w-6" />, encouragement: '🔥 Vous avez raison de tout vouloir ! C\'est fait pour ça' },
    ],
  },
  {
    id: 'guest_count',
    title: 'Combien de proches voulez-vous réunir ?',
    subtitle: 'Plus on est nombreux, plus c\'est festif 🥳',
    options: [
      { value: '5_10', label: '5 à 10 proches', icon: <Users className="h-6 w-6" />, encouragement: '👫 Un cercle intime, c\'est toujours émouvant !' },
      { value: '10_30', label: '10 à 30 proches', icon: <Users className="h-6 w-6" />, encouragement: '🎯 C\'est la taille idéale pour une belle cagnotte !' },
      { value: '30_50', label: '30 à 50 proches', icon: <Users className="h-6 w-6" />, encouragement: '🚀 Waouh ! Ça va être une vraie fête !' },
      { value: '50_plus', label: 'Plus de 50', icon: <Users className="h-6 w-6" />, encouragement: '🤩 Impressionnant ! Votre page va buzzer !' },
    ],
  },
];

// Simulated notification messages for emotion screen
const NOTIF_MESSAGES = [
  { name: 'Aminata', text: 'Joyeux anniversaire ! 🎉❤️', avatar: '👩🏾', delay: 0.5 },
  { name: 'Koffi', text: 'Mon frère, bonne fête ! 🎂', avatar: '👨🏾', delay: 1.2 },
  { name: 'Fatou', text: 'J\'ai contribué 5000F 🎁', avatar: '👩🏾‍🦱', delay: 2.0 },
  { name: 'Ibrahim', text: 'Que Dieu te bénisse ! 🙏', avatar: '👨🏾‍🦳', delay: 2.8 },
  { name: 'Aya', text: 'Surprise ! On t\'aime ❤️🥳', avatar: '👩🏾‍🦱', delay: 3.5 },
];

// Total steps: 0=Emotion, 1-4=Quiz, 5=Projection, 6=Action
const TOTAL_STEPS = 7;

export function PreAuthDiscovery({ onClose, onSignUp }: PreAuthDiscoveryProps) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<DiscoveryAnswers>({});
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showEncouragement, setShowEncouragement] = useState(false);
  const { trackEvent } = useGoogleAnalytics();

  // Projection animation states
  const [projectedMessages, setProjectedMessages] = useState(0);
  const [projectedAmount, setProjectedAmount] = useState(0);

  useEffect(() => {
    trackEvent('discovery_started');
    localStorage.setItem('jdv_discovery_seen', 'true');
  }, []);

  // Confetti on emotion screen
  useEffect(() => {
    if (step === 0) {
      const timer = setTimeout(() => {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 }, colors: ['#7A5DC7', '#C084FC', '#FAD4E1', '#F7C948'] });
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [step]);

  // Projection animation
  useEffect(() => {
    if (step === 5) {
      const guestMap: Record<string, number> = { '5_10': 8, '10_30': 20, '30_50': 40, '50_plus': 65 };
      const targetMessages = guestMap[answers.guest_count || '10_30'] || 20;
      const targetAmount = targetMessages * 2500;

      let msgCount = 0;
      let amtCount = 0;
      const interval = setInterval(() => {
        msgCount = Math.min(msgCount + 1, targetMessages);
        amtCount = Math.min(amtCount + Math.ceil(targetAmount / targetMessages), targetAmount);
        setProjectedMessages(msgCount);
        setProjectedAmount(amtCount);
        if (msgCount >= targetMessages) clearInterval(interval);
      }, 60);
      return () => clearInterval(interval);
    }
  }, [step, answers.guest_count]);

  const handleSelectOption = useCallback((value: string) => {
    setSelectedOption(value);
    setShowEncouragement(true);
  }, []);

  const handleContinue = useCallback(() => {
    if (step >= 1 && step <= 4 && selectedOption) {
      const questionIndex = step - 1;
      const questionId = QUIZ_QUESTIONS[questionIndex].id;
      setAnswers(prev => ({ ...prev, [questionId]: selectedOption }));
    }
    setSelectedOption(null);
    setShowEncouragement(false);
    setStep(s => s + 1);
  }, [step, selectedOption]);

  const handleBack = useCallback(() => {
    setSelectedOption(null);
    setShowEncouragement(false);
    setStep(s => Math.max(0, s - 1));
  }, []);

  const handleComplete = useCallback(() => {
    // Save answers to localStorage
    const finalAnswers = { ...answers };
    if (step >= 1 && step <= 4 && selectedOption) {
      const questionIndex = step - 1;
      const questionId = QUIZ_QUESTIONS[questionIndex].id;
      finalAnswers[questionId] = selectedOption;
    }
    localStorage.setItem('jdv_discovery_answers', JSON.stringify(finalAnswers));
    trackEvent('discovery_completed', { answers: JSON.stringify(finalAnswers) });
    onSignUp();
  }, [answers, step, selectedOption, trackEvent, onSignUp]);

  const progress = Math.round((step / (TOTAL_STEPS - 1)) * 100);

  const currentQuestion = step >= 1 && step <= 4 ? QUIZ_QUESTIONS[step - 1] : null;
  const currentEncouragement = currentQuestion?.options.find(o => o.value === selectedOption)?.encouragement;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-background flex flex-col overflow-hidden"
    >
      {/* Top bar: back + close + progress */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        {step > 0 ? (
          <button onClick={handleBack} className="p-2 rounded-full bg-muted/50 hover:bg-muted transition-colors">
            <ChevronLeft className="h-5 w-5 text-muted-foreground" />
          </button>
        ) : <div className="w-9" />}
        
        <div className="flex-1 mx-4">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>

        <button onClick={onClose} className="p-2 rounded-full bg-muted/50 hover:bg-muted transition-colors">
          <X className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>

      <AnimatePresence mode="wait">
        {/* ============ STEP 0: EMOTION ============ */}
        {step === 0 && (
          <motion.div
            key="emotion"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-6 overflow-hidden"
          >
            {/* Simulated phone with notifications */}
            <div className="relative w-64 h-80 mx-auto">
              {/* Phone frame */}
              <div className="absolute inset-0 rounded-3xl border-2 border-muted bg-card shadow-lg overflow-hidden">
                <div className="h-6 bg-muted/50 flex items-center justify-center">
                  <div className="w-16 h-1 bg-muted-foreground/20 rounded-full" />
                </div>
                <div className="p-3 space-y-2 overflow-hidden">
                  {NOTIF_MESSAGES.map((notif, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: -30, scale: 0.8 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: notif.delay, duration: 0.5, type: 'spring' }}
                      className="flex items-start gap-2 p-2 bg-secondary/40 rounded-xl"
                    >
                      <span className="text-xl flex-shrink-0">{notif.avatar}</span>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">{notif.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{notif.text}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-3 max-w-sm">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.5 }}
                className="text-2xl font-bold text-foreground font-poppins"
              >
                Imagine que tous tes proches se réunissent pour ton anniversaire...
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2 }}
                className="text-sm text-muted-foreground font-nunito"
              >
                Messages, photos, cagnotte... tout sur une seule page 💜
              </motion.p>
            </div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.5 }}>
              <Button onClick={handleContinue} size="lg" variant="gradient" className="gap-2 text-base px-8">
                Commencer <ChevronRight className="h-5 w-5" />
              </Button>
            </motion.div>
          </motion.div>
        )}

        {/* ============ STEPS 1-4: QUIZ ============ */}
        {currentQuestion && (
          <motion.div
            key={`quiz-${step}`}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="flex-1 flex flex-col px-6 py-4"
          >
            <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full gap-5">
              <div className="text-center space-y-1">
                <h2 className="text-xl font-bold font-poppins text-foreground">{currentQuestion.title}</h2>
                <p className="text-sm text-muted-foreground font-nunito">{currentQuestion.subtitle}</p>
              </div>

              <div className="space-y-3">
                {currentQuestion.options.map((option) => (
                  <motion.button
                    key={option.value}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleSelectOption(option.value)}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                      selectedOption === option.value
                        ? 'border-primary bg-primary/5 shadow-md'
                        : 'border-border bg-card hover:border-primary/30'
                    }`}
                  >
                    <div className={`flex-shrink-0 p-2 rounded-xl ${
                      selectedOption === option.value ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                    }`}>
                      {option.icon}
                    </div>
                    <span className={`text-sm font-medium ${
                      selectedOption === option.value ? 'text-foreground' : 'text-foreground/80'
                    }`}>
                      {option.label}
                    </span>
                    {selectedOption === option.value && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="ml-auto flex-shrink-0 w-6 h-6 rounded-full bg-primary flex items-center justify-center"
                      >
                        <span className="text-primary-foreground text-xs">✓</span>
                      </motion.div>
                    )}
                  </motion.button>
                ))}
              </div>

              {/* Encouragement message */}
              <AnimatePresence>
                {showEncouragement && currentEncouragement && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-center p-3 bg-green-500/10 border border-green-500/20 rounded-xl"
                  >
                    <p className="text-sm font-medium text-green-700 dark:text-green-400 font-nunito">
                      {currentEncouragement}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Continue button */}
            <div className="pt-4 pb-6">
              <Button
                onClick={handleContinue}
                size="lg"
                variant="gradient"
                className="w-full gap-2"
                disabled={!selectedOption}
              >
                Continuer <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* ============ STEP 5: PROJECTION ============ */}
        {step === 5 && (
          <motion.div
            key="projection"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-6"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="text-5xl"
            >
              🚀
            </motion.div>

            <h2 className="text-xl font-bold font-poppins text-foreground">
              Voici ce que vous pourriez recevoir !
            </h2>

            {/* Stats cards */}
            <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="p-4 bg-card border rounded-2xl"
              >
                <MessageCircle className="h-6 w-6 text-primary mx-auto mb-2" />
                <p className="text-3xl font-bold text-foreground font-poppins">{projectedMessages}</p>
                <p className="text-xs text-muted-foreground">messages</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="p-4 bg-card border rounded-2xl"
              >
                <Gift className="h-6 w-6 text-primary mx-auto mb-2" />
                <p className="text-3xl font-bold text-foreground font-poppins">{projectedAmount.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">F CFA collectés</p>
              </motion.div>
            </div>

            {/* Growth curve */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="w-full max-w-sm"
            >
              <div className="flex items-center gap-2 justify-center text-sm text-muted-foreground mb-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span>Croissance estimée des contributions</span>
              </div>
              <div className="h-16 bg-card border rounded-xl overflow-hidden flex items-end px-2 gap-1">
                {[15, 25, 35, 50, 60, 75, 85, 95, 100].map((h, i) => (
                  <motion.div
                    key={i}
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    transition={{ delay: 1 + i * 0.1, duration: 0.4 }}
                    className="flex-1 bg-primary/60 rounded-t"
                  />
                ))}
              </div>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2 }}
              className="text-sm text-muted-foreground font-nunito max-w-xs"
            >
              {answers.desire === 'everything'
                ? 'Vous allez vivre une expérience complète !'
                : answers.desire === 'messages'
                ? 'Les messages de vos proches vous attendent !'
                : answers.desire === 'collective_gift'
                ? 'Votre cagnotte va bien se remplir !'
                : 'Préparez-vous à être surpris(e) !'}
            </motion.p>

            <Button onClick={handleContinue} size="lg" variant="gradient" className="gap-2 px-8">
              C'est parti ! <ChevronRight className="h-5 w-5" />
            </Button>
          </motion.div>
        )}

        {/* ============ STEP 6: ACTION ============ */}
        {step === 6 && (
          <motion.div
            key="action"
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
              🎉
            </motion.div>

            <h2 className="text-2xl font-bold font-poppins text-foreground">
              Tout est prêt !
            </h2>
            <p className="text-muted-foreground font-nunito max-w-sm">
              Créez votre compte gratuit pour lancer votre page d'anniversaire et commencer à recevoir des messages et contributions
            </p>

            {/* Benefits recap */}
            <div className="grid grid-cols-2 gap-3 max-w-sm w-full">
              {[
                { icon: PartyPopper, label: 'Page virale', desc: 'Partageable sur WhatsApp' },
                { icon: MessageCircle, label: 'Mur de vœux', desc: 'Messages personnalisés' },
                { icon: Gift, label: 'Cagnotte', desc: 'Contributions groupées' },
                { icon: Star, label: 'Album souvenir', desc: 'Photos & vidéos' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="p-3 bg-card border rounded-xl text-left"
                >
                  <item.icon className="h-5 w-5 text-primary mb-1" />
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </motion.div>
              ))}
            </div>

            <div className="space-y-3 w-full max-w-sm mt-2">
              <Button onClick={handleComplete} size="lg" variant="gradient" className="w-full text-base gap-2">
                <Sparkles className="h-5 w-5" />
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
