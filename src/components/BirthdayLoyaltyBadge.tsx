import { motion } from 'framer-motion';
import { Award, Trophy, Star } from 'lucide-react';

interface BirthdayLoyaltyBadgeProps {
  level: number; // 0-5
  name: string; // "🥉 Bronze", "🥈 Argent", etc.
  totalCelebrations: number;
  earnedNewBadge?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const BirthdayLoyaltyBadge = ({
  level,
  name,
  totalCelebrations,
  earnedNewBadge = false,
  size = 'md',
  showLabel = true
}: BirthdayLoyaltyBadgeProps) => {
  
  // Configuration des couleurs et styles selon le niveau
  const badgeConfig = {
    0: { gradient: 'from-gray-400 to-gray-500', icon: Award, glow: 'shadow-gray-400/20' },
    1: { gradient: 'from-amber-600 to-amber-700', icon: Award, glow: 'shadow-amber-500/30' }, // Bronze
    2: { gradient: 'from-gray-300 to-gray-400', icon: Trophy, glow: 'shadow-gray-400/40' }, // Argent
    3: { gradient: 'from-yellow-400 to-yellow-600', icon: Trophy, glow: 'shadow-yellow-500/50' }, // Or
    4: { gradient: 'from-cyan-400 to-blue-500', icon: Star, glow: 'shadow-cyan-500/50' }, // Platine
    5: { gradient: 'from-purple-400 via-pink-500 to-blue-500', icon: Star, glow: 'shadow-purple-500/60' } // Diamant
  };

  const config = badgeConfig[level as keyof typeof badgeConfig] || badgeConfig[0];
  const Icon = config.icon;

  // Tailles
  const sizeConfig = {
    sm: { container: 'h-12 w-12', icon: 'h-5 w-5', text: 'text-xs' },
    md: { container: 'h-16 w-16', icon: 'h-7 w-7', text: 'text-sm' },
    lg: { container: 'h-24 w-24', icon: 'h-10 w-10', text: 'text-base' }
  };

  const sizes = sizeConfig[size];

  return (
    <div className="flex flex-col items-center gap-2">
      <motion.div
        initial={earnedNewBadge ? { scale: 0, rotate: -180 } : { scale: 1 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ 
          type: "spring", 
          stiffness: 260, 
          damping: 20,
          delay: earnedNewBadge ? 0.3 : 0
        }}
        className="relative"
      >
        {/* Badge container */}
        <div className={`
          ${sizes.container}
          rounded-full
          bg-gradient-to-br ${config.gradient}
          ${config.glow}
          shadow-xl
          flex items-center justify-center
          border-2 border-white/20
          relative
        `}>
          <Icon className={`${sizes.icon} text-white`} />
          
          {/* Pulse animation for new badges */}
          {earnedNewBadge && (
            <motion.div
              className="absolute inset-0 rounded-full bg-white/30"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.5, 0, 0.5]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          )}
        </div>

        {/* Celebration count badge */}
        {totalCelebrations > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="
              absolute -bottom-1 -right-1
              bg-gradient-to-br from-primary to-primary-foreground
              text-primary-foreground
              text-xs font-bold
              rounded-full
              h-6 w-6
              flex items-center justify-center
              border-2 border-white
              shadow-lg
            "
          >
            {totalCelebrations}
          </motion.div>
        )}
      </motion.div>

      {/* Label */}
      {showLabel && (
        <div className="text-center">
          <p className={`font-bold ${sizes.text} text-foreground`}>
            {name}
          </p>
          <p className="text-xs text-muted-foreground">
            {totalCelebrations} {totalCelebrations > 1 ? 'anniversaires' : 'anniversaire'}
          </p>
        </div>
      )}

      {/* New badge announcement */}
      {earnedNewBadge && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center"
        >
          <p className="text-xs font-semibold text-primary animate-pulse">
            ✨ Nouveau badge débloqué !
          </p>
        </motion.div>
      )}
    </div>
  );
};
