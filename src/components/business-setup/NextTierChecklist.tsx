import { useMemo } from 'react';
import { Check, Circle, ChevronRight, Sparkles, Loader2, Trophy } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  TIER_DEFINITIONS,
  type SetupTier,
} from '@/hooks/useBusinessSetupTier';
import type {
  BusinessQualitySnapshot,
  QualityImprovement,
} from '@/hooks/useBusinessQualityScore';
import { cn } from '@/lib/utils';

interface NextTierChecklistProps {
  tier: SetupTier;
  nextTier: SetupTier | null;
  snapshot: BusinessQualitySnapshot | null;
  improvements: QualityImprovement[];
  loading?: boolean;
  refreshing?: boolean;
  onActionClick?: (improvement: QualityImprovement) => void;
  onAskAssistant?: () => void;
  className?: string;
}

/**
 * Conditions par palier pour passer au suivant.
 * Chaque entrée renvoie un id stable + un label + un statut "complété".
 */
function buildRequirements(
  nextTier: SetupTier | null,
  snap: BusinessQualitySnapshot | null,
): Array<{
  id: string;
  label: string;
  done: boolean;
  weight?: 'high' | 'medium' | 'low';
  why?: string;
}> {
  if (!nextTier || !snap) return [];

  switch (nextTier) {
    case 'bronze':
      return [
        {
          id: 'logo',
          label: 'Logo de boutique',
          done: snap.has_logo,
          weight: 'high',
          why: 'Une vitrine avec logo inspire confiance et reçoit jusqu’à 3,2× plus de clics — indispensable pour valider Bronze.',
        },
        {
          id: 'description',
          label: 'Description (40+ caractères)',
          done: !!snap.description && snap.description.length >= 40,
          weight: 'high',
          why: 'Une description claire aide vos visiteurs à comprendre ce que vous vendez et améliore votre référencement local.',
        },
        {
          id: 'phone',
          label: 'Numéro de contact',
          done: snap.has_phone,
          weight: 'medium',
          why: 'Vos clients doivent pouvoir vous joindre rapidement (WhatsApp/appel) pour confirmer une commande.',
        },
        {
          id: 'first-product',
          label: 'Au moins 1 produit en ligne',
          done: snap.product_count >= 1,
          weight: 'high',
          why: 'Sans produit visible, vous ne pouvez pas recevoir de commande — c’est la condition n°1 pour activer Bronze.',
        },
      ];
    case 'silver':
      return [
        {
          id: 'delivery',
          label: 'Livraison configurée (1+ zone)',
          done: snap.delivery_zones_count >= 1,
          weight: 'high',
          why: 'Les boutiques avec livraison sont 70% plus contactées : vos clients savent où et combien ça coûte.',
        },
        {
          id: 'payment',
          label: 'Moyen de paiement activé',
          done: snap.has_payment,
          weight: 'high',
          why: 'Mobile Money / Wave double le taux de conversion : le client paie sans friction.',
        },
        {
          id: 'three-products',
          label: `3 produits en ligne (${Math.min(snap.product_count, 3)}/3)`,
          done: snap.product_count >= 3,
          weight: 'high',
          why: '3 produits offrent un vrai choix au client et multiplient par 5 vos chances de commande.',
        },
        {
          id: 'product-images',
          label: 'Photos sur tous vos produits',
          done:
            snap.product_count > 0 &&
            snap.products_with_image / snap.product_count >= 0.8,
          weight: 'medium',
          why: 'Les fiches sans photo sont quasi ignorées — une image vendeuse rassure et déclenche l’achat.',
        },
      ];
    case 'gold':
      return [
        {
          id: 'five-products',
          label: `5 produits en ligne (${Math.min(snap.product_count, 5)}/5)`,
          done: snap.product_count >= 5,
          weight: 'high',
          why: '5 produits débloquent la mise en avant prioritaire sur la marketplace et signalent une boutique active.',
        },
        {
          id: 'product-descriptions',
          label: 'Descriptions sur tous vos produits',
          done:
            snap.product_count > 0 &&
            snap.products_with_description / snap.product_count >= 0.8,
          weight: 'medium',
          why: 'Une description précise (ingrédients, taille, options) lève les hésitations et réduit les questions.',
        },
        {
          id: 'address',
          label: 'Adresse renseignée',
          done: snap.has_address,
          weight: 'low',
          why: 'Une adresse visible améliore le SEO local et permet le retrait sur place pour les clients proches.',
        },
      ];
    default:
      return [];
  }
}

