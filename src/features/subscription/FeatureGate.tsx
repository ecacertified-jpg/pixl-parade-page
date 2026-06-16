import { ReactNode } from 'react';
import { Lock, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { FeatureFlag, PlanTier, TrialTargetType } from './types';
import { usePlan } from './usePlan';

interface FeatureGateProps {
  /** Plan minimum requis (par défaut "premium"). */
  requires?: PlanTier;
  /** Optionnel : exige aussi qu'une feature qualitative soit truthy. */
  feature?: FeatureFlag;
  /**
   * Contexte d'item (ex. page d'anniversaire) : si cet item est l'événement
   * couvert par le Premium offert, l'accès est autorisé même en plan free.
   */
  trialContext?: { targetType: TrialTargetType; targetId: string };
  /** Affichage quand l'accès est refusé. "lock" = overlay floutée premium. */
  fallback?: 'lock' | 'hide' | ReactNode;
  title?: string;
  reason?: string;
  className?: string;
  children: ReactNode;
}

/**
 * Composant de gating UI. **Ne remplace JAMAIS** les vérifications côté serveur
 * (RLS + edge functions). Sert uniquement à l'expérience utilisateur.
 */
export const FeatureGate = ({
  requires = 'premium',
  feature,
  trialContext,
  fallback = 'lock',
  title = 'Fonctionnalité Premium',
  reason = 'Passe à un plan supérieur pour débloquer cette expérience.',
  className,
  children,
}: FeatureGateProps) => {
  const { isAtLeast, getFeature, isLoading, isTrialCoveredItem } = usePlan();

  if (isLoading) return null;

  const planOk = isAtLeast(requires);
  const featureOk = feature ? Boolean(getFeature(feature)) : true;
  const trialOk = trialContext
    ? isTrialCoveredItem(trialContext.targetType, trialContext.targetId)
    : false;
  const allowed = (planOk && featureOk) || trialOk;

  if (allowed) return <>{children}</>;
  if (fallback === 'hide') return null;
  if (fallback !== 'lock') return <>{fallback}</>;

  return (
    <Card
      className={cn(
        'relative overflow-hidden border-primary/30 bg-gradient-to-br from-secondary/40 to-accent/20 p-6 text-center',
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 backdrop-blur-sm" aria-hidden />
      <div className="relative z-10 mx-auto flex max-w-sm flex-col items-center gap-3">
        <div className="rounded-full bg-primary/15 p-3">
          <Lock className="h-5 w-5 text-primary" />
        </div>
        <h3 className="font-poppins text-lg font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">{reason}</p>
        <Button asChild size="sm" className="gap-2">
          <Link to="/pricing">
            <Sparkles className="h-4 w-4" />
            Découvrir les plans
          </Link>
        </Button>
      </div>
    </Card>
  );
};