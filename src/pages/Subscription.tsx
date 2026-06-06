import { Link } from 'react-router-dom';
import { Crown, Sparkles, Star, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePlan } from '@/features/subscription/usePlan';
import { PremiumBadge } from '@/features/subscription/PremiumBadge';
import { usePendingWaveRequest } from '@/features/subscription/useWaveCheckout';
import { WavePendingCard } from '@/features/subscription/WavePendingCard';

const TIER_ICON = {
  free: Star,
  essentiel: Sparkles,
  premium: Crown,
} as const;

export default function Subscription() {
  const { tier, plan, subscription, isLoading } = usePlan();
  const { data: pending } = usePendingWaveRequest();

  const Icon = TIER_ICON[tier];
  const endDate = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-secondary/30 to-background">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <header className="mb-8 text-center">
          <Badge className="mb-2 bg-primary/10 text-primary hover:bg-primary/15">Mon abonnement</Badge>
          <h1 className="font-poppins text-3xl font-semibold">Ton plan JDV</h1>
        </header>

        {pending && (
          <div className="mb-6">
            <WavePendingCard request={pending} />
          </div>
        )}

        <Card className="p-6">
          {isLoading ? (
            <p className="text-center text-sm text-muted-foreground">Chargement…</p>
          ) : (
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon className="h-7 w-7" />
              </div>
              <div>
                <div className="flex items-center justify-center gap-2">
                  <h2 className="font-poppins text-2xl font-semibold">{plan?.name ?? 'Gratuit'}</h2>
                  {tier !== 'free' && <PremiumBadge tier={tier} />}
                </div>
                {plan?.tagline && <p className="mt-1 text-sm text-muted-foreground">{plan.tagline}</p>}
              </div>

              {tier !== 'free' && (
                <div className="rounded-xl bg-muted/50 px-4 py-3 text-sm">
                  <p className="text-muted-foreground">Cycle</p>
                  <p className="font-medium capitalize">
                    {subscription?.billing_cycle === 'yearly' ? 'Annuel' : 'Mensuel'}
                  </p>
                  {endDate && (
                    <>
                      <p className="mt-2 text-muted-foreground">
                        {subscription?.cancel_at_period_end ? 'Expire le' : 'Renouvellement / fin de période'}
                      </p>
                      <p className="font-medium">{endDate}</p>
                    </>
                  )}
                </div>
              )}

              {tier === 'free' && !pending && (
                <Button asChild className="mt-2 gap-2">
                  <Link to="/pricing">
                    Passer Premium <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              )}

              {tier !== 'free' && !pending && (
                <Button asChild variant="outline" className="mt-2">
                  <Link to="/pricing">Changer de plan</Link>
                </Button>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}