export function NextTierChecklist({
  tier,
  nextTier,
  snapshot,
  improvements,
  loading,
  refreshing,
  onActionClick,
  onAskAssistant,
  className,
}: NextTierChecklistProps) {
  const requirements = useMemo(
    () => buildRequirements(nextTier, snapshot),
    [nextTier, snapshot],
  );

  const completed = requirements.filter((r) => r.done).length;
  const total = requirements.length;
  const progress = total > 0 ? (completed / total) * 100 : 100;

  // Map requirement id -> matching improvement (for CTAs)
  const improvementById = useMemo(() => {
    const map = new Map<string, QualityImprovement>();
    for (const imp of improvements) map.set(imp.id, imp);
    return map;
  }, [improvements]);

  const currentInfo = TIER_DEFINITIONS[tier];
  const nextInfo = nextTier ? TIER_DEFINITIONS[nextTier] : null;

  // Already at top tier
  if (!nextInfo) {
    return (
      <Card
        className={cn(
          'p-4 border-amber-500/30 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-500/10 dark:to-yellow-500/5',
          className,
        )}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-600 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-poppins font-semibold text-sm">
              Palier maximum atteint 🎉
            </p>
            <p className="text-xs text-muted-foreground">
              {currentInfo.reward}
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        'p-4 border-primary/20 bg-gradient-to-br from-background via-background to-secondary/30',
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div
          className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center text-xl shadow-md flex-shrink-0',
            'bg-gradient-to-br',
            nextInfo.gradientClass,
          )}
        >
          {nextInfo.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-poppins font-semibold text-sm">
              Pour débloquer {nextInfo.label}
            </p>
            {refreshing && (
              <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
            )}
          </div>
          <p className="text-xs text-muted-foreground">{nextInfo.reward}</p>
        </div>
        <Badge variant="outline" className="text-[10px] flex-shrink-0">
          {completed}/{total}
        </Badge>
      </div>

      <Progress value={progress} className="h-1.5 mb-3" />

      {/* Requirements */}
      {loading && requirements.length === 0 ? (
        <div className="py-4 flex items-center justify-center text-xs text-muted-foreground gap-2">
          <Loader2 className="w-3 h-3 animate-spin" />
          Analyse de votre boutique…
        </div>
      ) : (
        <ul className="space-y-2">
          {requirements.map((req) => {
            const imp = improvementById.get(req.id);
            return (
              <li
                key={req.id}
                className={cn(
                  'rounded-lg px-2 py-1.5 transition-colors',
                  req.done ? 'opacity-70' : 'bg-muted/40 hover:bg-muted/60',
                )}
              >
                <div className="flex items-center gap-2">
                  {req.done ? (
                    <span className="w-5 h-5 rounded-full bg-success/20 text-success flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3" />
                    </span>
                  ) : (
                    <Circle
                      className={cn(
                        'w-5 h-5 flex-shrink-0',
                        req.weight === 'high'
                          ? 'text-destructive'
                          : req.weight === 'medium'
                          ? 'text-amber-500'
                          : 'text-muted-foreground',
                      )}
                      strokeWidth={1.5}
                    />
                  )}
                  <span
                    className={cn(
                      'text-xs flex-1 min-w-0 leading-snug font-medium',
                      req.done ? 'line-through text-muted-foreground' : 'text-foreground',
                    )}
                  >
                    {req.label}
                  </span>
                  {!req.done && imp && onActionClick && (
                    <button
                      onClick={() => onActionClick(imp)}
                      className="text-[10px] font-medium text-primary hover:underline flex items-center gap-0.5 flex-shrink-0"
                    >
                      Faire
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
                {!req.done && req.why && (
                  <p className="text-[11px] text-muted-foreground leading-snug pl-7 mt-1">
                    {req.why}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* Footer CTA */}
      {completed < total && (
        <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between gap-2">
          <p className="text-[11px] text-muted-foreground">
            Plus que {total - completed} étape{total - completed > 1 ? 's' : ''} ✨
          </p>
          {onAskAssistant && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs gap-1 text-primary hover:text-primary"
              onClick={onAskAssistant}
            >
              <Sparkles className="w-3 h-3" />
              Demander à l'assistant
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}