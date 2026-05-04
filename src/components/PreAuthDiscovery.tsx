import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Cake, Users, Gift, Heart, PartyPopper, MessageCircle, Star, Sparkles, TrendingUp, Clock, Crown, MapPin, Phone, User, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import confetti from 'canvas-confetti';
import { format } from 'date-fns';
import { useGoogleAnalytics } from '@/hooks/useGoogleAnalytics';
import { BirthdayPicker } from '@/components/ui/birthday-picker';
import { AddressSelector, type AddressResult } from '@/components/AddressSelector';
import { getAllCountries } from '@/config/countries';

export interface DiscoverySignupData {
  firstName: string;
  birthday: string;
  city: string;
  phone: string;
  countryCode: string;
}

interface PreAuthDiscoveryProps {
  onClose: () => void;
  /** Legacy prop kept for compatibility — not used by the new flow */
  onSignUp?: () => void;
  /** Triggered on the final step when user picks phone OTP signup */
  onSubmitPhoneSignup?: (data: DiscoverySignupData) => void | Promise<void>;
  /** Triggered on the final step when user picks Google signup */
  onSubmitGoogleSignup?: () => void | Promise<void>;
}

interface DiscoveryAnswers {
  birthday?: string;        // YYYY-MM-DD
  timing?: string;
  desire?: string;
  city?: string;
  phone?: string;
  countryCode?: string;
  firstName?: string;
  guest_count?: string;
}

interface QuizOption {
  value: string;
  label: string;
  icon: React.ReactNode;
  encouragement: string;
}

interface QuizStepDef {
  kind: 'quiz';
  id: 'timing' | 'desire' | 'guest_count';
  title: string;
  subtitle: string;
  options: QuizOption[];
}

interface FieldStepDef {
  kind: 'field';
  id: 'birthday' | 'city' | 'phone' | 'firstName';
  title: string;
  subtitle: string;
  encouragement: (val: string) => string;
}

interface StaticStepDef {
  kind: 'emotion' | 'projection' | 'action';
}

type StepDef = QuizStepDef | FieldStepDef | StaticStepDef;

