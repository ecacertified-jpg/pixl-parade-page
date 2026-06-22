import { Link } from 'react-router-dom';
import { Sparkles, Crown, Check, Gift } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePlan } from './usePlan';
import { FEATURE_CATALOG, type FeatureId } from './featureCatalog';
import type { PlanTier } from './types';

interface Props {
  feature: FeatureId;
  reason?: string;
  onClose: () => void;
}

const TIER_LABEL: Record<PlanTier, string> = {
  free: 'Gratuit',
  essentiel: 'Essentiel',
  premium: 'Premium',
};

const TIER_ICON: Record<PlanTier, JSX.Element> = {
  free: <Sparkles className="h-4 w-4" />,
  essentiel: <Sparkles className="h-4 w-4 text-primary" />,
  premium: <Crown className="h-4 w-4 text-amber-500" />,
};

export function UpgradePromptModal({ feature, reason, onClose }: Props) {
  const meta = FEATURE_CATALOG[feature];
  const { tier: currentTier, trial } = usePlan();
  const targetTier = meta.requires;

  const hasUnusedTrial = trial && !trial.converted_to_premium && trial.phase === 'none';

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-poppins">
            {TIER_ICON[targetTier]} Tu mérites d'aller plus loin 💛
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-foreground/90">
            {reason ?? meta.benefit}
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border bg-muted/40 p-3 text-center">
              <Badge variant="outline" className="mb-2">{TIER_LABEL[currentTier]}</Badge>
              <p className="text-xs text-muted-foreground">Ton plan actuel</p>
              <p className="mt-2 text-xs text-foreground/80">— accès limité —</p>
            </div>
            <div className="rounded-xl border border-primary/50 bg-gradient-to-br from-primary/10 to-accent/10 p-3 text-center">
              <Badge className="mb-2 bg-primary text-primary-foreground">{TIER_LABEL[targetTier]}</Badge>
              <p className="text-xs text-muted-foreground">Recommandé</p>
              <p className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary">
                <Check className="h-3 w-3" /> {meta.label}
              </p>
            </div>
          </div>

          {hasUnusedTrial && (
            <div className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
              <Gift className="h-4 w-4 shrink-0" />
              <p>
                Tu as un événement <strong>Premium offert</strong> non utilisé. Active-le sur la
                page de ton choix pour profiter de tout, sans payer.
              </p>
            </div>
          )}

          <div className="flex flex-col gap-2 pt-2">
            <Button asChild className="w-full gap-2">
              <Link
                to={`/pricing?from=${feature}`}
                onClick={onClose}
              >
                <Sparkles className="h-4 w-4" /> Découvrir le plan {TIER_LABEL[targetTier]}
              </Link>
            </Button>
            <button
              onClick={onClose}
              className="text-center text-xs text-muted-foreground hover:text-foreground"
            >
              Plus tard
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}