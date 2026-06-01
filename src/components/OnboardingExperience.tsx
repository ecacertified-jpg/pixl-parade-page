import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { getAppBaseUrl } from '@/utils/appUrl';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { BirthdayPicker } from '@/components/ui/birthday-picker';
import { Input } from '@/components/ui/input';
import { AnimatedFavoriteButton } from '@/components/AnimatedFavoriteButton';
import {
  Sparkles, CalendarDays, Gift, Users, Share2, ArrowRight, ArrowLeft,
  Heart, Star, Laptop, ShoppingBag, Plane, Music, Utensils, Dumbbell,
  Copy, Check, PartyPopper, X, ChevronLeft, ChevronRight, ExternalLink,
  Cake, Tag, UserPlus, Calendar as CalendarIcon, Rocket, Camera
} from 'lucide-react';
import { cn } from '@/lib/utils';
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
import { BirthdayPageFriendsPicker } from '@/components/BirthdayPageFriendsPicker';
import { OnboardingFirstPhotoStep } from '@/components/OnboardingFirstPhotoStep';
import { BirthdayPageShareButton } from '@/components/BirthdayPageShareButton';
import { SharingTipsBubbles } from '@/components/onboarding/SharingTipsBubbles';
import { JumiaImportModal } from '@/components/wishlist/JumiaImportModal';
import type { PageType } from '@/hooks/useBirthdayPageBuilderStatus';

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
  const [isPagePublished, setIsPagePublished] = useState(false);
  const [publishingNow, setPublishingNow] = useState(false);

  // Fund + sharing states for step 6
  const [hasFund, setHasFund] = useState(false);
  const [fundId, setFundId] = useState<string | null>(null);
  const [creatingFund, setCreatingFund] = useState(false);
  const [shareCount, setShareCount] = useState(0);
  const [showFundPickerModal, setShowFundPickerModal] = useState(false);
  const [showJumiaModal, setShowJumiaModal] = useState(false);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [birthdayPreFilled, setBirthdayPreFilled] = useState(false);
  const [discoveryPurpose, setDiscoveryPurpose] = useState<string>('my_birthday');

  // Immediate save of selected categories on every change (no debounce)
  // Tracks in-flight saves to block "Continuer" until DB is up-to-date.
  const [savingCategories, setSavingCategories] = useState(false);
  const categoriesInitializedRef = useRef(false);
  useEffect(() => {
    if (!user) return;
    // Skip the very first render after data load to avoid overwriting on mount
    if (!categoriesInitializedRef.current) {
      categoriesInitializedRef.current = true;
      return;
    }
    let cancelled = false;
    setSavingCategories(true);
    supabase.from('profiles')
      .update({ selected_tastes: selectedCategories })
      .eq('user_id', user.id)
      .then(({ error }) => {
        if (cancelled) return;
        setSavingCategories(false);
        if (error) {
          console.error('Auto-save tastes failed:', error);
          toast.error('Sauvegarde des goûts échouée. Vérifiez votre connexion.');
        }
      });
    return () => { cancelled = true; };
  }, [selectedCategories, user]);

  // 7 steps total (0=welcome → 6=publish+share)
  const DYNAMIC_TOTAL_STEPS = 7;
  const isFriendPurpose = discoveryPurpose === 'friend_birthday';
  const isOtherEvent = discoveryPurpose === 'other_event';
  const [selectedOccasion, setSelectedOccasion] = useState<string>('wedding');
  const stepLabels = ['Accueil', 'Goûts', 'Souhaits', 'Type', 'Cagnotte', 'Photo', 'Publier'];

  // ---- Birthday-page-builder synced states ----
  const [pageType, setPageTypeState] = useState<PageType | null>(null);
  const [showFriendsPicker, setShowFriendsPicker] = useState(false);
  const [associatedFriendsCount, setAssociatedFriendsCount] = useState(0);
  const [firstPhotoCount, setFirstPhotoCount] = useState(0);
  const [fundSkipped, setFundSkipped] = useState(false);
  const [publishingPage, setPublishingPage] = useState(false);

  // Hydrate from localStorage
  useEffect(() => {
    if (!user?.id) return;
    try {
      const t = localStorage.getItem(`bp_type_${user.id}`);
      if (t === 'self' || t === 'friend' || t === 'other_event') setPageTypeState(t);
      const skipped = localStorage.getItem(`bp_fund_skipped_${user.id}`);
      setFundSkipped(skipped === '1');
    } catch { /* ignore */ }
  }, [user?.id]);

  const setPageType = useCallback((t: PageType) => {
    setPageTypeState(t);
    if (user?.id) {
      try { localStorage.setItem(`bp_type_${user.id}`, t); } catch { /* ignore */ }
    }
  }, [user?.id]);

  const skipFund = useCallback(() => {
    if (!user?.id) return;
    try { localStorage.setItem(`bp_fund_skipped_${user.id}`, '1'); } catch { /* ignore */ }
    setFundSkipped(true);
    toast.message('Étape passée — tu pourras la créer plus tard ✨');
  }, [user?.id]);

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
          .select('id, slug, published_at, published_via_onboarding')
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
        setIsPagePublished(!!pageRes.data.published_at && pageRes.data.published_via_onboarding === true);
      }
      if (fundRes.data) {
        setHasFund(true);
        setFundId(fundRes.data.id);
      }
      // Retroactive linking: if both page + fund exist but page has no fund_id, link them
      if (pageRes.data?.id && fundRes.data?.id) {
        await supabase
          .from('birthday_pages')
          .update({ fund_id: fundRes.data.id })
          .eq('id', pageRes.data.id)
          .is('fund_id', null);
        window.dispatchEvent(new Event('feed-refresh'));
      }
      // Load share count from DB
      const { count } = await supabase
        .from('onboarding_shares')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      setShareCount(count || 0);

      // First-photo count + associated friends count (synced with builder)
      if (pageRes.data?.id) {
        const [{ count: photos }, { count: friends }] = await Promise.all([
          supabase
            .from('birthday_page_photos')
            .select('*', { count: 'exact', head: true })
            .eq('birthday_page_id', pageRes.data.id),
          supabase
            .from('birthday_page_friends')
            .select('*', { count: 'exact', head: true })
            .eq('page_id', pageRes.data.id),
        ]);
        setFirstPhotoCount(photos || 0);
        setAssociatedFriendsCount(friends || 0);
      }
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

  // Auto-complete onboarding when the final step (publish + share) is fully done
  useEffect(() => {
    if (currentStep === 6 && hasBirthdayPage && isPagePublished && shareCount >= 3) {
      confetti({ particleCount: 100, spread: 120, origin: { y: 0.5 }, colors: ['#a855f7', '#ec4899', '#f97316', '#22c55e'] });
      const timer = setTimeout(() => {
        onComplete();
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [hasBirthdayPage, isPagePublished, shareCount, currentStep, onComplete]);

  // Build category_name list from selected tastes
  const tasteCategoryNames = useMemo(() => {
    if (!selectedCategories.length) return [];
    return selectedCategories.flatMap(taste => TASTE_TO_PRODUCT_CATEGORIES[taste] || []);
  }, [selectedCategories]);

  // Load wishlist products when reaching step 2 (souhaits)
  useEffect(() => {
    if (currentStep !== 2 || !user) return;
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
        setBirthdayPageId(existing.id);
        // Link fund if present and not yet linked
        if (fundId) {
          await supabase
            .from('birthday_pages')
            .update({ fund_id: fundId })
            .eq('id', existing.id)
            .is('fund_id', null);
        }
        confetti({ particleCount: 80, spread: 100, origin: { y: 0.5 }, colors: ['#a855f7', '#ec4899', '#f97316', '#22c55e'] });
        window.dispatchEvent(new Event('feed-refresh'));
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
          fund_id: fundId || null,
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

  // Publish the existing draft birthday page
  const handlePublishBirthdayPage = async () => {
    if (!user || !birthdayPageId || publishingNow) return;
    setPublishingNow(true);
    try {
      const { error } = await supabase
        .from('birthday_pages')
        .update({
          published_at: new Date().toISOString(),
          published_via_onboarding: true,
          ...(fundId ? { fund_id: fundId } : {}),
        })
        .eq('id', birthdayPageId);
      if (error) {
        console.error('Publish page error:', error);
        toast.error('Erreur lors de la publication');
        return;
      }
      setIsPagePublished(true);
      confetti({ particleCount: 100, spread: 110, origin: { y: 0.5 }, colors: ['#a855f7', '#ec4899', '#f97316', '#22c55e'] });
      toast.success('🎉 Ta page est publiée !');
      window.dispatchEvent(new Event('feed-refresh'));
    } catch (err) {
      console.error('Publish error:', err);
      toast.error('Erreur inattendue');
    } finally {
      setPublishingNow(false);
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
      // Link fund to birthday page if page exists
      if (birthdayPageId) {
        await supabase
          .from('birthday_pages')
          .update({ fund_id: data.id })
          .eq('id', birthdayPageId)
          .is('fund_id', null);
        window.dispatchEvent(new Event('feed-refresh'));
      }
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 }, colors: ['#a855f7', '#ec4899', '#f97316'] });
      toast.success('Cagnotte créée ! 🎉');
      return true;
    }
    return false;
  }, [user, birthdayPageId]);

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
      case 1: return selectedCategories.length >= 1;
      case 2: return favoriteIds.length >= 3;
      case 3: return pageType !== null;
      case 4: return hasFund || fundSkipped;
      case 5: return firstPhotoCount >= 1;
      case 6: return hasBirthdayPage && isPagePublished && shareCount >= 3;
      default: return false;
    }
  };

  const stepHintMessage = (step: number): string => {
    switch (step) {
      case 1: return "Choisis au moins une catégorie de cadeau 🎁";
      case 2: return "Ajoute au moins 3 articles à ta liste de souhaits ❤️";
      case 3: return "Choisis le type de page (toi, un proche, ou un événement) 🏷️";
      case 4: return "Crée ta cagnotte ou clique sur « Plus tard » 🎁";
      case 5: return "Ajoute une première photo à ton album 📸";
      case 6: return "Publie ta page et partage-la avec 3 amis 🚀";
      default: return "Complète cette étape pour continuer";
    }
  };

  const canGoNext = isStepCompleted(currentStep) && !(currentStep === 1 && savingCategories);

  const handleNext = async () => {
    if (!isStepCompleted(currentStep)) {
      toast.info(stepHintMessage(currentStep));
      return;
    }
    if (currentStep === 1 && user) {
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
              if (currentStep === 1 && savingCategories) {
                toast.info('Sauvegarde en cours...');
                return;
              }
              if (currentStep < DYNAMIC_TOTAL_STEPS - 1) onSetStep(currentStep + 1);
            }}
            disabled={currentStep >= DYNAMIC_TOTAL_STEPS - 1 || (currentStep === 1 && savingCategories)}
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

          {/* Step 1: Goûts (anciennement step 2) — date d'anniversaire supprimée car déjà capturée par PreAuthDiscovery */}
          {currentStep === 1 && (
            <motion.div
              key="tastes-redirect"
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

          {/* Step 2: Wishlist (anciennement step 3) */}
          {currentStep === 2 && (
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

              <Button
                onClick={() => setShowJumiaModal(true)}
                variant="outline"
                className="gap-2 w-full mb-4 border-orange-400 text-orange-600 hover:bg-orange-50 hover:text-orange-700 dark:hover:bg-orange-950/30"
              >
                <ShoppingBag className="h-4 w-4" />
                Ajouter un produit depuis Jumia
              </Button>

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

          {/* Step 3: Type de page */}
          {currentStep === 3 && (
            <motion.div
              key="type"
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
                <Tag className="h-10 w-10 text-white" />
              </motion.div>
              <h2 className="text-2xl font-poppins font-bold text-foreground mb-2">
                Choisis le type de page 🏷️
              </h2>
              <p className="text-muted-foreground font-nunito mb-6 text-sm">
                Pour qui crées-tu cette page ?
              </p>
              <div className="space-y-3 text-left">
                {[
                  { value: 'self' as PageType, label: 'Pour moi-même', desc: "Crée ta propre page d'anniversaire", Icon: Cake },
                  { value: 'friend' as PageType, label: 'Pour un proche', desc: 'Surprends un(e) ami(e) ou un proche', Icon: UserPlus },
                  { value: 'other_event' as PageType, label: 'Autre événement', desc: 'Mariage, baptême, diplôme…', Icon: CalendarIcon },
                ].map(({ value, label, desc, Icon }) => {
                  const selected = pageType === value;
                  return (
                    <button
                      key={value}
                      onClick={() => setPageType(value)}
                      className={cn(
                        'w-full p-4 rounded-xl border-2 flex items-center gap-3 transition-all text-left',
                        selected ? 'border-primary bg-primary/10 shadow-md' : 'border-border bg-card hover:border-primary/40'
                      )}
                    >
                      <div className={cn('w-10 h-10 rounded-full flex items-center justify-center shrink-0', selected ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary')}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-poppins font-semibold text-foreground">{label}</p>
                        <p className="text-xs text-muted-foreground font-nunito">{desc}</p>
                      </div>
                      {selected && <Check className="h-5 w-5 text-primary shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Step 4: Cagnotte */}
          {currentStep === 4 && (
            <motion.div
              key="fund-step"
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
                Crée ta cagnotte 🎁
              </h2>
              <p className="text-muted-foreground font-nunito mb-6 text-sm leading-relaxed">
                {hasFund
                  ? 'Ta cagnotte est en place ✨'
                  : 'Une cagnotte permet à tes proches de cotiser ensemble pour ton cadeau de rêve.'}
              </p>

              {hasFund ? (
                <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 mb-4">
                  <Check className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm font-poppins font-semibold text-foreground">Cagnotte créée !</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <Button
                    onClick={() => setShowFundPickerModal(true)}
                    className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 gap-2"
                    size="lg"
                  >
                    <Gift className="h-4 w-4" />
                    Créer ma cagnotte
                  </Button>
                  <Button onClick={skipFund} variant="ghost" className="w-full text-sm text-muted-foreground">
                    Plus tard
                  </Button>
                </div>
              )}
            </motion.div>
          )}

          {/* Step 5: Première photo */}
          {currentStep === 5 && (
            <OnboardingFirstPhotoStep
              birthdayPageId={birthdayPageId}
              birthdayPageSlug={birthdayPageSlug}
              firstName={firstName}
              initialPhotoCount={firstPhotoCount}
              onPhotoUploaded={() => setFirstPhotoCount((c) => c + 1)}
              onPageCreated={(p) => {
                setBirthdayPageId(p.id);
                setBirthdayPageSlug(p.slug);
                setHasBirthdayPage(true);
              }}
            />
          )}

          {/* Step 6: Publish + Share */}
          {currentStep === 6 && (
            <motion.div
              key="birthday-page-full"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              className="text-center max-w-md mx-auto w-full"
            >
              {/* All 3 sub-steps complete → success */}
              {hasBirthdayPage && isPagePublished && shareCount >= 3 ? (
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
                    Ta page est créée, publiée et partagée !
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

                    {/* Sub-step 2: Publish page */}
                    <div className={cn(
                      "p-4 rounded-xl border transition-all",
                      isPagePublished
                        ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700"
                        : !hasBirthdayPage
                          ? "bg-muted/50 border-border opacity-60"
                          : "bg-card border-border"
                    )}>
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                          isPagePublished ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"
                        )}>
                          {isPagePublished ? <Check className="h-4 w-4" /> : <span className="text-sm font-bold">2</span>}
                        </div>
                        <div className="flex-1">
                          <p className="font-poppins font-semibold text-sm text-foreground">
                            Publier ma page
                          </p>
                          <p className="text-xs text-muted-foreground font-nunito">
                            {isPagePublished ? "✅ Page publiée et visible dans le fil !" : "Rends ta page visible par tes proches"}
                          </p>
                        </div>
                        {!isPagePublished && hasBirthdayPage && (
                          <Button
                            onClick={handlePublishBirthdayPage}
                            disabled={publishingNow}
                            size="sm"
                            className="shrink-0 bg-gradient-to-r from-primary to-accent hover:opacity-90"
                          >
                            {publishingNow ? '...' : 'Publier'}
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Sub-step 3: Share */}
                    <div className={cn(
                      "p-4 rounded-xl border transition-all",
                      shareCount >= 3
                        ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700"
                        : !isPagePublished
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
                      {isPagePublished && shareCount < 3 && (
                        <div className="ml-11 space-y-3">
                          <SharingTipsBubbles />
                          <Button
                            onClick={() => setShowShareSheet(true)}
                            size="sm"
                            className="gap-2 w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground"
                          >
                            <Share2 className="h-4 w-4" />
                            Partager ma page
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Progress indicator */}
                  <div className="mb-4">
                    <Progress
                      value={((hasBirthdayPage ? 1 : 0) + (isPagePublished ? 1 : 0) + (shareCount >= 3 ? 1 : 0)) / 3 * 100}
                      className="h-2"
                      indicatorClassName="bg-gradient-to-r from-primary to-accent"
                    />
                    <p className="text-xs text-muted-foreground font-nunito mt-1">
                      {(hasBirthdayPage ? 1 : 0) + (isPagePublished ? 1 : 0) + (shareCount >= 3 ? 1 : 0)}/3 étapes complétées
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
      <JumiaImportModal
        isOpen={showJumiaModal}
        onClose={() => setShowJumiaModal(false)}
      />
      {birthdayPageSlug && (
        <BirthdayPageShareButton
          open={showShareSheet}
          onOpenChange={setShowShareSheet}
          firstName={firstName || 'moi'}
          pageUrl={`${getAppBaseUrl()}/birthday/${birthdayPageSlug}`}
          onShared={(method) => incrementShareCount(method)}
        />
      )}
    </motion.div>
  );
};
