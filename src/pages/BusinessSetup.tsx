import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import {
  ArrowLeft, ArrowRight, Check, Store, Package, Truck, Wallet,
  Bell, Share2, PartyPopper, Sparkles, ChevronLeft, X, Rocket,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useSelectedBusiness } from '@/contexts/SelectedBusinessContext';
import { useBusinessOnboarding } from '@/hooks/useBusinessOnboarding';
import { useBusinessSetupTier, TIER_DEFINITIONS } from '@/hooks/useBusinessSetupTier';
import { SetupTierBadge, NextTierTeaser } from '@/components/business-setup/SetupTierBadge';
import { SetupBenefitsBanner } from '@/components/business-setup/SetupBenefitsBanner';
import { BusinessAssistantFAB } from '@/components/business-setup/BusinessAssistantFAB';
import { AddProductModal } from '@/components/AddProductModal';
import { BusinessPushNotificationPrompt } from '@/components/BusinessPushNotificationPrompt';
import { BusinessSelector } from '@/components/BusinessSelector';
import { supabase } from '@/integrations/supabase/client';

interface SetupStepDef {
  id: 'welcome' | 'profile' | 'first-product' | 'delivery' | 'payment' | 'launch';
  title: string;
  subtitle: string;
  benefit: string;
  icon: React.ComponentType<{ className?: string }>;
  duration: string;
}

const STEPS: SetupStepDef[] = [
  {
    id: 'welcome',
    title: 'Lancez votre boutique en 5 minutes',
    subtitle: 'Quelques étapes simples pour transformer votre activité en succès local.',
    benefit: 'Les boutiques entièrement configurées vendent en moyenne 4× plus dès le premier mois.',
    icon: Rocket,
    duration: '~5 min au total',
  },
  {
    id: 'profile',
    title: 'Habillez votre boutique',
    subtitle: 'Logo, description et catégorie : votre vitrine doit donner envie d’entrer.',
    benefit: 'Une boutique avec logo + description complète reçoit 3,2× plus de clics.',
    icon: Store,
    duration: '~1 min',
  },
  {
    id: 'first-product',
    title: 'Ajoutez vos premiers produits',
    subtitle: 'Visez 3 produits pour démarrer, 5 pour atteindre le palier Or.',
    benefit: 'Ajouter 3 produits ou plus multiplie par 5 vos chances de recevoir une commande.',
    icon: Package,
    duration: '~2 min par produit',
  },
  {
    id: 'delivery',
    title: 'Configurez la livraison',
    subtitle: 'Définissez vos zones et frais pour rassurer vos clients.',
    benefit: 'Les boutiques avec livraison configurée sont 70% plus souvent contactées.',
    icon: Truck,
    duration: '~1 min',
  },
  {
    id: 'payment',
    title: 'Activez les paiements',
    subtitle: 'Mobile Money, Wave : encaissez sans friction.',
    benefit: 'Avec un moyen de paiement local, vous convertissez 2× plus de visiteurs en acheteurs.',
    icon: Wallet,
    duration: '~30 s',
  },
  {
    id: 'launch',
    title: 'C’est parti !',
    subtitle: 'Activez les notifications et partagez votre boutique pour décoller.',
    benefit: 'Partager votre boutique génère en moyenne 12 visites supplémentaires la première semaine.',
    icon: PartyPopper,
    duration: '~30 s',
  },
];

