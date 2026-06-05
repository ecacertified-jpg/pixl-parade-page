import { Crown, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PlanTier } from './types';

interface PremiumBadgeProps {
  tier: PlanTier;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

/**
 * Badge public affiché à côté du nom d'un utilisateur abonné.
 * Reconnaissance sociale = principal driver émotionnel du Premium.
 */
export const PremiumBadge = ({
  tier,
  size = 'sm',
  showLabel = false,
  className,
}: PremiumBadgeProps) => {
  if (tier === 'free') return null;

  const sizes = {
    sm: 'h-4 w-4 text-[10px] px-1.5 py-0.5',
    md: 'h-5 w-5 text-xs px-2 py-1',
    lg: 'h-6 w-6 text-sm px-3 py-1.5',
  };

  const isPremium = tier === 'premium';
  const Icon = isPremium ? Crown : Sparkles;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium shadow-soft',
        isPremium
          ? 'bg-gradient-to-r from-[hsl(45_88%_63%)] to-[hsl(45_100%_70%)] text-foreground'
          : 'bg-gradient-to-r from-primary/80 to-accent/80 text-primary-foreground',
        sizes[size],
        className
      )}
      title={isPremium ? 'Membre Premium JDV' : 'Membre Essentiel JDV'}
      aria-label={isPremium ? 'Membre Premium' : 'Membre Essentiel'}
    >
      <Icon className={cn(size === 'sm' ? 'h-3 w-3' : size === 'md' ? 'h-3.5 w-3.5' : 'h-4 w-4')} />
      {showLabel && (isPremium ? 'Premium' : 'Essentiel')}
    </span>
  );
};