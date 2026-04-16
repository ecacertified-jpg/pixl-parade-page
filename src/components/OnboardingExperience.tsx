import { useState, useEffect, useCallback, useMemo } from 'react';
import { getAppBaseUrl } from '@/utils/appUrl';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { AnimatedFavoriteButton } from '@/components/AnimatedFavoriteButton';
import {
  Sparkles, CalendarDays, Gift, Users, Share2, ArrowRight, ArrowLeft,
  Heart, Star, Laptop, ShoppingBag, Plane, Music, Utensils, Dumbbell,
  Copy, Check, PartyPopper, X, ChevronLeft, ChevronRight, ExternalLink,
  Cake
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import confetti from 'canvas-confetti';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { TASTE_TO_PRODUCT_CATEGORIES } from '@/data/taste-categories';

interface OnboardingExperienceProps {
  open: boolean;
  onComplete: () => void;
  currentStep: number;
  onSetStep: (step: number) => void;
  firstIncompleteStep?: number;
}

import { TASTE_CATEGORIES } from "@/data/taste-categories";
import { WishlistFundPickerModal } from '@/components/WishlistFundPickerModal';

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
  firstIncompleteStep = 0,
}: OnboardingExperienceProps) => {
  const { user, ensureValidSession } = useAuth();
  const isReturningUser = firstIncompleteStep > 0;
  const [firstName, setFirstName] = useState('');
  const [birthday, setBirthday] = useState<Date | undefined>();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [invitePhone, setInvitePhone] = useState('');
  const [invitedCount, setInvitedCount] = useState(0);
  const [invitationsSentCount, setInvitationsSentCount] = useState(0);
  const [generatedInviteLink, setGeneratedInviteLink] = useState<string | null>(null);
  const [friendFormLink, setFriendFormLink] = useState<string | null>(null);
  const [generatingFormLink, setGeneratingFormLink] = useState(false);
  const [isLoadingCompletedForms, setIsLoadingCompletedForms] = useState(true);
  const [daysUntilBirthday, setDaysUntilBirthday] = useState<number | null>(null);
  const [wishlistProducts, setWishlistProducts] = useState<any[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Birthday page step states
  const [hasBirthdayPage, setHasBirthdayPage] = useState(false);
  const [birthdayPageSlug, setBirthdayPageSlug] = useState<string | null>(null);
  const [birthdayPageId, setBirthdayPageId] = useState<string | null>(null);
  const [creatingBirthdayPage, setCreatingBirthdayPage] = useState(false);

  // Fund + sharing states for step 6
  const [hasFund, setHasFund] = useState(false);
  const [fundId, setFundId] = useState<string | null>(null);
  const [creatingFund, setCreatingFund] = useState(false);
  const [shareCount, setShareCount] = useState(0);
  const [showFundPickerModal, setShowFundPickerModal] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [birthdayPreFilled, setBirthdayPreFilled] = useState(false);
  const [discoveryPurpose, setDiscoveryPurpose] = useState<string>('my_birthday');

  // Auto-save selected categories with debounce
  useEffect(() => {
    if (!user || selectedCategories.length === 0) return;
    const timeout = setTimeout(() => {
      supabase.from('profiles')
        .update({ selected_tastes: selectedCategories })
        .eq('user_id', user.id);
    }, 500);
    return () => clearTimeout(timeout);
  }, [selectedCategories, user]);

  // Always 6 steps
  const DYNAMIC_TOTAL_STEPS = 6;
  const isFriendPurpose = discoveryPurpose === 'friend_birthday';
  const isOtherEvent = discoveryPurpose === 'other_event';
  const [selectedOccasion, setSelectedOccasion] = useState<string>('wedding');
  const stepLabels = ['Accueil', 'Anniversaire', 'Goûts', 'Souhaits', 'Amis', isOtherEvent ? 'Événement' : isFriendPurpose ? 'Page proche' : 'Ma page'];

  // Read discovery answers from pre-auth quiz
  useEffect(() => {
    try {
      const savedAnswers = localStorage.getItem('jdv_discovery_answers');
      if (savedAnswers) {
        const parsed = JSON.parse(savedAnswers);
        if (parsed?.purpose) {
          setDiscoveryPurpose(parsed.purpose);
        }
      }
    } catch { /* ignore parse errors */ }
  }, []);

  // Load user data on mount
  useEffect(() => {
    if (!user) return;
    const loadProfile = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('first_name, birthday, selected_tastes')
        .eq('user_id', user.id)
        .single();
      if (data?.first_name) setFirstName(data.first_name);
      if (data?.birthday) {
        setBirthday(new Date(data.birthday));
        setBirthdayPreFilled(true);
      } else if (user.user_metadata?.birthday) {
        setBirthday(new Date(user.user_metadata.birthday));
        setBirthdayPreFilled(true);
      }
      if (data?.selected_tastes && (data.selected_tastes as string[]).length > 0) {
        setSelectedCategories(data.selected_tastes as string[]);
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

  // Check if birthday page and fund exist
  useEffect(() => {
    if (!user) return;
    const checkBirthdayPageAndFund = async () => {
      const currentYear = new Date().getFullYear();
      const [pageRes, fundRes] = await Promise.all([
        supabase
          .from('birthday_pages')
          .select('id, slug')
          .eq('user_id', user.id)
          .eq('celebration_year', currentYear)
          .maybeSingle(),
        supabase
          .from('collective_funds')
          .select('id')
          .eq('creator_id', user.id)
          .eq('occasion', 'birthday')
          .eq('status', 'active')
          .maybeSingle(),
      ]);
      if (pageRes.data) {
        setHasBirthdayPage(true);
        setBirthdayPageSlug(pageRes.data.slug);
        setBirthdayPageId(pageRes.data.id);
      }
      if (fundRes.data) {
        setHasFund(true);
        setFundId(fundRes.data.id);
      }
      // Load share count from DB
      const { count } = await supabase
        .from('onboarding_shares')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      setShareCount(count || 0);
    };
    checkBirthdayPageAndFund();
  }, [user]);

  // Confetti on step 0 (only for new users)
  useEffect(() => {
    if (open && currentStep === 0 && !isReturningUser) {
      const end = Date.now() + 2500;
      const frame = () => {
        confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0, y: 0.6 }, colors: ['#a855f7', '#ec4899', '#f97316'] });
        confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1, y: 0.6 }, colors: ['#a855f7', '#ec4899', '#f97316'] });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
    }
  }, [open, currentStep, isReturningUser]);

  // Poll completed friend form tokens every 5 seconds
  useEffect(() => {
    if (currentStep !== 4 || !user) return;

    setIsLoadingCompletedForms(true);
    const fetchCompletedCount = async () => {
      const { count } = await supabase
        .from('friend_form_tokens')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'completed');
      setInvitationsSentCount(count || 0);
      setIsLoadingCompletedForms(false);
    };

    fetchCompletedCount();
    const interval = setInterval(fetchCompletedCount, 5000);
    return () => clearInterval(interval);
  }, [currentStep, user]);

  // Auto-redirect when 3 friends invited (step 4) — always move to step 5
  useEffect(() => {
    if (invitationsSentCount >= 3 && currentStep === 4) {
      confetti({ particleCount: 60, spread: 80, origin: { y: 0.5 }, colors: ['#a855f7', '#ec4899', '#f97316', '#22c55e'] });
      const timer = setTimeout(() => {
        onSetStep(5);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [invitationsSentCount, currentStep, onSetStep]);

  // Auto-redirect when step 5 is fully complete (page + fund + shares ≥ 3)
  useEffect(() => {
    if (hasBirthdayPage && hasFund && shareCount >= 3 && currentStep === 5) {
      confetti({ particleCount: 100, spread: 120, origin: { y: 0.5 }, colors: ['#a855f7', '#ec4899', '#f97316', '#22c55e'] });
      const timer = setTimeout(() => {
        onComplete();
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [hasBirthdayPage, hasFund, shareCount, currentStep, onComplete]);

  // Build category_name list from selected tastes
  const tasteCategoryNames = useMemo(() => {
    if (!selectedCategories.length) return [];
    return selectedCategories.flatMap(taste => TASTE_TO_PRODUCT_CATEGORIES[taste] || []);
  }, [selectedCategories]);

  // Load wishlist products when reaching step 3
  useEffect(() => {
    if (currentStep !== 3 || !user) return;
    const loadProducts = async () => {
      setLoadingProducts(true);
      let query = supabase
        .from('products')
        .select('id, name, price, currency, image_url, business_id, category_name')
        .eq('is_active', true);

      if (tasteCategoryNames.length > 0) {
        query = query.in('category_name', tasteCategoryNames);
      }

      query = query.limit(20);

      const { data } = await query;
      console.log('[Onboarding] Products loaded for categories:', tasteCategoryNames, '→', data?.length, 'results');
      setWishlistProducts(data || []);

      // Load existing favorites
      const { data: favs } = await supabase
        .from('user_favorites')
        .select('product_id')
        .eq('user_id', user.id);
      setFavoriteIds((favs || []).map((f: any) => f.product_id));
      setLoadingProducts(false);
    };
    loadProducts();
  }, [currentStep, user, tasteCategoryNames]);

  // Toggle favorite
  const toggleFavorite = async (productId: string) => {
    if (!user) return;
    const isFav = favoriteIds.includes(productId);
    if (isFav) {
      setFavoriteIds(prev => prev.filter(id => id !== productId));
      await supabase.from('user_favorites').delete().eq('user_id', user.id).eq('product_id', productId);
    } else {
      setFavoriteIds(prev => [...prev, productId]);
      await supabase.from('user_favorites').insert({ user_id: user.id, product_id: productId });
      confetti({ particleCount: 15, spread: 40, origin: { y: 0.6 }, colors: ['#ec4899', '#a855f7'] });
    }
  };

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

  // Generate friend form link
  const handleGenerateFriendFormLink = async () => {
    if (!user || generatingFormLink) return;
    setGeneratingFormLink(true);
    try {
      const token = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      const { error } = await supabase.from('friend_form_tokens').insert({
        token,
        user_id: user.id,
        prefilled_name: '',
        prefilled_relation: '',
        status: 'pending',
        expires_at: expiresAt.toISOString(),
      });
      if (error) { toast.error("Erreur lors de la génération du lien"); return; }
      const link = `${getAppBaseUrl()}/fill-friend-info/${token}`;
      setFriendFormLink(link);
    } catch { toast.error("Erreur inattendue"); } finally { setGeneratingFormLink(false); }
  };

  const handleShareFriendFormWhatsApp = () => {
    if (!friendFormLink) return;
    const text = encodeURIComponent(
      `🎁 Salut ! Pour ne jamais oublier ton anniversaire, remplis ce petit formulaire :\n\n${friendFormLink}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
    toast.success('Lien partagé ! En attente de réponse... ⏳');
  };

  const handleCopyFriendFormLink = () => {
    if (!friendFormLink) return;
    navigator.clipboard.writeText(friendFormLink);
    toast.success('Lien copié ! En attente de réponse... ⏳');
  };

  const handleShareFriendFormSMS = () => {
    if (!friendFormLink) return;
    const text = encodeURIComponent(`🎁 Remplis ce formulaire pour que je n'oublie jamais ton anniversaire : ${friendFormLink}`);
    window.open(`sms:?body=${text}`, '_blank');
    toast.success('Lien partagé ! En attente de réponse... ⏳');
  };

  // Create birthday page
  const handleCreateBirthdayPage = async () => {
    if (!user || creatingBirthdayPage) return;
    setCreatingBirthdayPage(true);
    try {
      const currentYear = new Date().getFullYear();
      const slug = `${user.id.slice(0, 8)}-${currentYear}`;
      
      const { data: existing } = await supabase
        .from('birthday_pages')
        .select('id, slug')
        .eq('user_id', user.id)
        .eq('celebration_year', currentYear)
        .maybeSingle();

      if (existing) {
        setHasBirthdayPage(true);
        setBirthdayPageSlug(existing.slug);
        return;
      }

      const { data, error } = await supabase
        .from('birthday_pages')
        .insert({
          user_id: user.id,
          slug,
          title: `Anniversaire de ${firstName || 'mon ami(e)'}`,
          celebration_year: currentYear,
          is_active: true,
        })
        .select('id, slug')
        .single();

      if (error) {
        console.error('Error creating birthday page:', error);
        toast.error("Erreur lors de la création de la page");
        return;
      }

      setBirthdayPageSlug(data.slug);
      setBirthdayPageId(data.id);
      setHasBirthdayPage(true);
      confetti({ particleCount: 80, spread: 100, origin: { y: 0.5 }, colors: ['#a855f7', '#ec4899', '#f97316', '#22c55e'] });
      // Trigger feed refresh so the new page appears immediately
      window.dispatchEvent(new Event('feed-refresh'));
    } catch (err) {
      console.error('Birthday page creation error:', err);
      toast.error("Erreur inattendue");
    } finally {
      setCreatingBirthdayPage(false);
    }
  };

  // Check if a real fund exists after modal closes
  const checkFundExists = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('collective_funds')
      .select('id')
      .eq('creator_id', user.id)
      .eq('occasion', 'birthday')
      .eq('status', 'active')
      .maybeSingle();
    if (data) {
      setFundId(data.id);
      setHasFund(true);
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 }, colors: ['#a855f7', '#ec4899', '#f97316'] });
      toast.success('Cagnotte créée ! 🎉');
      return true;
    }
    return false;
  }, [user]);

  // Handle fund picker modal close — start polling for real fund
  const handleFundPickerClose = useCallback(() => {
    setShowFundPickerModal(false);
    if (hasFund) return;
    // Poll every 5s for up to 60s
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      const found = await checkFundExists();
      if (found || attempts >= 12) clearInterval(interval);
    }, 5000);
  }, [hasFund, checkFundExists]);

  // Track shares - persist in DB
  const incrementShareCount = useCallback(async (method: string = 'unknown') => {
    if (!user) return;
    const next = shareCount + 1;
    setShareCount(next);
    // Insert into DB
    await supabase.from('onboarding_shares').insert({
      user_id: user.id,
      share_method: method,
      page_slug: birthdayPageSlug || null,
    });
    if (next >= 3) {
      confetti({ particleCount: 60, spread: 80, origin: { y: 0.5 }, colors: ['#a855f7', '#ec4899', '#22c55e'] });
    }
  }, [user, shareCount, birthdayPageSlug]);

  const getShareMessage = (pageUrl: string) =>
    `🎂 C'est bientôt mon anniversaire ! 🎉\n\nÉcris-moi un petit mot, ajoute une photo souvenir ou participe au cadeau collectif 🎁\n\nClique ici, ça prend 30 secondes ⬇️\n\n${pageUrl}`;

  const handleSharePageWhatsApp = () => {
    if (!birthdayPageSlug) return;
    const pageUrl = `${getAppBaseUrl()}/birthday/${birthdayPageSlug}`;
    const text = encodeURIComponent(getShareMessage(pageUrl));
    window.open(`https://wa.me/?text=${text}`, '_blank');
    incrementShareCount('whatsapp');
    toast.success('Partagé sur WhatsApp ! 📱');
  };

  const handleSharePageSMS = () => {
    if (!birthdayPageSlug) return;
    const pageUrl = `${getAppBaseUrl()}/birthday/${birthdayPageSlug}`;
    const text = encodeURIComponent(getShareMessage(pageUrl));
    window.open(`sms:?body=${text}`, '_blank');
    incrementShareCount('sms');
  };

  const handleCopyPageLink = () => {
    if (!birthdayPageSlug) return;
    const pageUrl = `${getAppBaseUrl()}/birthday/${birthdayPageSlug}`;
    navigator.clipboard.writeText(getShareMessage(pageUrl));
    incrementShareCount('copy');
    toast.success('Lien copié ! 📋');
  };

  const isStepCompleted = (step: number): boolean => {
    switch (step) {
      case 0: return true;
      case 1: return !!birthday;
      case 2: return selectedCategories.length >= 1;
      case 3: return favoriteIds.length >= 3;
      case 4: return invitationsSentCount >= 3;
      case 5: return hasBirthdayPage && hasFund && shareCount >= 3;
      default: return false;
    }
  };

  const stepHintMessage = (step: number): string => {
    switch (step) {
      case 1: return "Sélectionne ta date d'anniversaire pour continuer 🎂";
      case 2: return "Choisis au moins une catégorie de cadeau 🎁";
      case 3: return "Ajoute au moins 3 articles à ta liste de souhaits ❤️";
      case 5: return "Crée ta page, ta cagnotte et partage avec tes amis 🎂";
      default: return "Complète cette étape pour continuer";
    }
  };

  const canGoNext = isStepCompleted(currentStep);

  const handleNext = async () => {
    if (!isStepCompleted(currentStep)) {
      toast.info(stepHintMessage(currentStep));
      return;
    }
    if (currentStep === 1 && birthday) await saveBirthday();
    if (currentStep === 2 && user) {
      const { error } = await supabase.from('profiles').update({ selected_tastes: selectedCategories }).eq('user_id', user.id);
      if (error) {
        console.error('Error saving tastes:', error);
        toast.error('Erreur lors de la sauvegarde des goûts. Réessayez.');
        return;
      }
    }
    if (currentStep < DYNAMIC_TOTAL_STEPS - 1) {
      onSetStep(currentStep + 1);
    } else {
      confetti({ particleCount: 100, spread: 100, origin: { y: 0.5 }, colors: ['#a855f7', '#ec4899', '#f97316', '#22c55e'] });
      onComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) onSetStep(currentStep - 1);
  };

  const progressValue = ((currentStep + 1) / DYNAMIC_TOTAL_STEPS) * 100;

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
            Étape {currentStep + 1} sur {DYNAMIC_TOTAL_STEPS}
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
            {stepLabels[currentStep]}
            <span className="text-muted-foreground/50 ml-1.5 text-xs">
              {currentStep + 1}/{DYNAMIC_TOTAL_STEPS}
            </span>
          </span>

          <button
            onClick={() => {
              if (!isStepCompleted(currentStep)) {
                toast.info(stepHintMessage(currentStep));
                return;
              }
              if (currentStep < DYNAMIC_TOTAL_STEPS - 1) onSetStep(currentStep + 1);
            }}
            disabled={currentStep >= DYNAMIC_TOTAL_STEPS - 1}
            aria-label="Étape suivante"
            className={cn(
              'rounded-full flex items-center gap-1 transition-all duration-200',
              currentStep >= DYNAMIC_TOTAL_STEPS - 1
                ? 'px-3 py-1.5 text-muted-foreground/30 cursor-not-allowed'
                : canGoNext
                  ? 'px-4 py-2 bg-red-500 text-white shadow-lg shadow-red-500/40 ring-2 ring-red-300 animate-pulse cursor-pointer hover:bg-red-600 active:scale-95 text-sm font-semibold'
                  : 'px-4 py-2 bg-muted text-muted-foreground cursor-not-allowed opacity-50 text-sm font-semibold'
            )}
          >
            {currentStep < DYNAMIC_TOTAL_STEPS - 1 && <span>Continuer</span>}
            <ChevronRight className={cn(
              currentStep < DYNAMIC_TOTAL_STEPS - 1 ? "h-5 w-5" : "h-5 w-5",
              currentStep < DYNAMIC_TOTAL_STEPS - 1 && canGoNext && "animate-[bounce-right_1.5s_ease-in-out_infinite]"
            )} />
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
                {birthdayPreFilled && birthday ? "C'est bien ta date ? 🎂" : "Quand est ton anniversaire ? 🎂"}
              </h2>
              <p className="text-muted-foreground font-nunito mb-6">
                {birthdayPreFilled && birthday
                  ? "Tu peux la modifier si besoin."
                  : "Pour que tes proches ne l'oublient jamais !"}
              </p>

              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
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
                    onSelect={(date) => {
                      setBirthday(date);
                      if (date) setCalendarOpen(false);
                    }}
                    disabled={(date) => date > new Date() || date < new Date('1920-01-01')}
                    captionLayout="dropdown-buttons"
                    fromYear={1920}
                    toYear={new Date().getFullYear()}
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>

              <AnimatePresence>
                {!birthday && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-200 text-sm font-nunito"
                  >
                    📅 Sélectionne ta date d'anniversaire pour que tes proches puissent te célébrer !
                  </motion.div>
                )}
                {birthday && birthdayPreFilled && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-4 p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 text-green-800 dark:text-green-200 text-sm font-nunito"
                  >
                    ✅ Date trouvée depuis ton profil
                  </motion.div>
                )}
              </AnimatePresence>

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

              <AnimatePresence>
                {selectedCategories.length < 1 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mb-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-200 text-sm font-nunito"
                  >
                    🎁 Choisis au moins une catégorie pour qu'on te propose les meilleurs cadeaux !
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="grid grid-cols-2 gap-3">
                {TASTE_CATEGORIES.map((cat, idx) => {
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

          {/* Step 3: Wishlist */}
          {currentStep === 3 && (
            <motion.div
              key="wishlist"
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
                Qu'est-ce qui te ferait plaisir ? 🎁
              </h2>
              <p className="text-muted-foreground font-nunito mb-2">
                Choisis des idées cadeaux pour que tes proches sachent quoi t'offrir !
              </p>

              {favoriteIds.length > 0 && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="mb-4 p-2 rounded-xl bg-primary/10 border border-primary/20"
                >
                  <p className="text-sm font-semibold text-primary font-poppins">
                    {favoriteIds.length} article{favoriteIds.length > 1 ? 's' : ''} ajouté{favoriteIds.length > 1 ? 's' : ''} à ta liste ❤️
                  </p>
                </motion.div>
              )}

              <AnimatePresence>
                {favoriteIds.length < 3 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mb-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-200 text-sm font-nunito"
                  >
                    ❤️ Ajoute au moins 3 articles ({favoriteIds.length}/3 ajoutés) pour créer ta liste de souhaits parfaite !
                  </motion.div>
                )}
              </AnimatePresence>

              {loadingProducts ? (
                <div className="grid grid-cols-2 gap-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-40 rounded-xl bg-muted animate-pulse" />
                  ))}
                </div>
              ) : wishlistProducts.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {wishlistProducts.map((product, idx) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => toggleFavorite(product.id)}
                      className={`relative rounded-xl bg-card overflow-hidden shadow-sm cursor-pointer transition-all ${
                        favoriteIds.includes(product.id)
                          ? 'border-2 border-primary ring-2 ring-primary/20'
                          : 'border border-border hover:border-primary/40'
                      }`}
                    >
                      <div className="aspect-square bg-muted">
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Gift className="h-8 w-8 text-muted-foreground/40" />
                          </div>
                        )}
                      </div>
                      <div className="absolute top-2 right-2">
                        <AnimatedFavoriteButton
                          isFavorite={favoriteIds.includes(product.id)}
                          onClick={(e) => { e.stopPropagation(); toggleFavorite(product.id); }}
                          size="sm"
                        />
                      </div>
                      <div className="p-2">
                        <p className="text-xs font-medium font-nunito text-foreground truncate">{product.name}</p>
                        <p className="text-xs text-primary font-semibold">
                          {product.price?.toLocaleString()} {product.currency || 'XOF'}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="p-6 rounded-xl bg-muted/50 mb-4 text-center">
                  <Gift className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-muted-foreground font-nunito text-sm">
                    {tasteCategoryNames.length > 0
                      ? "Aucun produit disponible dans cette catégorie. Essaie une autre catégorie de goûts ! 🔄"
                      : "Aucun produit disponible pour le moment"}
                  </p>
                </div>
              )}

              <Button
                onClick={() => { onComplete(); window.location.href = '/wishlist-catalog'; }}
                variant="outline"
                className="gap-2 w-full"
              >
                <ExternalLink className="h-4 w-4" />
                Voir tout le catalogue
              </Button>
            </motion.div>
          )}

          {/* Step 4: Invite friends */}
          {currentStep === 4 && (
            <motion.div
              key="circle"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              className="text-center max-w-md mx-auto w-full"
            >
              {invitationsSentCount >= 3 ? (
                // 🎉 Success state
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                  className="py-8"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring' }}
                    className="mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center mb-6 shadow-lg"
                  >
                    <PartyPopper className="h-12 w-12 text-white" />
                  </motion.div>
                  <h2 className="text-2xl font-poppins font-bold text-foreground mb-3">
                    Bravo {firstName} ! 🎉
                  </h2>
                  <p className="text-lg text-muted-foreground font-nunito mb-4">
                    Ton cercle d'amis est prêt !<br />
                    Tu ne manqueras plus aucun anniversaire.
                  </p>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="flex items-center justify-center gap-2 text-sm text-muted-foreground/70 font-nunito"
                  >
                    <span className="inline-block h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    Passage à l'étape suivante...
                  </motion.div>
                </motion.div>
              ) : (
                // Normal state — invite friends
                <>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring' }}
                    className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center mb-5 shadow-lg"
                  >
                    <Users className="h-10 w-10 text-white" />
                  </motion.div>

                  <h2 className="text-2xl font-poppins font-bold text-foreground mb-2">
                    Ton cercle d'amis, ta force ! 💪
                  </h2>
                  <p className="text-muted-foreground font-nunito mb-5 text-sm leading-relaxed">
                    Ajoute au moins <span className="font-bold text-primary">3 proches</span> pour ne manquer aucun anniversaire.
                    Plus ton cercle est grand, plus tu recevras de surprises ! 🎁
                  </p>

                  {/* Progress dots + bar */}
                  <div className="mb-5">
                    {isLoadingCompletedForms ? (
                      <div className="flex items-center justify-center gap-2 py-4">
                        <span className="inline-block h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm text-muted-foreground font-nunito">Chargement...</span>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-center gap-3 mb-3">
                          {[0, 1, 2].map((i) => (
                            <motion.div
                              key={i}
                              initial={false}
                              animate={{
                                scale: invitationsSentCount > i ? 1.15 : 1,
                                backgroundColor: invitationsSentCount > i ? 'hsl(142, 76%, 36%)' : 'hsl(var(--muted))',
                              }}
                              className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                            >
                              {invitationsSentCount > i ? (
                                <Check className="h-4 w-4 text-white" />
                              ) : (
                                <Users className="h-4 w-4 text-muted-foreground/40" />
                              )}
                            </motion.div>
                          ))}
                        </div>
                        <Progress
                          value={Math.min((invitationsSentCount / 3) * 100, 100)}
                          className="h-2.5 mx-auto max-w-[200px]"
                          indicatorClassName={cn(
                            'transition-all duration-500',
                            invitationsSentCount >= 3
                              ? 'bg-gradient-to-r from-green-400 to-emerald-600'
                              : 'bg-gradient-to-r from-primary to-accent'
                          )}
                        />
                        <p className="text-sm font-poppins font-semibold mt-2 text-foreground">
                          {invitationsSentCount}/3 amis ajoutés
                        </p>
                        <p className="text-xs text-muted-foreground/70 font-nunito mt-1">
                          Le compteur augmente uniquement quand ton proche remplit et envoie le formulaire.
                        </p>
                      </>
                    )}
                  </div>

                  {!friendFormLink ? (
                    <Button
                      onClick={handleGenerateFriendFormLink}
                      disabled={generatingFormLink}
                      className="gap-2 w-full bg-primary hover:bg-primary/90 mb-4"
                      size="lg"
                    >
                      <Share2 className="h-4 w-4" />
                      {generatingFormLink ? 'Génération...' : '📨 Générer un lien d\'invitation'}
                    </Button>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-4 p-4 rounded-xl bg-card border border-primary/20 space-y-3"
                    >
                      <p className="text-sm font-nunito text-muted-foreground">
                        📋 Partagez ce lien avec votre proche :
                      </p>
                      <div className="flex gap-2">
                        <Input
                          value={friendFormLink}
                          readOnly
                          className="flex-1 text-xs bg-muted"
                        />
                        <Button onClick={handleCopyFriendFormLink} size="icon" variant="outline" className="shrink-0">
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={handleShareFriendFormWhatsApp}
                          variant="outline"
                          className="gap-2 flex-1 border-green-500/30 text-green-600 hover:bg-green-50"
                        >
                          <Share2 className="h-4 w-4" />
                          WhatsApp
                        </Button>
                        <Button
                          onClick={handleShareFriendFormSMS}
                          variant="outline"
                          className="gap-2 flex-1"
                        >
                          SMS
                        </Button>
                      </div>
                      <Button
                        onClick={() => { setFriendFormLink(null); }}
                        variant="ghost"
                        className="w-full text-sm text-muted-foreground"
                      >
                        Générer un nouveau lien
                      </Button>
                    </motion.div>
                  )}
                </>
              )}
            </motion.div>
          )}

          {/* Step 5: Birthday Page + Fund + Share */}
          {currentStep === 5 && (
            <motion.div
              key="birthday-page-full"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              className="text-center max-w-md mx-auto w-full"
            >
              {/* All 3 sub-steps complete → success */}
              {hasBirthdayPage && hasFund && shareCount >= 3 ? (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                  className="py-8"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring' }}
                    className="mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-6 shadow-lg"
                  >
                    <PartyPopper className="h-12 w-12 text-white" />
                  </motion.div>
                  <h2 className="text-2xl font-poppins font-bold text-foreground mb-3">
                    Tout est prêt ! 🎉
                  </h2>
                  <p className="text-lg text-muted-foreground font-nunito mb-4">
                    Ta page, ta cagnotte et tes partages sont en place !
                  </p>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="flex items-center justify-center gap-2 text-sm text-muted-foreground/70 font-nunito"
                  >
                    <span className="inline-block h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    Redirection vers ton tableau de bord...
                  </motion.div>
                </motion.div>
              ) : (
                <>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring' }}
                    className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-5 shadow-lg"
                  >
                    <Cake className="h-10 w-10 text-white" />
                  </motion.div>

                  <h2 className="text-2xl font-poppins font-bold text-foreground mb-2">
                    {isOtherEvent ? 'Crée une page pour ton événement 🎊' : isFriendPurpose ? 'Crée une page pour ton proche 🎁' : 'Finalise ta page d\'anniversaire 🎂'}
                  </h2>
                  <p className="text-muted-foreground font-nunito mb-4 text-sm leading-relaxed">
                    {isOtherEvent
                      ? 'Mariage, baptême, fiançailles, diplôme... Célèbre chaque moment !'
                      : isFriendPurpose
                        ? 'Organise une surprise pour l\'anniversaire de ton proche !'
                        : 'Crée ta page, lance ta cagnotte et partage avec tes proches !'}
                  </p>

                  {/* Occasion selector for other_event */}
                  {isOtherEvent && (
                    <div className="flex flex-wrap justify-center gap-2 mb-5">
                      {[
                        { key: 'wedding', label: 'Mariage', emoji: '💍' },
                        { key: 'baptism', label: 'Baptême', emoji: '👶' },
                        { key: 'engagement', label: 'Fiançailles', emoji: '💑' },
                        { key: 'graduation', label: 'Diplôme', emoji: '🎓' },
                        { key: 'promotion', label: 'Promotion', emoji: '💼' },
                        { key: 'other', label: 'Autre', emoji: '🎊' },
                      ].map((occ) => (
                        <button
                          key={occ.key}
                          onClick={() => setSelectedOccasion(occ.key)}
                          className={cn(
                            "px-3 py-1.5 rounded-full text-xs font-poppins font-semibold border transition-all",
                            selectedOccasion === occ.key
                              ? "bg-primary text-primary-foreground border-primary shadow-md scale-105"
                              : "bg-card border-border text-foreground hover:border-primary/50"
                          )}
                        >
                          {occ.emoji} {occ.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Sub-step checklist */}
                  <div className="space-y-3 text-left mb-6">
                    {/* Sub-step 1: Create page */}
                    <div className={cn(
                      "p-4 rounded-xl border transition-all",
                      hasBirthdayPage
                        ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700"
                        : "bg-card border-border"
                    )}>
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                          hasBirthdayPage ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"
                        )}>
                          {hasBirthdayPage ? <Check className="h-4 w-4" /> : <span className="text-sm font-bold">1</span>}
                        </div>
                        <div className="flex-1">
                          <p className="font-poppins font-semibold text-sm text-foreground">
                            {isOtherEvent ? 'Créer la page de l\'événement' : isFriendPurpose ? 'Créer la page de mon proche' : 'Créer ma page'}
                          </p>
                          <p className="text-xs text-muted-foreground font-nunito">
                            {hasBirthdayPage ? "✅ Page créée !" : isOtherEvent ? "Une page pour célébrer et partager l'événement" : isFriendPurpose ? "Une page pour recevoir messages et cadeaux pour ton proche" : "Ta page pour recevoir messages et cadeaux"}
                          </p>
                        </div>
                        {!hasBirthdayPage && (
                          <Button
                            onClick={() => {
                              if (isOtherEvent) {
                                onComplete();
                                window.location.href = `/event/create?occasion=${selectedOccasion}`;
                              } else if (isFriendPurpose) {
                                onComplete();
                                window.location.href = '/event/create?occasion=birthday';
                              } else {
                                handleCreateBirthdayPage();
                              }
                            }}
                            disabled={creatingBirthdayPage}
                            size="sm"
                            className="shrink-0 bg-gradient-to-r from-primary to-accent hover:opacity-90"
                          >
                            {creatingBirthdayPage ? '...' : 'Créer'}
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Sub-step 2: Create fund */}
                    <div className={cn(
                      "p-4 rounded-xl border transition-all",
                      hasFund
                        ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700"
                        : !hasBirthdayPage
                          ? "bg-muted/50 border-border opacity-60"
                          : "bg-card border-border"
                    )}>
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                          hasFund ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"
                        )}>
                          {hasFund ? <Check className="h-4 w-4" /> : <span className="text-sm font-bold">2</span>}
                        </div>
                        <div className="flex-1">
                          <p className="font-poppins font-semibold text-sm text-foreground">
                            {isOtherEvent ? 'Lancer une cagnotte pour l\'événement' : isFriendPurpose ? 'Lancer une cagnotte pour mon proche' : 'Créer ma cagnotte'}
                          </p>
                          <p className="text-xs text-muted-foreground font-nunito">
                            {hasFund ? "✅ Cagnotte créée !" : isOtherEvent ? "Pour collecter des contributions pour l'événement" : isFriendPurpose ? "Pour collecter des contributions pour ton proche" : "Pour recevoir des contributions de tes proches"}
                          </p>
                        </div>
                        {!hasFund && hasBirthdayPage && (
                          <Button
                            onClick={() => setShowFundPickerModal(true)}
                            size="sm"
                            className="shrink-0 bg-gradient-to-r from-primary to-accent hover:opacity-90"
                          >
                            Créer
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Sub-step 3: Share */}
                    <div className={cn(
                      "p-4 rounded-xl border transition-all",
                      shareCount >= 3
                        ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700"
                        : !hasFund
                          ? "bg-muted/50 border-border opacity-60"
                          : "bg-card border-border"
                    )}>
                      <div className="flex items-center gap-3 mb-2">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                          shareCount >= 3 ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"
                        )}>
                          {shareCount >= 3 ? <Check className="h-4 w-4" /> : <span className="text-sm font-bold">3</span>}
                        </div>
                        <div className="flex-1">
                          <p className="font-poppins font-semibold text-sm text-foreground">
                            Partager avec tes amis ({shareCount}/3)
                          </p>
                          <p className="text-xs text-muted-foreground font-nunito">
                            {shareCount >= 3 ? "✅ Partagé avec succès !" : "Partage ta page avec au moins 3 amis"}
                          </p>
                        </div>
                      </div>
                      {hasFund && shareCount < 3 && (
                        <div className="flex gap-2 ml-11">
                          <Button
                            onClick={handleSharePageWhatsApp}
                            variant="outline"
                            size="sm"
                            className="gap-1 flex-1 border-green-500/30 text-green-600 hover:bg-green-50 text-xs"
                          >
                            <Share2 className="h-3 w-3" />
                            WhatsApp
                          </Button>
                          <Button
                            onClick={handleSharePageSMS}
                            variant="outline"
                            size="sm"
                            className="gap-1 flex-1 text-xs"
                          >
                            SMS
                          </Button>
                          <Button
                            onClick={handleCopyPageLink}
                            variant="outline"
                            size="sm"
                            className="gap-1 flex-1 text-xs"
                          >
                            <Copy className="h-3 w-3" />
                            Copier
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Progress indicator */}
                  <div className="mb-4">
                    <Progress
                      value={((hasBirthdayPage ? 1 : 0) + (hasFund ? 1 : 0) + (shareCount >= 3 ? 1 : 0)) / 3 * 100}
                      className="h-2"
                      indicatorClassName="bg-gradient-to-r from-primary to-accent"
                    />
                    <p className="text-xs text-muted-foreground font-nunito mt-1">
                      {(hasBirthdayPage ? 1 : 0) + (hasFund ? 1 : 0) + (shareCount >= 3 ? 1 : 0)}/3 étapes complétées
                    </p>
                  </div>
                </>
              )}
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
          {currentStep < DYNAMIC_TOTAL_STEPS - 1 ? (
            <Button onClick={handleNext} className="gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90" size="lg">
              {currentStep === 0 ? "C'est parti !" : 'Continuer'}
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={onComplete} variant="ghost" className="text-muted-foreground text-sm">
              Passer cette étape
            </Button>
          )}
        </div>
      </div>
      <WishlistFundPickerModal
        isOpen={showFundPickerModal}
        onClose={handleFundPickerClose}
        onFundCreated={handleFundPickerClose}
      />
    </motion.div>
  );
};
