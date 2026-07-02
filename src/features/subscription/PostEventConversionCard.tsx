import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Sparkles, Lock, Archive } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { usePremiumTrial } from './usePremiumTrial';
import type { TrialTargetType } from './types';

interface Props {
  targetType: TrialTargetType;
  targetId: string;
  className?: string;
}

/**
 * Carte émotionnelle affichée APRÈS la date de l'événement, sur la page
 * de l'item offert. Décline le message selon la phase :
 *  - memories  : "Conserve la magie" (chaleureux, soft CTA)
 *  - limited   : "Tes souvenirs sont en sursis" (urgence douce)
 *  - archived  : "Réveille tes souvenirs" (réactivation)
 */
export const PostEventConversionCard = ({ targetType, targetId, className }: Props) => {
  const { trial, isThisItemTarget, isMemories, isLimited, isArchived, log } = usePremiumTrial({
    targetType,
    targetId,
  });

  useEffect(() => {
    if (!trial || !isThisItemTarget) return;
    if (isMemories || isLimited || isArchived) {
      log('post_event_viewed', { phase: trial.phase });
    }
  }, [trial, isThisItemTarget, isMemories, isLimited, isArchived, log]);

  if (!trial || !isThisItemTarget) return null;
  if (!(isMemories || isLimited || isArchived)) return null;

  const cfg = isArchived
    ? {
        icon: <Archive className="h-5 w-5" />,
        title: 'Réveille tes souvenirs',
        body: 'Cet événement est archivé. Passe en Premium pour redonner vie à tes photos et tes messages d\'amour.',
        cta: 'Réactiver les souvenirs',
        tone: 'from-muted/40 to-secondary/30',
      }
    : isLimited
      ? {
          icon: <Lock className="h-5 w-5" />,
          title: 'Tes souvenirs sont précieux',
          body: 'La phase souvenirs Premium est terminée. Tout reste visible, mais les ajouts sont gelés. Garde la magie vivante avec Premium.',
          cta: 'Conserver la magie',
          tone: 'from-accent/20 to-primary/15',
        }
      : {
          icon: <Heart className="h-5 w-5" />,
          title: 'Ta célébration a touché beaucoup de personnes ❤️',
          body: 'Tu as encore quelques jours pour enrichir ta galerie, partager les souvenirs et garder ton thème Premium. Conserve cette magie pour toujours.',
          cta: 'Garder mes souvenirs Premium',
          tone: 'from-primary/15 via-secondary/40 to-accent/20',
        };

  return (
    <Card
      className={cn(
        'relative overflow-hidden border-primary/30 bg-gradient-to-br p-5 text-center shadow-soft',
        cfg.tone,
        className
      )}
    >
      <div className="mx-auto flex max-w-md flex-col items-center gap-3">
        <div className="rounded-full bg-primary/15 p-3 text-primary">{cfg.icon}</div>
        <h3 className="font-poppins text-lg font-semibold text-foreground">{cfg.title}</h3>
        <p className="text-sm text-muted-foreground">{cfg.body}</p>
        <Button asChild className="gap-2">
          <Link
            to={`/pricing?from=souvenirs_premium&return_to=${encodeURIComponent(
              typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/'
            )}`}
            onClick={() => log('upgrade_clicked', { source: 'post_event_card', phase: trial.phase })}
          >
            <Sparkles className="h-4 w-4" />
            {cfg.cta}
          </Link>
        </Button>
      </div>
    </Card>
  );
};