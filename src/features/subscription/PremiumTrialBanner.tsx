import { Link } from 'react-router-dom';
import { Sparkles, Gift, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { usePremiumTrial } from './usePremiumTrial';

/**
 * Bandeau discret affiché sur le dashboard / pages globales pour rappeler
 * l'état de l'essai émotionnel ("free_with_premium_event") et inviter à upgrade.
 */
export const PremiumTrialBanner = ({ className }: { className?: string }) => {
  const { trial, isActive, isMemories, isLimited, state, log } = usePremiumTrial();

  if (state === 'premium' || !trial) return null;
  if (!(isActive || isMemories || isLimited)) return null;

  const daysLeft = (() => {
    const ref =
      isActive ? trial.premium_until : isMemories ? trial.memories_until : trial.archived_at;
    const diff = new Date(ref).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  })();

  const label = isActive
    ? 'Ta célébration Premium est active'
    : isMemories
      ? 'Phase souvenirs Premium'
      : 'Souvenirs en accès limité';

  return (
    <div
      className={cn(
        'flex flex-col gap-2 rounded-xl border border-primary/20 bg-gradient-to-r from-secondary/40 to-accent/20 p-3 sm:flex-row sm:items-center sm:justify-between',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-primary/15 p-2 text-primary">
          <Gift className="h-4 w-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-poppins text-sm font-medium text-foreground">{label}</p>
            <Badge variant="secondary" className="gap-1 text-[10px]">
              <Clock className="h-3 w-3" /> {daysLeft}j
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Garde tes souvenirs vivants après cette célébration.
          </p>
        </div>
      </div>
      <Button asChild size="sm" className="gap-1.5">
        <Link
          to={`/pricing?from=souvenirs_premium&return_to=${encodeURIComponent(
            typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/'
          )}`}
          onClick={() => log('upgrade_clicked', { source: 'trial_banner', phase: trial.phase })}
        >
          <Sparkles className="h-3.5 w-3.5" /> Devenir Premium
        </Link>
      </Button>
    </div>
  );
};