const STEPS: StepDef[] = [
  { kind: 'emotion' },
  {
    kind: 'field',
    id: 'birthday',
    title: "C'est quand ton anniversaire ?",
    subtitle: 'Pour qu\'on te prépare quelque chose d\'inoubliable 🎂',
    encouragement: () => '🎂 On a noté ! On va te préparer quelque chose de spécial',
  },
  {
    kind: 'quiz',
    id: 'timing',
    title: "L'évènement, c'est...",
    subtitle: 'Pour mieux te préparer ⏰',
    options: [
      { value: 'less_1_month', label: "Dans moins d'un mois", icon: <Clock className="h-6 w-6" />, encouragement: '⚡ Pas de panique, on va tout organiser rapidement !' },
      { value: '1_to_3_months', label: 'Dans 1 à 3 mois', icon: <Clock className="h-6 w-6" />, encouragement: '👍 Parfait ! Tu as le temps de bien préparer' },
      { value: 'more_3_months', label: 'Dans plus de 3 mois', icon: <Clock className="h-6 w-6" />, encouragement: "🌟 Excellent ! Plus on anticipe, plus c'est beau" },
      { value: 'already_passed', label: "C'est déjà passé", icon: <Clock className="h-6 w-6" />, encouragement: "📸 Il n'est jamais trop tard pour créer des souvenirs !" },
    ],
  },
  {
    kind: 'quiz',
    id: 'desire',
    title: 'Ce qui te ferait le plus plaisir ?',
    subtitle: 'Choisis ce qui compte le plus 💫',
    options: [
      { value: 'messages', label: 'Recevoir des messages de mes proches', icon: <MessageCircle className="h-6 w-6" />, encouragement: "💌 Les mots sont les plus beaux cadeaux — c'est le choix n°1 !" },
      { value: 'collective_gift', label: 'Un cadeau collectif', icon: <Gift className="h-6 w-6" />, encouragement: '🎁 Ensemble, on offre mieux ! Nos utilisateurs récoltent en moyenne 35 000F' },
      { value: 'surprise', label: 'Une surprise organisée', icon: <Sparkles className="h-6 w-6" />, encouragement: '🤫 On adore les surprises ! On t\'aide à tout organiser' },
      { value: 'everything', label: 'Tout ça !', icon: <Crown className="h-6 w-6" />, encouragement: "🔥 Tu as raison de tout vouloir ! C'est fait pour ça" },
    ],
  },
  {
    kind: 'field',
    id: 'city',
    title: 'À quel lieu veux-tu que tes cadeaux soient livrés ?',
    subtitle: 'Si tes proches veulent t\'offrir un cadeau, on saura où l\'envoyer 📍',
    encouragement: () => '📍 Top, tes proches sauront où envoyer leurs cadeaux',
  },
  {
    kind: 'field',
    id: 'phone',
    title: 'Sur quel numéro es-tu joignable ?',
    subtitle: 'En cas de nécessité (livraison de cadeaux, protection de compte JDV, etc.) 🔒',
    encouragement: () => '🔒 On garde ton numéro en sécurité',
  },
  {
    kind: 'field',
    id: 'firstName',
    title: 'Quel prénom aimes-tu que tes proches t\'appellent ?',
    subtitle: 'Pour personnaliser ta page d\'anniversaire ✨',
    encouragement: (v) => `Enchanté(e), ${v} ! ✨`,
  },
  {
    kind: 'quiz',
    id: 'guest_count',
    title: 'Combien de proches veux-tu réunir ?',
    subtitle: "Plus on est nombreux, plus c'est festif 🥳",
    options: [
      { value: '5_10', label: '5 à 10 proches', icon: <Users className="h-6 w-6" />, encouragement: "👫 Un cercle intime, c'est toujours émouvant !" },
      { value: '10_30', label: '10 à 30 proches', icon: <Users className="h-6 w-6" />, encouragement: "🎯 La taille idéale pour une belle cagnotte !" },
      { value: '30_50', label: '30 à 50 proches', icon: <Users className="h-6 w-6" />, encouragement: '🚀 Waouh ! Ça va être une vraie fête !' },
      { value: '50_plus', label: 'Plus de 50', icon: <Users className="h-6 w-6" />, encouragement: '🤩 Impressionnant ! Ta page va buzzer !' },
    ],
  },
  { kind: 'projection' },
  { kind: 'action' },
];

const TOTAL_STEPS = STEPS.length;

const NOTIF_MESSAGES = [
  { name: 'Aminata', text: 'Joyeux anniversaire ! 🎉❤️', avatar: '👩🏾', delay: 0.5 },
  { name: 'Koffi', text: 'Mon frère, bonne fête ! 🎂', avatar: '👨🏾', delay: 1.2 },
  { name: 'Fatou', text: "J'ai contribué 5000F 🎁", avatar: '👩🏾‍🦱', delay: 2.0 },
  { name: 'Ibrahim', text: 'Que Dieu te bénisse ! 🙏', avatar: '👨🏾‍🦳', delay: 2.8 },
  { name: 'Aya', text: "Surprise ! On t'aime ❤️🥳", avatar: '👩🏾‍🦱', delay: 3.5 },
];

const phoneRegex = /^[0-9]{8,10}$/;

const isFieldValid = (id: FieldStepDef['id'], answers: DiscoveryAnswers): boolean => {
  switch (id) {
    case 'birthday': {
      if (!answers.birthday) return false;
      const d = new Date(answers.birthday + 'T00:00:00');
      if (isNaN(d.getTime())) return false;
      const now = new Date();
      const ageMs = now.getTime() - d.getTime();
      return ageMs > 0 && ageMs / (1000 * 60 * 60 * 24 * 365) >= 5;
    }
    case 'city':
      return !!answers.city && answers.city.trim().length > 0;
    case 'phone':
      return !!answers.phone && phoneRegex.test(answers.phone) && !!answers.countryCode;
    case 'firstName':
      return !!answers.firstName && answers.firstName.trim().length >= 1;
  }
};

