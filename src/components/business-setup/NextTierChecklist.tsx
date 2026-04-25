import { useMemo, useState } from 'react';
import {
  Check, Circle, ChevronRight, Sparkles, Loader2, Trophy, RefreshCw,
  HelpCircle, TrendingUp, Lightbulb,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  TIER_DEFINITIONS,
  type SetupTier,
} from '@/hooks/useBusinessSetupTier';
import type {
  BusinessQualitySnapshot,
  QualityImprovement,
} from '@/hooks/useBusinessQualityScore';
import { cn } from '@/lib/utils';

/**
 * Détails enrichis par item (impact business + conseils concrets) pour la modale "Pourquoi ?".
 * Clés alignées avec les `id` retournés par `buildRequirements`.
 */
const REQUIREMENT_DETAILS: Record<
  string,
  { impact: string; tips: string[] }
> = {
  logo: {
    impact:
      'Un logo professionnel multiplie par ~3,2 le nombre de clics sur votre boutique et débloque l’affichage public en ville.',
    tips: [
      'Privilégiez un logo carré, lisible même en petit (vignette mobile).',
      'Restez cohérent avec votre activité : couleurs, style, typo.',
      'Évitez les photos floues ou les captures d’écran : utilisez un format PNG/JPG net.',
    ],
  },
  description: {
    impact:
      'Une description claire (40+ caractères) booste votre référencement local et rassure les clients hésitants.',
    tips: [
      'Commencez par CE QUE VOUS VENDEZ en 1 phrase courte.',
      'Ajoutez un détail unique : artisanal, livré rapidement, sur commande, etc.',
      'Terminez par votre zone d’intervention (ex. « Livraison à Cocody et Yopougon »).',
    ],
  },
  phone: {
    impact:
      'Le numéro de contact est le premier réflexe du client : sans lui, il abandonne et passe à la boutique suivante.',
    tips: [
      'Utilisez un numéro WhatsApp actif que vous consultez plusieurs fois par jour.',
      'Indiquez le format international (+225…) pour éviter les erreurs.',
      'Activez les notifications WhatsApp Business pour répondre en moins de 30 min.',
    ],
  },
  'first-product': {
    impact:
      'Sans produit, votre boutique est invisible dans la marketplace. Le 1er produit débloque le palier Bronze.',
    tips: [
      'Choisissez votre best-seller ou un produit emblématique.',
      'Une bonne photo > 5 produits sans image.',
      'Indiquez un prix clair en FCFA et la disponibilité.',
    ],
  },
  delivery: {
    impact:
      'Configurer la livraison augmente de 70% les contacts entrants et est obligatoire pour passer Argent.',
    tips: [
      'Démarrez avec 2-3 zones précises (ex. Cocody, Plateau, Yopougon).',
      'Fixez des frais réalistes : 1000-2000 FCFA pour une zone proche.',
      'Proposez un seuil de livraison gratuite (ex. à partir de 15 000 FCFA) pour augmenter le panier moyen.',
    ],
  },
  payment: {
    impact:
      'Sans paiement mobile, ~50% des acheteurs abandonnent. Wave/Mobile Money double votre taux de conversion.',
    tips: [
      'Configurez Wave en priorité : c’est le plus utilisé.',
      'Ajoutez Mobile Money (Orange/MTN) en complément pour couvrir tous les profils.',
      'Vérifiez que le numéro recevant les paiements est bien le vôtre.',
    ],
  },
  'three-products': {
    impact:
      '3 produits offrent un vrai choix au client et multiplient par 5 vos chances de commande. Indispensable pour Argent.',
    tips: [
      'Variez les gammes de prix : un produit d’appel + un mid-range + un premium.',
      'Ajoutez des variantes (tailles, couleurs) si pertinent.',
      'Mettez à jour la disponibilité pour éviter les déceptions.',
    ],
  },
  'five-products': {
    impact:
      '5 produits débloquent le palier Or et la mise en avant prioritaire dans le catalogue de votre ville.',
    tips: [
      'Diversifiez vos catégories pour attirer plus de profils différents.',
      'Ajoutez vos nouveautés régulièrement pour rester visible dans le fil.',
      'Réutilisez vos meilleures photos pour gagner du temps.',
    ],
  },
  'product-images': {
    impact:
      'Une fiche sans photo est quasi ignorée. Tous les produits avec image = +visibilité sur la marketplace.',
    tips: [
      'Photographiez en lumière naturelle, sur fond neutre.',
      'Format carré (1:1) — évite le recadrage automatique.',
      'Une seule image par produit suffit, mais elle doit vendre au premier coup d’œil.',
    ],
  },
  'product-descriptions': {
    impact:
      'Une description précise réduit les questions et les abandons : le client achète plus vite et plus souvent.',
    tips: [
      'Mentionnez les ingrédients / matériaux / options.',
      'Précisez la taille, la quantité, ou la durée si pertinent.',
      'Ajoutez un conseil d’utilisation ou de conservation.',
    ],
  },
  address: {
    impact:
      'Une adresse visible améliore votre SEO local et permet le retrait sur place — un atout décisif pour les clients proches.',
    tips: [
      'Indiquez quartier + commune (ex. « Riviera 3, Cocody »).',
      'Ajoutez un repère connu si possible (« en face de la pharmacie Saint-Michel »).',
      'Mettez à jour si vous changez d’atelier ou de point de retrait.',
    ],
  },
};

interface NextTierChecklistProps {
  tier: SetupTier;
  nextTier: SetupTier | null;
  snapshot: BusinessQualitySnapshot | null;
  improvements: QualityImprovement[];
  loading?: boolean;
  refreshing?: boolean;
  onActionClick?: (improvement: QualityImprovement) => void;
  onAskAssistant?: () => void;
  onRefresh?: () => void;
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
  onRefresh,
  className,
}: NextTierChecklistProps) {
  const requirements = useMemo(
    () => buildRequirements(nextTier, snapshot),
    [nextTier, snapshot],
  );

  const [whyOpenId, setWhyOpenId] = useState<string | null>(null);
  const whyReq = whyOpenId
    ? requirements.find((r) => r.id === whyOpenId) ?? null
    : null;
  const whyDetails = whyOpenId ? REQUIREMENT_DETAILS[whyOpenId] : null;
  const whyImprovement = whyOpenId ? improvementById.get(whyOpenId) : undefined;

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
        <div className="flex items-center gap-1 flex-shrink-0">
          <Badge variant="outline" className="text-[10px]">
            {completed}/{total}
          </Badge>
          {onRefresh && (
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={onRefresh}
              disabled={refreshing}
              aria-label="Rouvrir la checklist"
              title="Rouvrir la checklist"
            >
              <RefreshCw
                className={cn('w-3.5 h-3.5', refreshing && 'animate-spin')}
              />
            </Button>
          )}
        </div>
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
        <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between gap-2 flex-wrap">
          <p className="text-[11px] text-muted-foreground">
            Plus que {total - completed} étape{total - completed > 1 ? 's' : ''} ✨
          </p>
          <div className="flex items-center gap-1">
            {onRefresh && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs gap-1"
                onClick={onRefresh}
                disabled={refreshing}
              >
                <RefreshCw
                  className={cn('w-3 h-3', refreshing && 'animate-spin')}
                />
                Rouvrir la checklist
              </Button>
            )}
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
        </div>
      )}
    </Card>
  );
}