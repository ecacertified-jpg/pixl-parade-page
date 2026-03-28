import { useState, useEffect, useCallback } from 'react';
import { getAppBaseUrl } from '@/utils/appUrl';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import {
  Sparkles, CalendarDays, Gift, Users, Share2, ArrowRight, ArrowLeft,
  Heart, Star, Laptop, ShoppingBag, Plane, Music, Utensils, Dumbbell,
  Copy, Check, PartyPopper, X, ChevronLeft, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import confetti from 'canvas-confetti';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface OnboardingExperienceProps {
  open: boolean;
  onComplete: () => void;
  currentStep: number;
  onSetStep: (step: number) => void;
}

const TOTAL_STEPS = 5;

const GIFT_CATEGORIES = [
  { id: 'tech', label: 'Tech', icon: Laptop, color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  { id: 'mode', label: 'Mode', icon: ShoppingBag, color: 'bg-pink-500/10 text-pink-500 border-pink-500/20' },
  { id: 'voyage', label: 'Voyage', icon: Plane, color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  { id: 'musique', label: 'Musique', icon: Music, color: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
  { id: 'gastronomie', label: 'Gastronomie', icon: Utensils, color: 'bg-orange-500/10 text-orange-500 border-orange-500/20' },
  { id: 'sport', label: 'Sport', icon: Dumbbell, color: 'bg-red-500/10 text-red-500 border-red-500/20' },
  { id: 'bijoux', label: 'Bijoux', icon: Star, color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
  { id: 'bien-etre', label: 'Bien-être', icon: Heart, color: 'bg-rose-500/10 text-rose-500 border-rose-500/20' },
];

// Floating particles component
const FloatingParticles = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {[...Array(12)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute text-2xl"
        initial={{
          x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 400),
          y: (typeof window !== 'undefined' ? window.innerHeight : 800) + 50,
          opacity: 0,
        }}
        animate={{
          y: -50,
          opacity: [0, 0.6, 0],
          rotate: [0, 360],
        }}
        transition={{
          duration: 6 + Math.random() * 4,
          repeat: Infinity,
          delay: i * 0.8,
          ease: 'linear',
        }}
      >
        {['🎁', '❤️', '⭐', '🎂', '🎉', '💜'][i % 6]}
      </motion.div>
    ))}
  </div>
);

export const OnboardingExperience = ({
  open,
  onComplete,
  currentStep,
  onSetStep,
}: OnboardingExperienceProps) => {
  const { user, ensureValidSession } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [birthday, setBirthday] = useState<Date | undefined>();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [invitePhone, setInvitePhone] = useState('');
  const [invitedCount, setInvitedCount] = useState(0);
  const [birthdayPageSlug, setBirthdayPageSlug] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const [generatedInviteLink, setGeneratedInviteLink] = useState<string | null>(null);
  const [daysUntilBirthday, setDaysUntilBirthday] = useState<number | null>(null);

  // Load user data on mount
  useEffect(() => {
    if (!user) return;
    const loadProfile = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('first_name, birthday')
        .eq('user_id', user.id)
        .single();
      if (data?.first_name) setFirstName(data.first_name);
      if (data?.birthday) {
        setBirthday(new Date(data.birthday));
      }
    };
    loadProfile();
  }, [user]);

  // Calculate days until birthday
  useEffect(() => {
    if (!birthday) { setDaysUntilBirthday(null); return; }
    const today = new Date();
    const next = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate());
    if (next <= today) next.setFullYear(next.getFullYear() + 1);
    setDaysUntilBirthday(Math.ceil((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
  }, [birthday]);

  // Confetti on step 0
  useEffect(() => {
    if (open && currentStep === 0) {
      const end = Date.now() + 2500;
      const frame = () => {
        confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0, y: 0.6 }, colors: ['#a855f7', '#ec4899', '#f97316'] });
        confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1, y: 0.6 }, colors: ['#a855f7', '#ec4899', '#f97316'] });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
    }
  }, [open, currentStep]);

  // Save birthday
  const saveBirthday = useCallback(async () => {
    if (!user || !birthday) return;
    const dateStr = `${birthday.getFullYear()}-${String(birthday.getMonth() + 1).padStart(2, '0')}-${String(birthday.getDate()).padStart(2, '0')}`;
    await supabase.from('profiles').update({ birthday: dateStr }).eq('user_id', user.id);
  }, [user, birthday]);

  // Invite friend by phone
  const handleInvite = async () => {
    const phone = invitePhone.trim();
    if (!phone || !user) return;

    const digits = phone.replace(/\D/g, '');
    if (digits.length < 8) {
      toast.error('Numéro invalide (min. 8 chiffres)');
      return;
    }

    // Vérifier la session avant l'appel avec ensureValidSession
    const { valid, session: validSession } = await ensureValidSession();
    if (!valid || !validSession?.access_token) {
      toast.error('Session expirée, veuillez vous reconnecter');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('send-invitation', {
        body: {
          invitee_phone: phone,
          message: `${firstName || 'Un ami'} t'invite à rejoindre Joie de Vivre !`,
        },
        headers: {
          Authorization: `Bearer ${validSession.access_token}`,
        },
      });

      if (error) {
        console.error('Invitation error:', error);
        // Try to extract server error message
        let msg = "L'invitation n'a pas pu être envoyée";
        try {
          const parsed = typeof error === 'object' && error.context ? await error.context.json() : null;
          if (parsed?.error) msg = parsed.error;
        } catch { /* use default msg */ }
        toast.error(msg);
        return;
      }

      if (!data?.invitation_id) {
        console.error('No invitation_id in response:', data);
        const serverError = data?.error || "Erreur inattendue du serveur";
        toast.error(serverError);
        return;
      }

      const invitationLink = `${getAppBaseUrl()}/auth?invited=true&ref=${data.invitation_id}`;
      setGeneratedInviteLink(invitationLink);
      setInvitedCount(c => c + 1);
      setInvitePhone('');
      confetti({ particleCount: 30, spread: 60, origin: { y: 0.7 }, colors: ['#a855f7', '#ec4899'] });
      toast.info('Partagez ce lien avec votre ami !');
    } catch (err: any) {
      console.error('Invitation catch error:', err);
      toast.error(err?.message || "Erreur lors de l'envoi");
    }
  };

  const handleCopyInviteLink = () => {
    if (!generatedInviteLink) return;
    navigator.clipboard.writeText(generatedInviteLink);
    toast.success('Lien copié ! 📋');
  };

  const handleShareInviteLinkWhatsApp = () => {
    if (!generatedInviteLink) return;
    const text = encodeURIComponent(
      `🎉 ${firstName || 'Je'} t'invite à rejoindre Joie de Vivre ! Célèbre les moments importants avec tes proches ✨\n\n${generatedInviteLink}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  // Share on WhatsApp
  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `🎉 ${firstName || 'Je'} t'invite à rejoindre Joie de Vivre ! Célèbre les moments importants avec tes proches ✨\n\nhttps://joiedevivre-africa.com/auth?invited=true`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  // Generate birthday page slug
  const generateBirthdaySlug = useCallback(() => {
    if (!firstName) return '';
    const year = new Date().getFullYear();
    return `${firstName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '-')}-${year}`;
  }, [firstName]);

  // Setup birthday page on step 4
  useEffect(() => {
    if (currentStep === 4 && firstName) {
      setBirthdayPageSlug(generateBirthdaySlug());
    }
  }, [currentStep, firstName, generateBirthdaySlug]);

  const handleCopyLink = () => {
    const url = `https://joiedevivre-africa.com/birthday/${birthdayPageSlug}`;
    navigator.clipboard.writeText(url);
    setLinkCopied(true);
    toast.success('Lien copié !');
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleShareBirthdayPage = () => {
    const url = `https://joiedevivre-africa.com/birthday/${birthdayPageSlug}`;
    const text = encodeURIComponent(`🎂 Ma page anniversaire est prête ! Écris-moi un message ou participe au cadeau collectif 🎁\n\n${url}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleNext = async () => {
    if (currentStep === 1 && birthday) await saveBirthday();
    if (currentStep < TOTAL_STEPS - 1) {
      onSetStep(currentStep + 1);
    } else {
      // Final step — complete
      confetti({ particleCount: 100, spread: 100, origin: { y: 0.5 }, colors: ['#a855f7', '#ec4899', '#f97316', '#22c55e'] });
      onComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) onSetStep(currentStep - 1);
  };

  const progressValue = ((currentStep + 1) / TOTAL_STEPS) * 100;

  if (!open) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background flex flex-col"
    >
      <FloatingParticles />

      {/* Header with progress */}
      <div className="relative z-20 p-4 pb-3 bg-background">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-muted-foreground font-nunito">
            Étape {currentStep + 1} sur {TOTAL_STEPS}
          </span>
          <button onClick={onComplete} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <Progress value={progressValue} className="h-2" indicatorClassName="bg-gradient-to-r from-primary to-accent" />

        {/* Step navigation arrows */}
        <div className="flex items-center justify-center gap-4 mt-3">
          <button
            onClick={() => currentStep > 0 && onSetStep(currentStep - 1)}
            disabled={currentStep === 0}
            aria-label="Étape précédente"
            className={cn(
              'p-1.5 rounded-full transition-all duration-200',
              currentStep > 0
                ? 'text-primary hover:bg-primary/10 cursor-pointer'
                : 'text-muted-foreground/30 cursor-not-allowed'
            )}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <span className="text-sm font-nunito text-foreground/70 min-w-[8rem] text-center">
            {['Accueil', 'Anniversaire', 'Goûts', 'Amis', 'Ma page'][currentStep]}
            <span className="text-muted-foreground/50 ml-1.5 text-xs">
              {currentStep + 1}/{TOTAL_STEPS}
            </span>
          </span>

          <button
            onClick={() => currentStep < TOTAL_STEPS - 1 && onSetStep(currentStep + 1)}
            disabled={currentStep >= TOTAL_STEPS - 1}
            aria-label="Étape suivante"
            className={cn(
              'p-1.5 rounded-full transition-all duration-200',
              currentStep < TOTAL_STEPS - 1
                ? 'text-primary hover:bg-primary/10 cursor-pointer'
                : 'text-muted-foreground/30 cursor-not-allowed'
            )}
          >
            <ChevronRight className={cn("h-5 w-5", currentStep < TOTAL_STEPS - 1 && "animate-[bounce-right_1.5s_ease-in-out_infinite]")} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex items-start justify-center px-4 pt-6 overflow-y-auto">
        <AnimatePresence mode="wait">
          {/* Step 0: Welcome */}
          {currentStep === 0 && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              className="text-center max-w-md mx-auto"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-6 shadow-lg"
              >
                <PartyPopper className="h-12 w-12 text-white" />
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-3xl font-poppins font-bold text-foreground mb-3"
              >
                {firstName ? `${firstName}, bienvenue !` : 'Bienvenue !'}
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-lg text-muted-foreground font-nunito mb-2"
              >
                La joie de donner commence ici ✨
              </motion.p>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-base text-muted-foreground/80 font-nunito"
              >
                Célébrez les moments qui comptent avec vos proches. Offrez, recevez et créez des souvenirs inoubliables.
              </motion.p>
            </motion.div>
          )}

          {/* Step 1: Birthday */}
          {currentStep === 1 && (
            <motion.div
              key="birthday"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              className="text-center max-w-md mx-auto w-full"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring' }}
                className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center mb-6 shadow-lg"
              >
                <CalendarDays className="h-10 w-10 text-white" />
              </motion.div>

              <h2 className="text-2xl font-poppins font-bold text-foreground mb-2">
                Quand est ton anniversaire ? 🎂
              </h2>
              <p className="text-muted-foreground font-nunito mb-6">
                Pour que tes proches ne l'oublient jamais !
              </p>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="lg" className="w-full max-w-xs mx-auto text-lg gap-2">
                    <CalendarDays className="h-5 w-5" />
                    {birthday ? format(birthday, 'dd MMMM yyyy', { locale: fr }) : 'Choisir ma date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="center">
                  <Calendar
                    mode="single"
                    selected={birthday}
                    onSelect={setBirthday}
                    disabled={(date) => date > new Date() || date < new Date('1920-01-01')}
                    captionLayout="dropdown-buttons"
                    fromYear={1920}
                    toYear={new Date().getFullYear()}
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>

              {birthday && daysUntilBirthday !== null && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20"
                >
                  <p className="text-4xl font-poppins font-bold text-primary">J-{daysUntilBirthday}</p>
                  <p className="text-sm text-muted-foreground font-nunito">avant ton prochain anniversaire ! 🎉</p>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Step 2: Gift preferences */}
          {currentStep === 2 && (
            <motion.div
              key="wishes"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              className="text-center max-w-md mx-auto w-full"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring' }}
                className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-heart to-gift flex items-center justify-center mb-6 shadow-lg"
              >
                <Gift className="h-10 w-10 text-white" />
              </motion.div>

              <h2 className="text-2xl font-poppins font-bold text-foreground mb-2">
                Quel cadeau te ferait plaisir ? 🎁
              </h2>
              <p className="text-muted-foreground font-nunito mb-6">
                Choisis tes catégories préférées
              </p>

              <div className="grid grid-cols-2 gap-3">
                {GIFT_CATEGORIES.map((cat, idx) => {
                  const Icon = cat.icon;
                  const isSelected = selectedCategories.includes(cat.id);
                  return (
                    <motion.button
                      key={cat.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() =>
                        setSelectedCategories(prev =>
                          isSelected ? prev.filter(c => c !== cat.id) : [...prev, cat.id]
                        )
                      }
                      className={cn(
                        'p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2',
                        isSelected
                          ? 'border-primary bg-primary/10 scale-105 shadow-md'
                          : 'border-border bg-card hover:border-primary/40'
                      )}
                    >
                      <div className={cn('w-12 h-12 rounded-full flex items-center justify-center', cat.color)}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <span className="text-sm font-medium font-nunito">{cat.label}</span>
                      {isSelected && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                          <Check className="h-4 w-4 text-primary" />
                        </motion.div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Step 3: Invite friends */}
          {currentStep === 3 && (
            <motion.div
              key="circle"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              className="text-center max-w-md mx-auto w-full"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring' }}
                className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center mb-6 shadow-lg"
              >
                <Users className="h-10 w-10 text-white" />
              </motion.div>

              <h2 className="text-2xl font-poppins font-bold text-foreground mb-2">
                Invite tes proches ! 👥
              </h2>
              <p className="text-muted-foreground font-nunito mb-6">
                Plus ton cercle est grand, plus tu recevras de surprises
              </p>

              {invitedCount > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="mb-4 p-3 rounded-xl bg-green-500/10 border border-green-500/20"
                >
                  <p className="text-lg font-bold text-green-600 font-poppins">
                    +{invitedCount} ami{invitedCount > 1 ? 's' : ''} invité{invitedCount > 1 ? 's' : ''} ! 🎉
                  </p>
                </motion.div>
              )}

              <div className="flex gap-2 mb-4">
                <Input
                  value={invitePhone}
                  onChange={e => {
                    setInvitePhone(e.target.value);
                    if (generatedInviteLink) setGeneratedInviteLink(null);
                  }}
                  placeholder="Numéro de téléphone"
                  className="flex-1"
                />
                <Button onClick={handleInvite} disabled={!invitePhone.trim()} size="icon" className="bg-primary">
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>

              {generatedInviteLink && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-4 rounded-xl bg-card border border-primary/20 space-y-3"
                >
                  <p className="text-sm font-nunito text-muted-foreground">
                    📋 Partagez ce lien avec votre ami :
                  </p>
                  <div className="flex gap-2">
                    <Input
                      value={generatedInviteLink}
                      readOnly
                      className="flex-1 text-xs bg-muted"
                    />
                    <Button onClick={handleCopyInviteLink} size="icon" variant="outline" className="shrink-0">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button
                    onClick={handleShareInviteLinkWhatsApp}
                    variant="outline"
                    className="gap-2 w-full border-green-500/30 text-green-600 hover:bg-green-50"
                  >
                    <Share2 className="h-4 w-4" />
                    Envoyer via WhatsApp
                  </Button>
                </motion.div>
              )}

              {!generatedInviteLink && (
                <div className="flex flex-col gap-3">
                  <Button onClick={handleShareWhatsApp} variant="outline" className="gap-2 w-full border-green-500/30 text-green-600 hover:bg-green-50">
                    <Share2 className="h-4 w-4" />
                    Partager sur WhatsApp
                  </Button>
                </div>
              )}
            </motion.div>
          )}

          {/* Step 4: Birthday viral page */}
          {currentStep === 4 && (
            <motion.div
              key="viral"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              className="text-center max-w-md mx-auto w-full"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring' }}
                className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-6 shadow-lg"
              >
                <Sparkles className="h-10 w-10 text-white" />
              </motion.div>

              <h2 className="text-2xl font-poppins font-bold text-foreground mb-2">
                Ta page anniversaire est prête ! 🎂
              </h2>
              <p className="text-muted-foreground font-nunito mb-4">
                Partage-la pour recevoir des messages et des cadeaux de tes proches
              </p>

              {/* Page preview card */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mb-6 p-5 rounded-2xl bg-gradient-to-br from-primary/5 to-accent/10 border border-primary/20 text-left"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-lg">
                    {firstName?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="font-poppins font-semibold text-foreground">
                      Anniversaire de {firstName || 'vous'}
                    </p>
                    <p className="text-xs text-muted-foreground font-nunito">
                      joiedevivre-africa.com/birthday/{birthdayPageSlug}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 p-2 rounded-lg bg-card text-center">
                    <p className="text-xs text-muted-foreground">Messages</p>
                    <p className="font-bold text-foreground">0</p>
                  </div>
                  <div className="flex-1 p-2 rounded-lg bg-card text-center">
                    <p className="text-xs text-muted-foreground">Photos</p>
                    <p className="font-bold text-foreground">0</p>
                  </div>
                  <div className="flex-1 p-2 rounded-lg bg-card text-center">
                    <p className="text-xs text-muted-foreground">Cagnotte</p>
                    <p className="font-bold text-foreground">0 XOF</p>
                  </div>
                </div>
              </motion.div>

              <div className="flex flex-col gap-3">
                <Button onClick={handleShareBirthdayPage} className="gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90 w-full" size="lg">
                  <Share2 className="h-4 w-4" />
                  Partager sur WhatsApp
                </Button>
                <Button onClick={handleCopyLink} variant="outline" className="gap-2 w-full">
                  {linkCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  {linkCopied ? 'Copié !' : 'Copier le lien'}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer navigation */}
      <div className="relative z-10 p-4 pt-2">
        <div className="flex gap-3 max-w-md mx-auto">
          {currentStep > 0 && (
            <Button variant="ghost" onClick={handleBack} className="gap-1">
              <ArrowLeft className="h-4 w-4" />
              Retour
            </Button>
          )}
          <div className="flex-1" />
          {currentStep < TOTAL_STEPS - 1 ? (
            <Button onClick={handleNext} className="gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90" size="lg">
              {currentStep === 0 ? "C'est parti !" : 'Continuer'}
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleNext} className="gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90" size="lg">
              Découvrir mon espace
              <Sparkles className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
};
