import { useMemo, useState } from 'react';
import { Check, Crown, Sparkles, Star, Smartphone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { usePlan } from '@/features/subscription/usePlan';
import { PLAN_ORDER, PlanTier } from '@/features/subscription/types';
import { WaveCheckoutModal } from '@/features/subscription/WaveCheckoutModal';
import { usePendingWaveRequest } from '@/features/subscription/useWaveCheckout';
import { WavePendingCard } from '@/features/subscription/WavePendingCard';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
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

type Currency = 'EUR' | 'XOF';

const FORMATTERS: Record<Currency, (v: number) => string> = {
  EUR: (v) => `${v.toFixed(2).replace('.', ',')} €`,
  XOF: (v) => `${new Intl.NumberFormat('fr-FR').format(v)} FCFA`,
};

const FEATURE_ROWS: { tier: PlanTier; lines: string[] }[] = [
  {
    tier: 'free',
    lines: [
      '1 page événement active',
      '20 photos par album',
      '1 cagnotte collective',
      'Suggestions IA limitées',
      'Support communautaire',
    ],
  },
  {
    tier: 'essentiel',
    lines: [
      'Jusqu’à 5 pages événement',
      '100 photos par album + export PDF',
      'Commission cagnotte réduite (3 %)',
      'Vidéo de couverture 720p',
      'Badge public Essentiel',
      'Support email sous 48 h',
    ],
  },
  {
    tier: 'premium',
    lines: [
      'Pages, cagnottes et albums illimités',
      'Vidéo HD 1080p + animations',
      'Export album PDF + vidéo souvenir',
      '0 % de commission sur les cagnottes',
      'Thèmes émotionnels exclusifs',
      'Badge Premium doré + halo profil',
      'Support WhatsApp prioritaire 24 h',
    ],
  },
];

const TIER_ICON: Record<PlanTier, JSX.Element> = {
  free: <Star className="h-5 w-5" />,
  essentiel: <Sparkles className="h-5 w-5" />,
  premium: <Crown className="h-5 w-5" />,
};

export default function Pricing() {
  const { allPlans, tier: currentTier, isLoading } = usePlan();
  const { user } = useAuth();
  const { data: pending } = usePendingWaveRequest();
  const [cycle, setCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [currency, setCurrency] = useState<Currency>('EUR');
  const [waveOpen, setWaveOpen] = useState<{ tier: 'essentiel' | 'premium' } | null>(null);
  const [downgradeTarget, setDowngradeTarget] = useState<'free' | 'essentiel' | null>(null);
  const [downgrading, setDowngrading] = useState(false);

  const handleDowngrade = async () => {
    if (!downgradeTarget) return;
    setDowngrading(true);
    try {
      const { data, error } = await supabase.functions.invoke('schedule-plan-downgrade', {
        body: { target_tier: downgradeTarget },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      const when = (data as any)?.effective_at
        ? new Date((data as any).effective_at).toLocaleDateString('fr-FR')
        : 'la fin de période';
      toast.success(`Changement programmé pour le ${when} 💛`);
      setDowngradeTarget(null);
    } catch (e: any) {
      toast.error(e?.message || 'Impossible de programmer le changement');
    } finally {
      setDowngrading(false);
    }
  };

  const ordered = useMemo(
    () => [...allPlans].sort((a, b) => a.sort_order - b.sort_order),
    [allPlans]
  );

  const priceFor = (tier: PlanTier) => {
    const plan = ordered.find((p) => p.tier === tier);
    if (!plan) return 0;
    if (currency === 'EUR') {
      return cycle === 'monthly' ? plan.price_eur_monthly : plan.price_eur_yearly;
    }
    return cycle === 'monthly' ? plan.price_xof_monthly : plan.price_xof_yearly;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-secondary/30 to-background">
      <header className="mx-auto max-w-5xl px-4 pt-12 pb-8 text-center md:pt-20">
        <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/15">
          Joie de Vivre Africa
        </Badge>
        <h1 className="font-poppins text-3xl font-semibold text-foreground md:text-5xl">
          Célèbre les tiens. <span className="text-primary">Sans limite.</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
          Choisis le plan qui te ressemble — pour préparer, célébrer et garder en
          souvenir chaque moment heureux.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <div className="flex items-center gap-3 rounded-full border bg-background/60 px-4 py-2 shadow-soft">
            <span className={cn('text-sm', cycle === 'monthly' && 'font-semibold')}>Mensuel</span>
            <Switch
              checked={cycle === 'yearly'}
              onCheckedChange={(v) => setCycle(v ? 'yearly' : 'monthly')}
              aria-label="Basculer entre mensuel et annuel"
            />
            <span className={cn('text-sm', cycle === 'yearly' && 'font-semibold')}>
              Annuel <span className="text-primary">-20 %</span>
            </span>
          </div>

          <div className="inline-flex rounded-full border bg-background/60 p-1 shadow-soft">
            {(['EUR', 'XOF'] as const).map((c) => (
              <button
                key={c}
                onClick={() => setCurrency(c)}
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-medium transition',
                  currency === c
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {c === 'EUR' ? '€ EUR' : 'FCFA'}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-20">
        {pending && (
          <div className="mx-auto mb-6 max-w-xl">
            <WavePendingCard request={pending} />
          </div>
        )}
        <div className="grid gap-6 md:grid-cols-3">
          {FEATURE_ROWS.map(({ tier, lines }) => {
            const plan = ordered.find((p) => p.tier === tier);
            const isCurrent = currentTier === tier;
            const isHighlight = tier === 'premium';
            const price = priceFor(tier);
            const isFree = tier === 'free';

            return (
              <Card
                key={tier}
                className={cn(
                  'relative flex flex-col gap-5 p-6 transition',
                  isHighlight
                    ? 'border-primary/60 bg-gradient-to-br from-primary/5 via-background to-accent/10 shadow-soft md:scale-[1.03]'
                    : 'bg-background/80'
                )}
              >
                {isHighlight && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                    Le plus choisi
                  </Badge>
                )}

                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'inline-flex h-9 w-9 items-center justify-center rounded-full',
                      isHighlight ? 'bg-primary/15 text-primary' : 'bg-secondary text-foreground'
                    )}
                  >
                    {TIER_ICON[tier]}
                  </span>
                  <div>
                    <h2 className="font-poppins text-lg font-semibold">{plan?.name ?? tier}</h2>
                    {plan?.tagline && (
                      <p className="text-xs text-muted-foreground">{plan.tagline}</p>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-poppins text-3xl font-bold text-foreground">
                      {isFree ? 'Gratuit' : FORMATTERS[currency](price)}
                    </span>
                    {!isFree && (
                      <span className="text-sm text-muted-foreground">
                        / {cycle === 'monthly' ? 'mois' : 'an'}
                      </span>
                    )}
                  </div>
                  {!isFree && cycle === 'yearly' && (
                    <p className="mt-1 text-xs text-primary">≈ 2 mois offerts</p>
                  )}
                </div>

                <ul className="space-y-2 text-sm">
                  {lines.map((l) => (
                    <li key={l} className="flex items-start gap-2">
                      <Check className={cn('mt-0.5 h-4 w-4 shrink-0', isHighlight ? 'text-primary' : 'text-foreground/70')} />
                      <span className="text-foreground/90">{l}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto">
                  {(() => {
                    const targetOrder = PLAN_ORDER[tier];
                    const currentOrder = PLAN_ORDER[currentTier];
                    const isUpgrade = user && targetOrder > currentOrder && !isFree;
                    const isDowngrade = user && targetOrder < currentOrder;

                    if (isCurrent) {
                      return (
                        <Button variant="outline" disabled className="w-full">
                          Plan actuel
                        </Button>
                      );
                    }
                    if (!user && isFree) {
                      return (
                        <Button asChild variant="outline" className="w-full">
                          <Link to="/auth">Commencer gratuitement</Link>
                        </Button>
                      );
                    }
                    if (isDowngrade) {
                      return (
                        <div className="flex flex-col gap-2">
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => setDowngradeTarget(tier as 'free' | 'essentiel')}
                          >
                            Passer à {plan?.name ?? tier}
                          </Button>
                          <p className="text-center text-[10px] text-muted-foreground">
                            Effectif à la fin de ta période payée
                          </p>
                        </div>
                      );
                    }
                    // Upgrade or new paid subscription (or free for logged-in user = no-op)
                    if (isFree) {
                      return (
                        <Button asChild variant="outline" className="w-full">
                          <Link to="/auth">Commencer gratuitement</Link>
                        </Button>
                      );
                    }
                    return (
                      <div className="flex flex-col gap-2">
                        {user ? (
                          <Button
                            className={cn('w-full gap-2', isHighlight && 'bg-primary hover:bg-primary/90')}
                            onClick={() => setWaveOpen({ tier: tier as 'essentiel' | 'premium' })}
                            disabled={!!pending}
                          >
                            <Smartphone className="h-4 w-4" />
                            {pending
                              ? 'Demande en cours…'
                              : isUpgrade
                                ? `Upgrader vers ${plan?.name}`
                                : `Payer ${plan?.name} avec Wave`}
                          </Button>
                        ) : (
                          <Button asChild className={cn('w-full gap-2', isHighlight && 'bg-primary hover:bg-primary/90')}>
                            <Link to="/auth">
                              <Sparkles className="h-4 w-4" />
                              Se connecter pour choisir {plan?.name}
                            </Link>
                          </Button>
                        )}
                        <p className="text-center text-[10px] text-muted-foreground">Paiement Wave (FCFA) — validation sous 24h</p>
                      </div>
                    );
                  })()}
                </div>
              </Card>
            );
          })}
        </div>

        <p className="mt-10 text-center text-xs text-muted-foreground">
          Paiement Wave (FCFA) disponible maintenant pour l'Afrique de l'Ouest. Paiement
          carte international à venir. Annulation à tout moment, sans engagement.
        </p>

        {isLoading && (
          <p className="mt-6 text-center text-xs text-muted-foreground">
            Chargement des plans…
          </p>
        )}
      </main>

      {waveOpen && (() => {
        const p = ordered.find((pp) => pp.tier === waveOpen.tier);
        if (!p) return null;
        const amount = cycle === 'yearly' ? p.price_xof_yearly : p.price_xof_monthly;
        return (
          <WaveCheckoutModal
            open
            onClose={() => setWaveOpen(null)}
            planTier={waveOpen.tier}
            planName={p.name}
            billingCycle={cycle}
            amountXof={Number(amount)}
          />
        );
      })()}

      <AlertDialog open={!!downgradeTarget} onOpenChange={(v) => !v && setDowngradeTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Programmer le passage à {downgradeTarget === 'free' ? 'Gratuit' : 'Essentiel'} ?</AlertDialogTitle>
            <AlertDialogDescription>
              Tu gardes tes avantages actuels jusqu'à la fin de la période déjà payée. À cette date, ton plan passera automatiquement à {downgradeTarget === 'free' ? 'Gratuit' : 'Essentiel'}. Tu peux changer d'avis avant.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={downgrading}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDowngrade} disabled={downgrading}>
              {downgrading ? 'Programmation…' : 'Confirmer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}