export default function BusinessSetup() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isNewBusiness = searchParams.get('new') === 'true';
  const { user } = useAuth();
  const { selectedBusinessId, selectedBusiness, loading: loadingSelector } = useSelectedBusiness();

  const {
    steps: hookSteps,
    progress,
    completedCount,
    totalSteps,
    isOnboardingComplete,
    refreshState,
  } = useBusinessOnboarding(selectedBusinessId || undefined);

  const { tier, currentInfo, nextTier, nextInfo, refetch: refetchTier } =
    useBusinessSetupTier(selectedBusinessId);

  const [stepIndex, setStepIndex] = useState(0);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showPushPrompt, setShowPushPrompt] = useState(false);
  const [productCount, setProductCount] = useState<number>(0);
  const [previousTier, setPreviousTier] = useState<string>('none');

  const currentDef = STEPS[stepIndex];

  // Map hookSteps -> isCompleted for our 5 actionable steps
  const completionMap = {
    profile: hookSteps.find(s => s.id === 'profile')?.isCompleted ?? false,
    'first-product': hookSteps.find(s => s.id === 'first-product')?.isCompleted ?? false,
    delivery: hookSteps.find(s => s.id === 'delivery')?.isCompleted ?? false,
    payment: hookSteps.find(s => s.id === 'payment')?.isCompleted ?? false,
    notifications: hookSteps.find(s => s.id === 'notifications')?.isCompleted ?? false,
  };

  // Load product count for the "ajoutez vos produits" step
  const loadProductCount = useCallback(async () => {
    if (!selectedBusinessId) return;
    const { count } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', selectedBusinessId);
    setProductCount(count || 0);
  }, [selectedBusinessId]);

  useEffect(() => { loadProductCount(); }, [loadProductCount]);

  // Confetti on welcome
  useEffect(() => {
    if (stepIndex === 0 && isNewBusiness) {
      const t = setTimeout(() => {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.4 },
          colors: ['#7A5DC7', '#C084FC', '#FAD4E1', '#F7C948'],
        });
      }, 300);
      return () => clearTimeout(t);
    }
  }, [stepIndex, isNewBusiness]);

  // Celebrate when tier increases (skip the initial 'none' → 'none' baseline)
  useEffect(() => {
    if (tier !== previousTier && tier !== 'none') {
      const info = TIER_DEFINITIONS[tier];
      confetti({
        particleCount: 160,
        spread: 100,
        origin: { y: 0.5 },
        colors: ['#F59E0B', '#FCD34D', '#7A5DC7', '#C084FC'],
      });
      toast.success(`${info.emoji} Palier ${info.label} débloqué !`, {
        description: info.reward,
        duration: 5000,
      });
    }
    setPreviousTier(tier);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tier]);

  // Auto-skip steps already completed when navigating forward
  const goNext = () => {
    if (stepIndex < STEPS.length - 1) {
      setStepIndex(s => s + 1);
    } else {
      finishSetup();
    }
  };
  const goBack = () => {
    if (stepIndex > 0) setStepIndex(s => s - 1);
    else navigate('/business-account');
  };

  const finishSetup = () => {
    if (selectedBusinessId) {
      localStorage.setItem(`business_onboarding_completed_${selectedBusinessId}`, 'true');
    }
    navigate('/business-account');
  };

  const refreshAll = useCallback(async () => {
    await Promise.all([refreshState(), refetchTier(), loadProductCount()]);
  }, [refreshState, refetchTier, loadProductCount]);

  const handleShareShop = async () => {
    if (!selectedBusinessId) return;
    const url = `${window.location.origin}/boutique/${selectedBusinessId}`;
    const text = `Découvrez ma boutique sur JOIE DE VIVRE 🎁\n${selectedBusiness?.business_name ?? ''}\n${url}`;
    if (navigator.share) {
      try { await navigator.share({ title: selectedBusiness?.business_name, text, url }); }
      catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(text);
      toast.success('Lien copié — partagez-le sur WhatsApp !');
    }
  };

  // Empty / loading guard
  if (!loadingSelector && !selectedBusinessId) {
    return (
      <div className="min-h-screen bg-gradient-background flex items-center justify-center p-6">
        <Card className="p-8 max-w-md text-center space-y-4">
          <Store className="w-12 h-12 mx-auto text-primary" />
          <h2 className="font-poppins text-xl font-semibold">Aucune boutique sélectionnée</h2>
          <p className="text-sm text-muted-foreground">
            Créez d’abord votre boutique pour démarrer la configuration.
          </p>
          <Button onClick={() => navigate('/business-account')} className="w-full">
            Retour à mon espace
          </Button>
        </Card>
      </div>
    );
  }

  const totalProgress = ((stepIndex + 1) / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-background">
      {/* Top bar */}
      <header className="bg-card/80 backdrop-blur-sm sticky top-0 z-40 border-b border-border/50">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/business-account')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground font-nunito">Configuration boutique</p>
            <p className="text-sm font-poppins font-semibold truncate">
              {selectedBusiness?.business_name ?? 'Ma boutique'}
            </p>
          </div>
          <SetupTierBadge tier={tier} size="sm" />
        </div>
        <div className="max-w-3xl mx-auto px-4 pb-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
            <span>Étape {stepIndex + 1} / {STEPS.length}</span>
            <span>{completedCount} / {totalSteps} actions complétées</span>
          </div>
          <Progress value={totalProgress} className="h-2" />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 pb-24">
        {/* Tier card */}
        <Card className="p-4 mb-6 border-primary/20 bg-gradient-to-br from-background to-secondary/30">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${currentInfo.gradientClass} flex items-center justify-center text-2xl shadow-md`}>
              {currentInfo.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-poppins font-semibold text-sm">{currentInfo.label}</p>
              <p className="text-xs text-muted-foreground">{currentInfo.description}</p>
            </div>
          </div>
          {nextInfo && (
            <div className="mt-3 pt-3 border-t border-border/50">
              <NextTierTeaser nextTier={nextTier} />
            </div>
          )}
        </Card>

        {/* Animated step content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentDef.id}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.25 }}
          >
            <Card className="p-6 mb-4 border-border/60">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-soft flex-shrink-0">
                  <currentDef.icon className="w-7 h-7 text-primary-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
                      {currentDef.duration}
                    </Badge>
                  </div>
                  <h1 className="font-poppins font-bold text-xl text-foreground leading-tight">
                    {currentDef.title}
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    {currentDef.subtitle}
                  </p>
                </div>
              </div>

              <SetupBenefitsBanner benefit={currentDef.benefit} />

              {/* Step-specific body */}
              <div className="mt-5">
                {currentDef.id === 'welcome' && (
                  <WelcomeBody
                    productCount={productCount}
                    onStart={() => setStepIndex(1)}
                  />
                )}

                {currentDef.id === 'profile' && (
                  <ActionRow
                    completed={completionMap.profile}
                    completedLabel="Profil complet ✓"
                    actionLabel={completionMap.profile ? 'Modifier mon profil' : 'Configurer le profil'}
                    onAction={() => navigate('/business-profile-settings')}
                  />
                )}

                {currentDef.id === 'first-product' && (
                  <ProductBody
                    productCount={productCount}
                    onAdd={() => setShowAddProduct(true)}
                  />
                )}

                {currentDef.id === 'delivery' && (
                  <ActionRow
                    completed={completionMap.delivery}
                    completedLabel="Livraison configurée ✓"
                    actionLabel={completionMap.delivery ? 'Modifier la livraison' : 'Configurer la livraison'}
                    onAction={() => navigate('/business-profile-settings')}
                  />
                )}

                {currentDef.id === 'payment' && (
                  <ActionRow
                    completed={completionMap.payment}
                    completedLabel="Paiement configuré ✓"
                    actionLabel={completionMap.payment ? 'Modifier le paiement' : 'Configurer le paiement'}
                    onAction={() => navigate('/business-profile-settings')}
                  />
                )}

                {currentDef.id === 'launch' && (
                  <LaunchBody
                    pushOn={completionMap.notifications}
                    onEnablePush={() => setShowPushPrompt(true)}
                    onShare={handleShareShop}
                    tier={tier}
                  />
                )}
              </div>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Step dots */}
        <div className="flex items-center justify-center gap-2 my-4">
          {STEPS.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setStepIndex(i)}
              className={`h-2 rounded-full transition-all ${
                i === stepIndex
                  ? 'w-8 bg-primary'
                  : i < stepIndex
                  ? 'w-2 bg-success'
                  : 'w-2 bg-muted'
              }`}
              aria-label={`Aller à l’étape ${i + 1}`}
            />
          ))}
        </div>

        {/* Footer nav */}
        <div className="flex items-center justify-between gap-3 mt-2">
          <Button variant="ghost" onClick={goBack} className="gap-1">
            <ChevronLeft className="w-4 h-4" />
            {stepIndex === 0 ? 'Quitter' : 'Précédent'}
          </Button>
          {stepIndex < STEPS.length - 1 ? (
            <Button onClick={goNext} className="gap-2 bg-gradient-to-r from-primary to-accent">
              Continuer
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button onClick={finishSetup} className="gap-2 bg-gradient-to-r from-primary to-accent">
              Terminer
              <Check className="w-4 h-4" />
            </Button>
          )}
        </div>
      </main>

      {/* Modals */}
      <AddProductModal
        isOpen={showAddProduct}
        onClose={() => setShowAddProduct(false)}
        onProductAdded={() => {
          refreshAll();
        }}
      />
      <BusinessPushNotificationPrompt
        open={showPushPrompt}
        onClose={() => {
          setShowPushPrompt(false);
          refreshAll();
        }}
        businessId={selectedBusinessId || undefined}
      />
    </div>
  );
}

/* ----- Sub-components ----- */

const WelcomeBody = ({ productCount, onStart }: { productCount: number; onStart: () => void }) => (
  <div className="space-y-4">
    <ul className="space-y-2 text-sm">
      {[
        'Habillez votre vitrine (logo, description)',
        'Ajoutez vos premiers produits',
        'Activez livraison + paiement',
        'Lancez votre boutique 🚀',
      ].map((item, i) => (
        <li key={i} className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-primary/10 text-primary font-semibold text-xs flex items-center justify-center">
            {i + 1}
          </span>
          <span className="text-foreground/90">{item}</span>
        </li>
      ))}
    </ul>
    <Button onClick={onStart} className="w-full gap-2 bg-gradient-to-r from-primary to-accent" size="lg">
      <Sparkles className="w-4 h-4" />
      C’est parti !
    </Button>
    {productCount > 0 && (
      <p className="text-xs text-muted-foreground text-center">
        Vous avez déjà {productCount} produit{productCount > 1 ? 's' : ''} en ligne.
      </p>
    )}
  </div>
);

const ActionRow = ({
  completed, completedLabel, actionLabel, onAction,
}: {
  completed: boolean;
  completedLabel: string;
  actionLabel: string;
  onAction: () => void;
}) => (
  <div className={`rounded-lg border p-4 flex items-center gap-3 ${
    completed ? 'border-success/40 bg-success/5' : 'border-border bg-muted/30'
  }`}>
    {completed ? (
      <Check className="w-5 h-5 text-success flex-shrink-0" />
    ) : (
      <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/40 flex-shrink-0" />
    )}
    <span className="flex-1 text-sm font-medium">
      {completed ? completedLabel : 'À faire'}
    </span>
    <Button
      onClick={onAction}
      variant={completed ? 'outline' : 'default'}
      size="sm"
    >
      {actionLabel}
    </Button>
  </div>
);

const ProductBody = ({ productCount, onAdd }: { productCount: number; onAdd: () => void }) => {
  const target = 5;
  const pct = Math.min(100, (productCount / target) * 100);
  const remainingForGold = Math.max(0, target - productCount);
  const remainingForBronze = Math.max(0, 1 - productCount);
  const remainingForSilver = Math.max(0, 3 - productCount);

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Produits ajoutés</span>
          <span className="font-poppins font-bold text-lg">
            {productCount}<span className="text-muted-foreground text-sm font-normal"> / {target}</span>
          </span>
        </div>
        <Progress value={pct} className="h-2" />
        <div className="grid grid-cols-3 gap-2 mt-3 text-[11px] text-center">
          <div className={remainingForBronze === 0 ? 'text-success font-semibold' : 'text-muted-foreground'}>
            🥉 1 produit
          </div>
          <div className={remainingForSilver === 0 ? 'text-success font-semibold' : 'text-muted-foreground'}>
            🥈 3 produits
          </div>
          <div className={remainingForGold === 0 ? 'text-success font-semibold' : 'text-muted-foreground'}>
            🥇 5 produits
          </div>
        </div>
      </div>
      <Button onClick={onAdd} className="w-full gap-2 bg-gradient-to-r from-primary to-accent">
        <Package className="w-4 h-4" />
        {productCount === 0 ? 'Ajouter mon premier produit' : 'Ajouter un autre produit'}
      </Button>
    </div>
  );
};

const LaunchBody = ({
  pushOn, onEnablePush, onShare, tier,
}: {
  pushOn: boolean;
  onEnablePush: () => void;
  onShare: () => void;
  tier: string;
}) => (
  <div className="space-y-3">
    <ActionRow
      completed={pushOn}
      completedLabel="Notifications activées ✓"
      actionLabel={pushOn ? 'Gérer' : 'Activer les notifications'}
      onAction={onEnablePush}
    />
    <div className="rounded-lg border border-border bg-muted/30 p-4 flex items-center gap-3">
      <Share2 className="w-5 h-5 text-primary flex-shrink-0" />
      <span className="flex-1 text-sm font-medium">Partagez votre boutique</span>
      <Button onClick={onShare} size="sm">
        Partager
      </Button>
    </div>
    {tier === 'gold' && (
      <div className="rounded-lg bg-gradient-to-r from-amber-300/30 to-yellow-400/30 border border-amber-400/40 p-4 text-center">
        <p className="font-poppins font-semibold text-amber-700 dark:text-amber-300">
          🏆 Vous avez atteint le palier Or !
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Votre boutique bénéficie d’un boost de visibilité prioritaire.
        </p>
      </div>
    )}
  </div>
);