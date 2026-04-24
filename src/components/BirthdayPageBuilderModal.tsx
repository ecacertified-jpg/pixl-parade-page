import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Check,
  Heart,
  Users,
  Tag,
  Gift,
  Rocket,
  Share2,
  ChevronRight,
  Loader2,
  PartyPopper,
  Cake,
  User as UserIcon,
  UserPlus,
  Calendar,
  Pencil,
  X,
  Eye,
  Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { getAppBaseUrl } from '@/utils/appUrl';
import {
  useBirthdayPageBuilderStatus,
  type PageType,
} from '@/hooks/useBirthdayPageBuilderStatus';
import { WishlistFundPickerModal } from '@/components/WishlistFundPickerModal';
import { SearchExistingFundsModal } from '@/components/SearchExistingFundsModal';
import { BirthdayPageShareButton } from '@/components/BirthdayPageShareButton';
import { BirthdayPageFriendsPicker } from '@/components/BirthdayPageFriendsPicker';
import { getStoredFriendSelection, setStoredFriendSelection } from '@/hooks/useBirthdayPageBuilderStatus';

interface BirthdayPageBuilderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TYPE_OPTIONS: Array<{
  value: PageType;
  label: string;
  description: string;
  icon: typeof UserIcon;
}> = [
  {
    value: 'self',
    label: 'Pour moi-même',
    description: 'Crée ta propre page d\'anniversaire',
    icon: Cake,
  },
  {
    value: 'friend',
    label: 'Pour un proche',
    description: 'Surprends un ami(e) ou un membre de la famille',
    icon: UserPlus,
  },
  {
    value: 'other_event',
    label: 'Autre événement',
    description: 'Mariage, baptême, diplôme, promotion…',
    icon: Calendar,
  },
];

