import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Gift, Heart, Star, X } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { usePremiumTrial } from './usePremiumTrial';
import type { TrialTargetType } from './types';

interface Props {
  targetType: TrialTargetType;
  targetId: string;
  /** Préfixe affiché. ex. « Ton anniversaire », « Ton mariage ». */
  occasionLabel?: string;
  /** Storage key custom pour différencier les modales. */
  storageKeyPrefix?: string;
}

/**
 * Modal émotionnelle affichée UNE fois à la création du premier événement.
 * "On t'offre une célébration Premium." (pas un essai SaaS froid)
 */
export const PremiumTrialUnlockModal = ({
  targetType,
  targetId,
  occasionLabel = 'Ta célébration',
  storageKeyPrefix = 'jdv_trial_unlock',
}: Props) => {
  const { trial, isThisItemTarget, isActive, isMemories, log } = usePremiumTrial({
    targetType,
    targetId,
  });
  const [open, setOpen] = useState(false);

  const storageKey = `${storageKeyPrefix}_${targetId}`;

  useEffect(() => {
    if (!trial || !isThisItemTarget) return;
    if (!(isActive || isMemories)) return;
    if (typeof window === 'undefined') return;
    if (localStorage.getItem(storageKey)) return;
    setOpen(true);
    log('unlock_viewed', { target_type: targetType, target_id: targetId });
    localStorage.setItem(storageKey, '1');
  }, [trial, isThisItemTarget, isActive, isMemories, storageKey, log, targetType, targetId]);

  if (!trial) return null;

  const eventDate = trial.event_date
    ? new Date(trial.event_date).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md overflow-hidden border-primary/30 bg-gradient-to-br from-secondary/60 via-background to-accent/30 p-0">
        <div className="relative">
          <button
            onClick={() => setOpen(false)}
            className="absolute right-3 top-3 z-10 rounded-full bg-background/70 p-1.5 text-muted-foreground hover:bg-background"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="relative flex flex-col items-center gap-3 px-6 pt-10 pb-4 text-center">
            <div className="relative">
              <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
              <div className="relative rounded-full bg-gradient-to-br from-primary to-accent p-4 shadow-soft">
                <Gift className="h-8 w-8 text-primary-foreground" />
              </div>
            </div>
            <p className="font-poppins text-xs uppercase tracking-widest text-primary">
              Cadeau de JDV
            </p>
            <h2 className="font-poppins text-2xl font-semibold text-foreground">
              {occasionLabel} est <span className="text-primary">Premium</span> ✨
            </h2>
            <p className="text-sm text-muted-foreground">
              Pour cet événement, on t'offre toute la magie&nbsp;: thème exclusif,
              galerie enrichie, animations, badge spécial et souvenirs à conserver.
            </p>
            {eventDate && (
              <p className="text-xs text-muted-foreground">
                Actif jusqu'au <span className="font-medium text-foreground">{eventDate}</span>,
                puis 7 jours de souvenirs.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 px-6 pb-2 text-left text-xs">
            <Perk icon={<Sparkles className="h-3.5 w-3.5" />} label="Thème Premium" />
            <Perk icon={<Star className="h-3.5 w-3.5" />} label="Badge spécial" />
            <Perk icon={<Heart className="h-3.5 w-3.5" />} label="Galerie enrichie" />
            <Perk icon={<Gift className="h-3.5 w-3.5" />} label="Souvenirs avancés" />
          </div>

          <div className="flex flex-col gap-2 px-6 pb-6 pt-4">
            <Button onClick={() => setOpen(false)} className="w-full gap-2">
              <Sparkles className="h-4 w-4" />
              Vivre la célébration
            </Button>
            <Button asChild variant="ghost" size="sm" className="w-full">
              <Link to="/pricing" onClick={() => log('upgrade_clicked', { source: 'unlock_modal' })}>
                Découvrir Premium illimité
              </Link>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const Perk = ({ icon, label }: { icon: React.ReactNode; label: string }) => (
  <div className="flex items-center gap-2 rounded-md bg-background/60 px-2 py-1.5 text-foreground/80">
    <span className="text-primary">{icon}</span>
    <span>{label}</span>
  </div>
);