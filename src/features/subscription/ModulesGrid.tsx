import { ReactNode } from 'react';
import { CalendarHeart, PartyPopper, Images, Check, Lock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { PlanTier, PLAN_ORDER } from './types';
import { usePlan } from './usePlan';

interface ModuleDef {
  key: 'preparer' | 'celebrer' | 'souvenirs';
  title: string;
  tagline: string;
  icon: ReactNode;
  perks: { label: string; minTier: PlanTier }[];
  accent: string;
}

const MODULES: ModuleDef[] = [
  {
    key: 'preparer',
    title: 'Préparer',
    tagline: 'Organise sans stress',
    icon: <CalendarHeart className="h-5 w-5" />,
    accent: 'from-primary/20 to-primary/5',
    perks: [
      { label: 'Page événement', minTier: 'free' },
      { label: 'Co-organisateurs', minTier: 'essentiel' },
      { label: 'Gestion budget & RSVP avancé', minTier: 'essentiel' },
      { label: 'Assistant IA & suggestions', minTier: 'premium' },
    ],
  },
  {
    key: 'celebrer',
    title: 'Célébrer',
    tagline: 'Le grand jour, magnifié',
    icon: <PartyPopper className="h-5 w-5" />,
    accent: 'from-[hsl(345_100%_76%)]/25 to-[hsl(345_100%_76%)]/5',
    perks: [
      { label: 'Mur de vœux & cagnotte', minTier: 'free' },
      { label: 'Invitations Premium & thèmes', minTier: 'essentiel' },
      { label: 'Thèmes exclusifs & halo Premium', minTier: 'premium' },
      { label: 'Sans publicité', minTier: 'premium' },
    ],
  },
  {
    key: 'souvenirs',
    title: 'Souvenirs',
    tagline: 'Pour ne rien oublier',
    icon: <Images className="h-5 w-5" />,
    accent: 'from-[hsl(45_88%_63%)]/25 to-[hsl(45_88%_63%)]/5',
    perks: [
      { label: 'Album photos basique', minTier: 'free' },
      { label: 'Export PDF & vidéo 720p', minTier: 'essentiel' },
      { label: 'Vidéo HD 1080p & export album+vidéo', minTier: 'premium' },
      { label: 'Photos illimitées', minTier: 'premium' },
    ],
  },
];

export const ModulesGrid = () => {
  const { tier } = usePlan();
  const currentLevel = PLAN_ORDER[tier];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {MODULES.map((mod) => {
        const unlockedCount = mod.perks.filter((p) => PLAN_ORDER[p.minTier] <= currentLevel).length;
        const total = mod.perks.length;
        const fullyUnlocked = unlockedCount === total;

        return (
          <Card
            key={mod.key}
            className={cn(
              'relative overflow-hidden p-4 transition hover:shadow-soft',
              'bg-gradient-to-br',
              mod.accent
            )}
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-background/70 p-2 text-primary">{mod.icon}</div>
                <div>
                  <h3 className="font-poppins text-base font-semibold leading-tight">{mod.title}</h3>
                  <p className="text-[11px] text-muted-foreground">{mod.tagline}</p>
                </div>
              </div>
              <Badge
                variant="secondary"
                className={cn(
                  'text-[10px]',
                  fullyUnlocked && 'bg-primary/15 text-primary'
                )}
              >
                {unlockedCount}/{total}
              </Badge>
            </div>

            <ul className="space-y-1.5">
              {mod.perks.map((perk) => {
                const ok = PLAN_ORDER[perk.minTier] <= currentLevel;
                return (
                  <li
                    key={perk.label}
                    className={cn(
                      'flex items-start gap-2 text-xs',
                      ok ? 'text-foreground' : 'text-muted-foreground/70'
                    )}
                  >
                    {ok ? (
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                    ) : (
                      <Lock className="mt-0.5 h-3 w-3 shrink-0" />
                    )}
                    <span className={cn(!ok && 'line-through decoration-muted-foreground/30')}>
                      {perk.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          </Card>
        );
      })}
    </div>
  );
};