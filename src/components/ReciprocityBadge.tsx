import { motion } from 'framer-motion';
import { Award, Heart, TrendingUp, Star, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

export type BadgeLevel = 'newcomer' | 'helper' | 'generous' | 'champion';

export interface BadgeConfig {
  level: BadgeLevel;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  gradient: string;
  minScore: number;
  description: string;
  perks: string[];
}

export const BADGE_CONFIGS: Record<BadgeLevel, BadgeConfig> = {
  newcomer: {
    level: 'newcomer',
    name: 'Nouveau',
    icon: Heart,
    color: 'text-gray-500',
    gradient: 'from-gray-400 to-gray-600',
    minScore: 0,
    description: 'Bienvenue dans la communauté !',
    perks: [
      'Accès à toutes les fonctionnalités de base',
      'Participation aux cagnottes publiques',
    ],
  },
  helper: {
    level: 'helper',
    name: 'Contributeur',
    icon: Award,
    color: 'text-blue-500',
    gradient: 'from-blue-400 to-blue-600',
    minScore: 20,
    description: 'Vous contribuez régulièrement',
    perks: [
      'Badge visible sur votre profil',
      'Priorité dans les suggestions de montants',
      'Accès aux statistiques détaillées',
    ],
  },
  generous: {
    level: 'generous',
    name: 'Généreux',
    icon: TrendingUp,
    color: 'text-purple-500',
    gradient: 'from-purple-400 to-purple-600',
    minScore: 50,
    description: 'Votre générosité inspire la communauté',
    perks: [
      'Badge animé sur votre profil',
      'Suggestions de montants optimisées',
      'Visibilité accrue dans les leaderboards',
      'Notifications prioritaires',
    ],
  },
  champion: {
    level: 'champion',
    name: 'Champion',
    icon: Crown,
    color: 'text-yellow-500',
    gradient: 'from-yellow-400 via-amber-500 to-yellow-600',
    minScore: 80,
    description: 'Pilier de la communauté JOIE DE VIVRE',
    perks: [
      'Badge prestigieux avec animation premium',
      'Rang de Champion dans les classements',
      'Influence sur les suggestions communautaires',
      'Accès anticipé aux nouvelles fonctionnalités',
      'Reconnaissance spéciale de la plateforme',
    ],
  },
};

export function getBadgeByScore(score: number): BadgeConfig {
  if (score >= 80) return BADGE_CONFIGS.champion;
  if (score >= 50) return BADGE_CONFIGS.generous;
  if (score >= 20) return BADGE_CONFIGS.helper;
  return BADGE_CONFIGS.newcomer;
}

interface ReciprocityBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
  showScore?: boolean;
  animated?: boolean;
  className?: string;
}

export function ReciprocityBadge({
  score,
  size = 'md',
  showLabel = true,
  showScore = false,
  animated = true,
  className,
}: ReciprocityBadgeProps) {
  const badge = getBadgeByScore(score);
  const Icon = badge.icon;

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg',
  };

  // Animation variants based on badge level
  const badgeAnimation: any = {
    newcomer: {},
    helper: animated ? {
      scale: [1, 1.05, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut' as const,
      },
    } : {},
    generous: animated ? {
      scale: [1, 1.1, 1],
      rotate: [0, 5, -5, 0],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: 'easeInOut' as const,
      },
    } : {},
    champion: animated ? {
      scale: [1, 1.15, 1],
      rotate: [0, 10, -10, 0],
      y: [0, -5, 0],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: 'easeInOut' as const,
      },
    } : {},
  };

  const glowAnimation: any = badge.level !== 'newcomer' && animated ? {
    boxShadow: [
      `0 0 10px rgba(var(--${badge.level}-rgb), 0.3)`,
      `0 0 30px rgba(var(--${badge.level}-rgb), 0.6)`,
      `0 0 10px rgba(var(--${badge.level}-rgb), 0.3)`,
    ],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut' as const,
    },
  } : {};

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <motion.div
        className={cn(
          'relative flex items-center justify-center rounded-full',
          'bg-gradient-to-br shadow-lg',
          sizeClasses[size],
          badge.gradient
        )}
        animate={badgeAnimation[badge.level]}
        whileHover={{ scale: 1.1 }}
      >
        <motion.div
          className="absolute inset-0 rounded-full"
          animate={glowAnimation}
        />
        <Icon className={cn('text-white relative z-10', iconSizes[size])} />
        
        {badge.level === 'champion' && animated && (
          <motion.div
            className="absolute inset-0"
            animate={{
              rotate: 360,
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: 'linear',
            }}
          >
            <Star className="absolute top-0 left-1/2 -translate-x-1/2 text-white w-3 h-3 opacity-80" />
            <Star className="absolute bottom-0 left-1/2 -translate-x-1/2 text-white w-3 h-3 opacity-80" />
            <Star className="absolute left-0 top-1/2 -translate-y-1/2 text-white w-3 h-3 opacity-80" />
            <Star className="absolute right-0 top-1/2 -translate-y-1/2 text-white w-3 h-3 opacity-80" />
          </motion.div>
        )}
      </motion.div>

      {showLabel && (
        <div className="text-center">
          <p className={cn('font-semibold', badge.color, textSizes[size])}>
            {badge.name}
          </p>
          {showScore && (
            <p className={cn('text-muted-foreground', textSizes[size === 'xl' ? 'md' : 'sm'])}>
              Score: {score}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// Composant pour afficher le badge avec info-bulle
export function ReciprocityBadgeWithTooltip({
  score,
  size = 'md',
  className,
}: Omit<ReciprocityBadgeProps, 'showLabel' | 'showScore'>) {
  const badge = getBadgeByScore(score);

  return (
    <div className={cn('group relative', className)}>
      <ReciprocityBadge score={score} size={size} showLabel={false} />
      
      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
        <div className="bg-popover text-popover-foreground rounded-lg shadow-lg p-3 w-64">
          <div className="flex items-center gap-2 mb-2">
            <ReciprocityBadge score={score} size="sm" showLabel={false} animated={false} />
            <div>
              <p className="font-semibold">{badge.name}</p>
              <p className="text-xs text-muted-foreground">Score: {score}</p>
            </div>
          </div>
          <p className="text-xs mb-2">{badge.description}</p>
          <div className="text-xs space-y-1">
            <p className="font-semibold">Avantages:</p>
            <ul className="space-y-0.5">
              {badge.perks.slice(0, 2).map((perk, i) => (
                <li key={i} className="flex items-start gap-1">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>{perk}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}