export function BirthdayPageBuilderModal({
  open,
  onOpenChange,
}: BirthdayPageBuilderModalProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { status, isLoading, invalidate, setPageType } =
    useBirthdayPageBuilderStatus();

  const [showTypePicker, setShowTypePicker] = useState(false);
  const [showFundPicker, setShowFundPicker] = useState(false);
  const [showSearchFunds, setShowSearchFunds] = useState(false);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [showFriendsPicker, setShowFriendsPicker] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [skippedFund, setSkippedFund] = useState(false);
  const [showEditFundAmount, setShowEditFundAmount] = useState(false);
  const [showCancelFundConfirm, setShowCancelFundConfirm] = useState(false);
  const [fundAmountInput, setFundAmountInput] = useState('');
  const [savingFundAmount, setSavingFundAmount] = useState(false);
  const [cancellingFund, setCancellingFund] = useState(false);
  const [profile, setProfile] = useState<{
    first_name: string | null;
    birthday: string | null;
  } | null>(null);

  // Load skipped fund flag from localStorage
  useEffect(() => {
    if (!user?.id) return;
    try {
      const v = localStorage.getItem(`bp_fund_skipped_${user.id}`);
      setSkippedFund(v === '1');
    } catch {}
  }, [user?.id]);

  const handleSkipFund = () => {
    if (!user?.id) return;
    try {
      localStorage.setItem(`bp_fund_skipped_${user.id}`, '1');
    } catch {}
    setSkippedFund(true);
    toast.message('Étape passée — tu pourras la créer plus tard');
  };

  const handleUnskipFund = () => {
    if (!user?.id) return;
    try {
      localStorage.removeItem(`bp_fund_skipped_${user.id}`);
    } catch {}
    setSkippedFund(false);
  };

  const openEditFundAmount = () => {
    setFundAmountInput(
      status?.fundTargetAmount ? String(status.fundTargetAmount) : '',
    );
    setShowEditFundAmount(true);
  };

  const handleSaveFundAmount = async () => {
    if (!status?.fundId) return;
    const amount = Number(fundAmountInput);
    if (!Number.isFinite(amount) || amount < 1000) {
      toast.error('Montant minimum : 1 000 XOF');
      return;
    }
    setSavingFundAmount(true);
    try {
      const { error } = await supabase
        .from('collective_funds')
        .update({ target_amount: amount })
        .eq('id', status.fundId);
      if (error) {
        console.error(error);
        toast.error('Erreur lors de la mise à jour');
        return;
      }
      toast.success('Montant mis à jour ✨');
      setShowEditFundAmount(false);
      invalidate();
    } finally {
      setSavingFundAmount(false);
    }
  };

  const handleCancelFund = async () => {
    if (!status?.fundId) return;
    setCancellingFund(true);
    try {
      const { error } = await supabase
        .from('collective_funds')
        .update({ status: 'cancelled' })
        .eq('id', status.fundId);
      if (error) {
        console.error(error);
        toast.error('Erreur lors de l\'annulation');
        return;
      }
      // Detach from page
      if (status.birthdayPageId) {
        await supabase
          .from('birthday_pages')
          .update({ fund_id: null })
          .eq('id', status.birthdayPageId);
      }
      toast.success('Cagnotte annulée');
      setShowCancelFundConfirm(false);
      invalidate();
    } finally {
      setCancellingFund(false);
    }
  };

  const handleViewFund = () => {
    if (!status?.fundId) return;
    onOpenChange(false);
    navigate(`/f/${status.fundId}`);
  };

  // Load minimal profile info (for share + publish)
  useEffect(() => {
    if (!user?.id || !open) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('first_name, birthday')
        .eq('user_id', user.id)
        .maybeSingle();
      if (!cancelled) setProfile(data as any);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, open]);

  // Refresh on feed-refresh events (fund creation, share, etc.)
  useEffect(() => {
    if (!open) return;
    const handler = () => invalidate();
    window.addEventListener('feed-refresh', handler);
    return () => window.removeEventListener('feed-refresh', handler);
  }, [open, invalidate]);

  const completed = status?.completedCount ?? 0;
  const total = status?.totalCount ?? 6;
  const progress = (completed / total) * 100;
  const allDone = completed === total;

  // Fire confetti once when reaching 6/6
  useEffect(() => {
    if (allDone && open) {
      confetti({
        particleCount: 120,
        spread: 110,
        origin: { y: 0.5 },
        colors: ['#a855f7', '#ec4899', '#f97316', '#22c55e'],
      });
    }
  }, [allDone, open]);

  const pageType = status?.pageType ?? null;

  // ---------- Step actions ----------
  const handleEditWishlist = () => {
    onOpenChange(false);
    navigate('/wishlist-catalog');
  };

  const handleEditFriends = () => {
    onOpenChange(false);
    navigate('/dashboard#cercle');
    setTimeout(() => {
      const el = document.getElementById('cercle');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 400);
  };

  const handlePickType = (value: PageType) => {
    setPageType(value);
    setShowTypePicker(false);
    toast.success('Type de page enregistré ✨');
  };

  const handleCreateFund = () => {
    if (!pageType) {
      setShowTypePicker(true);
      return;
    }
    if (pageType === 'self') {
      setShowFundPicker(true);
    } else {
      setShowSearchFunds(true);
    }
  };

  const handlePublishPage = async () => {
    if (!user || publishing) return;
    if (!pageType) {
      setShowTypePicker(true);
      return;
    }

    // For "friend" / "other_event" → redirect to event creation flow
    if (pageType !== 'self') {
      onOpenChange(false);
      const occasion = pageType === 'friend' ? 'birthday' : 'other';
      navigate(`/event/create?occasion=${occasion}`);
      return;
    }

    setPublishing(true);
    try {
      const currentYear = new Date().getFullYear();
      const slug = `${user.id.slice(0, 8)}-${currentYear}`;
      const firstName = profile?.first_name || 'mon ami(e)';

      const { data: existing } = await supabase
        .from('birthday_pages')
        .select('id, slug')
        .eq('user_id', user.id)
        .eq('celebration_year', currentYear)
        .maybeSingle();

      let pageId: string | null = null;
      if (existing) {
        pageId = existing.id;
        await supabase
          .from('birthday_pages')
          .update({
            published_at: new Date().toISOString(),
            published_via_onboarding: true,
            ...(status?.fundId ? { fund_id: status.fundId } : {}),
          })
          .eq('id', existing.id);
      } else {
        const { data: inserted, error } = await supabase.from('birthday_pages').insert({
          user_id: user.id,
          slug,
          title: `Anniversaire de ${firstName}`,
          celebration_year: currentYear,
          is_active: true,
          published_at: new Date().toISOString(),
          published_via_onboarding: true,
          fund_id: status?.fundId || null,
        }).select('id').single();
        if (error) {
          console.error('Publish page error:', error);
          toast.error('Erreur lors de la publication');
          return;
        }
        pageId = inserted?.id ?? null;
      }

      // Sync friends selected in localStorage to birthday_page_friends
      if (pageId) {
        const localFriends = getStoredFriendSelection(user.id);
        if (localFriends.length > 0) {
          await supabase
            .from('birthday_page_friends')
            .delete()
            .eq('page_id', pageId);
          const rows = localFriends.map((cid) => ({
            page_id: pageId!,
            contact_id: cid,
            added_by: user.id,
          }));
          await supabase.from('birthday_page_friends').insert(rows);
        }
      }

      confetti({
        particleCount: 80,
        spread: 100,
        origin: { y: 0.5 },
        colors: ['#a855f7', '#ec4899', '#f97316', '#22c55e'],
      });
      toast.success('Page publiée 🎉');
      window.dispatchEvent(new Event('feed-refresh'));
      invalidate();
    } catch (err) {
      console.error(err);
      toast.error('Erreur inattendue');
    } finally {
      setPublishing(false);
    }
  };

  const handleShareClick = () => {
    if (!status?.birthdayPageSlug) {
      toast.info('Publie d\'abord ta page pour pouvoir la partager');
      return;
    }
    setShowShareSheet(true);
  };

  // ---------- Steps definition ----------
  const steps = useMemo(() => {
    if (!status) return [];
    const s = status.steps;
    return [
      {
        key: 'wishlist',
        icon: Heart,
        title: 'Modifier ma liste de souhaits',
        description: `Ajoute au moins ${s.wishlist.target} cadeaux qui te font envie`,
        progressLabel:
          s.wishlist.value !== undefined
            ? `${Math.min(s.wishlist.value, s.wishlist.target!)} / ${s.wishlist.target}`
            : undefined,
        done: s.wishlist.done,
        cta: s.wishlist.done ? 'Modifier' : 'Compléter',
        onClick: handleEditWishlist,
        disabled: false,
      },
      {
        key: 'type',
        icon: Tag,
        title: 'Choisir le type de page',
        description:
          pageType === 'self'
            ? 'Pour moi-même'
            : pageType === 'friend'
            ? 'Pour un proche'
            : pageType === 'other_event'
            ? 'Autre événement'
            : 'Anniversaire pour soi, un proche, ou autre événement',
        done: s.type.done,
        cta: s.type.done ? 'Changer' : 'Choisir',
        onClick: () => setShowTypePicker(true),
        disabled: false,
      },
      {
        key: 'friends',
        icon: Users,
        title: 'Associer mes amis à ma page',
        description: s.friends.done
          ? `${s.friends.value} ami${(s.friends.value || 0) > 1 ? 's' : ''} associé${(s.friends.value || 0) > 1 ? 's' : ''} — recevront des rappels WhatsApp`
          : 'Sélectionne les amis qui recevront des rappels WhatsApp pour ton anniv',
        progressLabel:
          s.friends.value && s.friends.value > 0
            ? `${s.friends.value} sélectionné${s.friends.value > 1 ? 's' : ''}`
            : undefined,
        done: s.friends.done,
        cta: s.friends.done ? 'Modifier' : 'Sélectionner',
        onClick: () => setShowFriendsPicker(true),
        disabled: false,
      },
      {
        key: 'fund',
        icon: Gift,
        title: 'Créer ma cagnotte',
        description:
          pageType === 'self'
            ? 'Cagnotte pour le cadeau souhaité'
            : pageType
            ? 'Cotiser pour le cadeau d\'un proche'
            : 'Choisis d\'abord le type de page',
        done: s.fund.done,
        cta: s.fund.done ? 'Voir' : 'Créer',
        onClick: handleCreateFund,
        disabled: !pageType,
      },
      {
        key: 'publish',
        icon: Rocket,
        title: 'Publier ma page',
        description: s.publish.done
          ? 'Ta page est publiée et visible dans le fil'
          : 'Rends ta page visible par tes proches',
        done: s.publish.done,
        cta: s.publish.done ? 'Publiée' : 'Publier',
        onClick: handlePublishPage,
        disabled: !pageType || publishing,
        loading: publishing,
      },
      {
        key: 'share',
        icon: Share2,
        title: 'Partager ma page',
        description: `Partage à au moins ${s.share.target} personnes`,
        progressLabel:
          s.share.value !== undefined
            ? `${Math.min(s.share.value, s.share.target!)} / ${s.share.target}`
            : undefined,
        done: s.share.done,
        cta: s.share.done ? 'Partager encore' : 'Partager',
        onClick: handleShareClick,
        disabled: !s.publish.done,
      },
    ];
  }, [status, pageType, publishing]);

  const computeAge = (): number | undefined => {
    if (!profile?.birthday) return undefined;
    try {
      const [y, m, d] = profile.birthday.split('-').map(Number);
      if (!y) return undefined;
      const today = new Date();
      let age = today.getFullYear() - y;
      const monthDiff = today.getMonth() + 1 - m;
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < d)) age--;
      return age + 1; // age at next birthday
    } catch {
      return undefined;
    }
  };

  const pageUrl = status?.birthdayPageSlug
    ? `${getAppBaseUrl()}/birthday/${status.birthdayPageSlug}`
    : '';

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="rounded-t-3xl p-0 h-[90vh] max-h-[760px] flex flex-col"
        >
          <SheetHeader className="px-5 pt-5 pb-3 border-b border-border/40">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-pink-500/10">
                <Cake className="h-6 w-6 text-pink-500" />
              </div>
              <div className="flex-1 text-left">
                <SheetTitle className="text-lg sm:text-xl">Ma page d'anniversaire</SheetTitle>
                <SheetDescription className="text-xs">
                  {allDone
                    ? 'Bravo ! Toutes les étapes sont validées 🎉'
                    : 'Complète les étapes pour finaliser ta page'}
                </SheetDescription>
              </div>
              {allDone && <PartyPopper className="h-6 w-6 text-accent" />}
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-foreground">
                  Progression
                </span>
                <span className="text-muted-foreground">
                  {completed} / {total} étapes
                </span>
              </div>
              <Progress
                value={progress}
                className="h-2"
                indicatorClassName={cn(
                  allDone
                    ? 'bg-gradient-to-r from-green-400 to-emerald-500'
                    : 'bg-gradient-to-r from-primary to-accent',
                )}
              />
            </div>
          </SheetHeader>

          <ScrollArea className="flex-1 px-3 sm:px-4 py-3">
            {isLoading || !status ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-2.5 pb-24">
                {steps.map((step, index) => {
                  if (step.key === 'fund') {
                    return (
                      <FundStepCard
                        key={step.key}
                        index={index + 1}
                        icon={step.icon}
                        title={step.title}
                        description={step.description}
                        done={step.done}
                        disabled={step.disabled}
                        skipped={skippedFund}
                        contributionsCount={status.fundContributionsCount}
                        onCreate={handleCreateFund}
                        onSkip={handleSkipFund}
                        onUnskip={handleUnskipFund}
                        onView={handleViewFund}
                        onEditAmount={openEditFundAmount}
                        onCancel={() => setShowCancelFundConfirm(true)}
                      />
                    );
                  }
                  return (
                    <StepCard
                      key={step.key}
                      index={index + 1}
                      icon={step.icon}
                      title={step.title}
                      description={step.description}
                      done={step.done}
                      cta={step.cta}
                      onClick={step.onClick}
                      disabled={step.disabled}
                      loading={(step as any).loading}
                      progressLabel={(step as any).progressLabel}
                    />
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Type picker (sub-sheet) */}
      <Sheet open={showTypePicker} onOpenChange={setShowTypePicker}>
        <SheetContent side="bottom" className="rounded-t-3xl">
          <SheetHeader className="mb-4">
            <SheetTitle>Choisir le type de page</SheetTitle>
            <SheetDescription>
              Selon ton choix, on adapte la création de la cagnotte.
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-3 pb-6">
            {TYPE_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const isActive = pageType === opt.value;
              return (
                <Button
                  key={opt.value}
                  variant="outline"
                  className={cn(
                    'w-full h-auto py-4 px-4 justify-start gap-4 border-border/50 transition-all',
                    isActive
                      ? 'border-primary bg-primary/5'
                      : 'hover:border-primary/30 hover:bg-primary/5',
                  )}
                  onClick={() => handlePickType(opt.value)}
                >
                  <div
                    className={cn(
                      'p-2 rounded-xl',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground',
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium text-foreground">
                      {opt.label}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {opt.description}
                    </p>
                  </div>
                  {isActive && (
                    <Check className="h-5 w-5 text-primary shrink-0" />
                  )}
                </Button>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>

      {/* Fund creation flows */}
      <WishlistFundPickerModal
        isOpen={showFundPicker}
        onClose={() => {
          setShowFundPicker(false);
          // poll a few times for new fund
          let n = 0;
          const itv = setInterval(() => {
            n++;
            invalidate();
            if (n >= 6) clearInterval(itv);
          }, 5000);
        }}
      />
      <SearchExistingFundsModal
        isOpen={showSearchFunds}
        onClose={() => setShowSearchFunds(false)}
        onCreateNew={() => {
          setShowSearchFunds(false);
          setShowFundPicker(true);
        }}
      />

      {/* Friends picker (sub-sheet) */}
      <BirthdayPageFriendsPicker
        open={showFriendsPicker}
        onOpenChange={setShowFriendsPicker}
        pageId={status?.birthdayPageId ?? null}
        onSaved={() => invalidate()}
      />

      {/* Share */}
      {status?.birthdayPageSlug && (
        <BirthdayPageShareButton
          open={showShareSheet}
          onOpenChange={(o) => {
            setShowShareSheet(o);
            if (!o) {
              // refresh on close to pick up share count
              setTimeout(() => invalidate(), 600);
            }
          }}
          firstName={profile?.first_name || 'moi'}
          pageUrl={pageUrl}
          age={computeAge()}
        />
      )}

      {/* Edit fund amount sub-sheet */}
      <Sheet open={showEditFundAmount} onOpenChange={setShowEditFundAmount}>
        <SheetContent side="bottom" className="rounded-t-3xl">
          <SheetHeader className="mb-4">
            <SheetTitle>Modifier le montant</SheetTitle>
            <SheetDescription>
              Définis un nouvel objectif pour ta cagnotte (min. 1 000 XOF).
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 pb-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Montant cible (XOF)
              </label>
              <Input
                type="number"
                inputMode="numeric"
                min={1000}
                step={500}
                value={fundAmountInput}
                onChange={(e) => setFundAmountInput(e.target.value)}
                placeholder="Ex: 25000"
                className="mt-1.5"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowEditFundAmount(false)}
                disabled={savingFundAmount}
              >
                Annuler
              </Button>
              <Button
                className="flex-1"
                onClick={handleSaveFundAmount}
                disabled={savingFundAmount}
              >
                {savingFundAmount ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Enregistrer'
                )}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Cancel fund confirmation */}
      <AlertDialog
        open={showCancelFundConfirm}
        onOpenChange={setShowCancelFundConfirm}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Annuler la cagnotte ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La cagnotte sera désactivée et
              détachée de ta page d'anniversaire.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancellingFund}>
              Retour
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleCancelFund();
              }}
              disabled={cancellingFund}
              className="bg-destructive hover:bg-destructive/90"
            >
              {cancellingFund ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Annuler la cagnotte'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ---------- Step card ----------
interface StepCardProps {
  index: number;
  icon: any;
  title: string;
  description: string;
  done: boolean;
  cta: string;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  progressLabel?: string;
}

function StepCard({
  index,
  icon: Icon,
  title,
  description,
  done,
  cta,
  onClick,
  disabled,
  loading,
  progressLabel,
}: StepCardProps) {
  return (
    <Card
      className={cn(
        'p-3 transition-all',
        done
          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900/40'
          : 'border-border/50',
      )}
    >
      {/* Row 1: pastille + icon + title + status badge */}
      <div className="flex items-center gap-2.5">
        <div
          className={cn(
            'h-8 w-8 shrink-0 rounded-full flex items-center justify-center font-semibold text-xs',
            done ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground',
          )}
        >
          {done ? <Check className="h-4 w-4" /> : index}
        </div>
        <Icon
          className={cn(
            'h-4 w-4 shrink-0',
            done ? 'text-green-600' : 'text-primary',
          )}
        />
        <span className="font-medium text-sm text-foreground flex-1 min-w-0 truncate">
          {title}
        </span>
        {done ? (
          <Badge
            variant="secondary"
            className="text-[10px] bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 shrink-0"
          >
            ✅ Fait
          </Badge>
        ) : progressLabel ? (
          <Badge variant="outline" className="text-[10px] shrink-0">
            {progressLabel}
          </Badge>
        ) : null}
      </div>

      {/* Row 2: description */}
      <p className="text-xs text-muted-foreground mt-1.5 ml-[42px] line-clamp-2">
        {description}
      </p>

      {/* Row 3: full-width CTA */}
      <Button
        size="sm"
        variant={done ? 'outline' : 'default'}
        className="w-full mt-2.5 h-9"
        onClick={onClick}
        disabled={disabled || loading}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            {cta}
            <ChevronRight className="h-3.5 w-3.5 ml-1" />
          </>
        )}
      </Button>
    </Card>
  );
}