export function PreAuthDiscovery({ onClose, onSignUp, onSubmitPhoneSignup, onSubmitGoogleSignup }: PreAuthDiscoveryProps) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<DiscoveryAnswers>(() => {
    if (typeof window === 'undefined') return {};
    try {
      const raw = localStorage.getItem('jdv_discovery_answers');
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  });
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showEncouragement, setShowEncouragement] = useState(false);
  const [submittingPhone, setSubmittingPhone] = useState(false);
  const [submittingGoogle, setSubmittingGoogle] = useState(false);
  const [showWhatsAppWarning, setShowWhatsAppWarning] = useState(false);
  const { trackEvent } = useGoogleAnalytics();

  const [projectedMessages, setProjectedMessages] = useState(0);
  const [projectedAmount, setProjectedAmount] = useState(0);

  const countries = getAllCountries();

  // Initialize default countryCode
  useEffect(() => {
    if (!answers.countryCode) {
      setAnswers((a) => ({ ...a, countryCode: '+225' }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    trackEvent('discovery_started');
    localStorage.setItem('jdv_discovery_seen', 'true');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist answers
  useEffect(() => {
    try { localStorage.setItem('jdv_discovery_answers', JSON.stringify(answers)); } catch {}
  }, [answers]);

  const currentStepDef = STEPS[step];

  // Confetti on emotion screen
  useEffect(() => {
    if (currentStepDef.kind === 'emotion') {
      const t = setTimeout(() => {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 }, colors: ['#7A5DC7', '#C084FC', '#FAD4E1', '#F7C948'] });
      }, 800);
      return () => clearTimeout(t);
    }
  }, [currentStepDef]);

  // Projection animation
  useEffect(() => {
    if (currentStepDef.kind === 'projection') {
      const guestMap: Record<string, number> = { '5_10': 8, '10_30': 20, '30_50': 40, '50_plus': 65 };
      const targetMessages = guestMap[answers.guest_count || '10_30'] || 20;
      const targetAmount = targetMessages * 2500;
      let msgCount = 0, amtCount = 0;
      const interval = setInterval(() => {
        msgCount = Math.min(msgCount + 1, targetMessages);
        amtCount = Math.min(amtCount + Math.ceil(targetAmount / targetMessages), targetAmount);
        setProjectedMessages(msgCount);
        setProjectedAmount(amtCount);
        if (msgCount >= targetMessages) clearInterval(interval);
      }, 60);
      return () => clearInterval(interval);
    }
  }, [currentStepDef, answers.guest_count]);

  // Sync selectedOption with quiz step
  useEffect(() => {
    setShowEncouragement(false);
    if (currentStepDef.kind === 'quiz') {
      const v = answers[currentStepDef.id];
      setSelectedOption(v ?? null);
      if (v) setShowEncouragement(true);
    } else {
      setSelectedOption(null);
    }
  }, [step, currentStepDef, answers]);

  const handleSelectOption = useCallback((value: string) => {
    if (currentStepDef.kind !== 'quiz') return;
    setSelectedOption(value);
    setShowEncouragement(true);
    setAnswers((prev) => ({ ...prev, [currentStepDef.id]: value }));
  }, [currentStepDef]);

  const handleContinue = useCallback(() => {
    setShowEncouragement(false);
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  }, []);

  const handleBack = useCallback(() => {
    setShowEncouragement(false);
    setStep((s) => Math.max(0, s - 1));
  }, []);

  const handlePhoneSignup = useCallback(async () => {
    if (!isFieldValid('firstName', answers) || !isFieldValid('birthday', answers) || !isFieldValid('city', answers) || !isFieldValid('phone', answers)) {
      return;
    }
    trackEvent('discovery_completed', { method: 'phone' });
    try {
      setSubmittingPhone(true);
      await onSubmitPhoneSignup?.({
        firstName: answers.firstName!.trim(),
        birthday: answers.birthday!,
        city: answers.city!.trim(),
        phone: answers.phone!,
        countryCode: answers.countryCode || '+225',
      });
    } finally {
      setSubmittingPhone(false);
    }
  }, [answers, onSubmitPhoneSignup, trackEvent]);

  const handleGoogleSignup = useCallback(async () => {
    trackEvent('discovery_completed', { method: 'google' });
    try {
      setSubmittingGoogle(true);
      await onSubmitGoogleSignup?.();
    } finally {
      setSubmittingGoogle(false);
    }
  }, [onSubmitGoogleSignup, trackEvent]);

  const progress = Math.round((step / (TOTAL_STEPS - 1)) * 100);

  // Helpers for current field validation
  const fieldValid = currentStepDef.kind === 'field' ? isFieldValid(currentStepDef.id, answers) : false;
  const currentEncouragement = (() => {
    if (currentStepDef.kind === 'quiz') {
      return currentStepDef.options.find((o) => o.value === selectedOption)?.encouragement;
    }
    if (currentStepDef.kind === 'field' && fieldValid && showEncouragement) {
      const val = currentStepDef.id === 'firstName' ? (answers.firstName || '') : '';
      return currentStepDef.encouragement(val);
    }
    return undefined;
  })();

  // Show encouragement when a field becomes valid
  useEffect(() => {
    if (currentStepDef.kind === 'field' && fieldValid) {
      const t = setTimeout(() => setShowEncouragement(true), 250);
      return () => clearTimeout(t);
    }
  }, [currentStepDef, fieldValid]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-background flex flex-col overflow-hidden"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 flex-shrink-0">
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

      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {/* EMOTION */}
          {currentStepDef.kind === 'emotion' && (
            <motion.div
              key="emotion"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="min-h-full flex flex-col items-center justify-center px-6 text-center gap-6 py-8"
            >
              <div className="relative w-64 h-80 mx-auto">
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
                <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.5 }} className="text-2xl font-bold text-foreground font-poppins">
                  Imagine que tous tes proches se réunissent pour ton anniversaire...
                </motion.h1>
                <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2 }} className="text-sm text-muted-foreground font-nunito">
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

          {/* QUIZ */}
          {currentStepDef.kind === 'quiz' && (
            <motion.div
              key={`quiz-${step}`}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="min-h-full flex flex-col px-6 py-4"
            >
              <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full gap-5">
                <div className="text-center space-y-1">
                  <h2 className="text-xl font-bold font-poppins text-foreground">{currentStepDef.title}</h2>
                  <p className="text-sm text-muted-foreground font-nunito">{currentStepDef.subtitle}</p>
                </div>
                <div className="space-y-3">
                  {currentStepDef.options.map((option) => (
                    <motion.button
                      key={option.value}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleSelectOption(option.value)}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                        selectedOption === option.value ? 'border-primary bg-primary/5 shadow-md' : 'border-border bg-card hover:border-primary/30'
                      }`}
                    >
                      <div className={`flex-shrink-0 p-2 rounded-xl ${selectedOption === option.value ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                        {option.icon}
                      </div>
                      <span className={`text-sm font-medium ${selectedOption === option.value ? 'text-foreground' : 'text-foreground/80'}`}>
                        {option.label}
                      </span>
                      {selectedOption === option.value && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="ml-auto flex-shrink-0 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                          <span className="text-primary-foreground text-xs">✓</span>
                        </motion.div>
                      )}
                    </motion.button>
                  ))}
                </div>
                <AnimatePresence>
                  {showEncouragement && currentEncouragement && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="text-center p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
                      <p className="text-sm font-medium text-green-700 dark:text-green-400 font-nunito">{currentEncouragement}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div className="pt-4 pb-6 max-w-md mx-auto w-full">
                <Button onClick={handleContinue} size="lg" variant="gradient" className="w-full gap-2" disabled={!selectedOption}>
                  Continuer <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* FIELD */}
          {currentStepDef.kind === 'field' && (
            <motion.div
              key={`field-${currentStepDef.id}`}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="min-h-full flex flex-col px-6 py-4"
            >
              <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full gap-5">
                <div className="text-center space-y-1">
                  <h2 className="text-xl font-bold font-poppins text-foreground">{currentStepDef.title}</h2>
                  <p className="text-sm text-muted-foreground font-nunito">{currentStepDef.subtitle}</p>
                </div>

                {currentStepDef.id === 'birthday' && (
                  <BirthdayPicker
                    label="Date d'anniversaire"
                    labelIcon={<Gift className="h-4 w-4 text-primary" />}
                    value={answers.birthday ? new Date(answers.birthday + 'T00:00:00') : undefined}
                    onChange={(date) => setAnswers((a) => ({ ...a, birthday: date ? format(date, 'yyyy-MM-dd') : '' }))}
                  />
                )}

                {currentStepDef.id === 'city' && (
                  <AddressSelector
                    onAddressChange={(data: AddressResult) => setAnswers((a) => ({ ...a, city: data.fullAddress }))}
                    label="Lieu de livraison"
                    cityLabel="Ville / Commune"
                    neighborhoodLabel="Quartier (optionnel)"
                    required={false}
                    showCoordinates={false}
                  />
                )}

                {currentStepDef.id === 'phone' && (
                  <div className="space-y-2">
                    <Label htmlFor="discovery-phone">Téléphone <span className="text-destructive">*</span></Label>
                    <div className="flex gap-2">
                      <Select
                        value={answers.countryCode || '+225'}
                        onValueChange={(value) => setAnswers((a) => ({ ...a, countryCode: value }))}
                      >
                        <SelectTrigger className="w-[110px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {countries.map((c) => (
                            <SelectItem key={c.code} value={c.phonePrefix}>
                              {c.flag} {c.phonePrefix}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        id="discovery-phone"
                        type="tel"
                        inputMode="numeric"
                        placeholder="07 XX XX XX XX"
                        maxLength={10}
                        value={answers.phone || ''}
                        onChange={(e) => setAnswers((a) => ({ ...a, phone: e.target.value.replace(/\D/g, '') }))}
                        className="flex-1"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">8 à 10 chiffres, sans espaces</p>
                  </div>
                )}

                {currentStepDef.id === 'firstName' && (
                  <div className="space-y-2">
                    <Label htmlFor="discovery-firstname">Prénom</Label>
                    <Input
                      id="discovery-firstname"
                      placeholder="Ton prénom"
                      maxLength={50}
                      value={answers.firstName || ''}
                      onChange={(e) => setAnswers((a) => ({ ...a, firstName: e.target.value }))}
                      autoFocus
                    />
                  </div>
                )}

                <AnimatePresence>
                  {showEncouragement && currentEncouragement && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="text-center p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
                      <p className="text-sm font-medium text-green-700 dark:text-green-400 font-nunito">{currentEncouragement}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div className="pt-4 pb-6 max-w-md mx-auto w-full">
                <Button onClick={handleContinue} size="lg" variant="gradient" className="w-full gap-2" disabled={!fieldValid}>
                  Continuer <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* PROJECTION */}
          {currentStepDef.kind === 'projection' && (
            <motion.div
              key="projection"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="min-h-full flex flex-col items-center justify-center px-6 text-center gap-6 py-8"
            >
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }} className="text-5xl">🚀</motion.div>
              <h2 className="text-xl font-bold font-poppins text-foreground">
                Voici ce que tu pourrais recevoir{answers.firstName ? `, ${answers.firstName}` : ''} !
              </h2>
              <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="p-4 bg-card border rounded-2xl">
                  <MessageCircle className="h-6 w-6 text-primary mx-auto mb-2" />
                  <p className="text-3xl font-bold text-foreground font-poppins">{projectedMessages}</p>
                  <p className="text-xs text-muted-foreground">messages</p>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="p-4 bg-card border rounded-2xl">
                  <Gift className="h-6 w-6 text-primary mx-auto mb-2" />
                  <p className="text-3xl font-bold text-foreground font-poppins">{projectedAmount.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">F CFA collectés</p>
                </motion.div>
              </div>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="w-full max-w-sm">
                <div className="flex items-center gap-2 justify-center text-sm text-muted-foreground mb-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span>Croissance estimée des contributions</span>
                </div>
                <div className="h-16 bg-card border rounded-xl overflow-hidden flex items-end px-2 gap-1">
                  {[15, 25, 35, 50, 60, 75, 85, 95, 100].map((h, i) => (
                    <motion.div key={i} initial={{ height: 0 }} animate={{ height: `${h}%` }} transition={{ delay: 1 + i * 0.1, duration: 0.4 }} className="flex-1 bg-primary/60 rounded-t" />
                  ))}
                </div>
              </motion.div>
              <Button onClick={handleContinue} size="lg" variant="gradient" className="gap-2 px-8">
                C'est parti ! <ChevronRight className="h-5 w-5" />
              </Button>
            </motion.div>
          )}

          {/* ACTION */}
          {currentStepDef.kind === 'action' && (
            <motion.div
              key="action"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="min-h-full flex flex-col items-center justify-center px-6 text-center gap-5 py-8"
            >
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }} className="text-6xl">🎉</motion.div>
              <h2 className="text-2xl font-bold font-poppins text-foreground">Tout est prêt !</h2>
              <p className="text-muted-foreground font-nunito max-w-sm text-sm">
                Crée ton compte gratuit pour lancer ta page d'anniversaire et commencer à recevoir des messages et contributions.
              </p>

              {/* Recap */}
              <div className="w-full max-w-sm bg-secondary/30 rounded-2xl p-4 space-y-2 text-left">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-muted-foreground">Prénom :</span>
                  <span className="font-medium text-foreground">{answers.firstName || '—'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Cake className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-muted-foreground">Anniversaire :</span>
                  <span className="font-medium text-foreground">{answers.birthday ? format(new Date(answers.birthday + 'T00:00:00'), 'dd/MM/yyyy') : '—'}</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground flex-shrink-0">Livraison :</span>
                  <span className="font-medium text-foreground line-clamp-2">{answers.city || '—'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-muted-foreground">Téléphone :</span>
                  <span className="font-medium text-foreground">{answers.countryCode} {answers.phone}</span>
                </div>
              </div>

              <div className="space-y-3 w-full max-w-sm mt-2">
                <Button
                  onClick={() => setShowWhatsAppWarning(true)}
                  size="lg"
                  variant="gradient"
                  className="w-full text-base gap-2"
                  disabled={submittingPhone || submittingGoogle || !isFieldValid('firstName', answers) || !isFieldValid('birthday', answers) || !isFieldValid('city', answers) || !isFieldValid('phone', answers)}
                >
                  {submittingPhone ? <Loader2 className="h-5 w-5 animate-spin" /> : <Phone className="h-5 w-5" />}
                  Recevoir mon code de vérification
                </Button>

                <div className="relative my-2">
                  <Separator />
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">ou</span>
                </div>

                <Button
                  onClick={handleGoogleSignup}
                  size="lg"
                  variant="outline"
                  className="w-full text-base gap-2"
                  disabled={submittingPhone || submittingGoogle}
                >
                  {submittingGoogle ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <svg className="h-5 w-5" viewBox="0 0 48 48" aria-hidden="true">
                      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35.5 24 35.5c-6.4 0-11.5-5.1-11.5-11.5S17.6 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.6 6.3 29.1 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5 43.5 34.8 43.5 24c0-1.2-.1-2.3-.4-3.5z"/>
                      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16 18.9 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.6 6.3 29.1 4.5 24 4.5 16.3 4.5 9.7 8.9 6.3 14.7z"/>
                      <path fill="#4CAF50" d="M24 43.5c5 0 9.5-1.7 13-4.7l-6-5.1c-2 1.4-4.4 2.3-7 2.3-5.3 0-9.7-3.4-11.3-8.1l-6.5 5C9.5 39 16.3 43.5 24 43.5z"/>
                      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.4l6 5.1c-.4.4 6.7-4.9 6.7-14.5 0-1.2-.1-2.3-.4-3.5z"/>
                    </svg>
                  )}
                  S'inscrire avec Google
                </Button>

                <Button onClick={onClose} variant="ghost" size="sm" className="w-full text-muted-foreground">
                  Peut-être plus tard
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {showWhatsAppWarning && (
        <div
          className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center bg-black/60 p-4"
          onClick={() => setShowWhatsAppWarning(false)}
        >
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.96 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-background p-6 shadow-xl border"
          >
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground font-poppins">
                  Attention !
                </h3>
                <p className="text-sm text-muted-foreground mt-1 font-nunito">
                  Tu vas recevoir un code par WhatsApp au numéro{' '}
                  <span className="font-semibold text-foreground">
                    {answers.countryCode} {answers.phone}
                  </span>
                  . Assure-toi d'avoir accès à ce compte WhatsApp.
                </p>
              </div>
            </div>
            <div className="mt-5 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowWhatsAppWarning(false)}
                disabled={submittingPhone}
              >
                Annuler
              </Button>
              <Button
                onClick={() => {
                  setShowWhatsAppWarning(false);
                  handlePhoneSignup();
                }}
                disabled={submittingPhone}
                className="bg-green-600 hover:bg-green-700 text-white gap-2"
              >
                {submittingPhone ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
                Recevoir
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
