import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { TIER_DEFINITIONS, type SetupTier } from '@/hooks/useBusinessSetupTier';

interface SetupTierBadgeProps {
  tier: SetupTier;
  size?: 'sm' | 'md' | 'lg';
  animate?: boolean;
}

export const SetupTierBadge = ({ tier, size = 'md', animate = false }: SetupTierBadgeProps) => {
  const info = TIER_DEFINITIONS[tier];
  if (tier === 'none') return null;

  const sizeClasses =
    size === 'sm' ? 'text-xs px-2 py-0.5 gap-1' :
    size === 'lg' ? 'text-base px-4 py-2 gap-2' :
    'text-sm px-3 py-1 gap-1.5';

  const content = (
    <Badge
      variant="outline"
      className={`bg-gradient-to-r ${info.gradientClass} text-white border-0 font-semibold shadow-sm ${sizeClasses}`}
    >
      <span aria-hidden>{info.emoji}</span>
      <span>{info.label}</span>
    </Badge>
  );

  if (!animate) return content;

  return (
    <motion.div
      initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
      animate={{ scale: 1, opacity: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 220, damping: 14 }}
      className="inline-block"
    >
      {content}
    </motion.div>
  );
};

export const NextTierTeaser = ({ nextTier }: { nextTier: SetupTier | null }) => {
  if (!nextTier) return null;
  const info = TIER_DEFINITIONS[nextTier];
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <Trophy className="w-3.5 h-3.5 text-primary" />
      <span>
        Prochain palier : <strong className="text-foreground">{info.label}</strong> — {info.reward}
      </span>
    </div>
  );
};