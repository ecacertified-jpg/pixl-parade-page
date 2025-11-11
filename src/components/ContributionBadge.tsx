import { motion } from 'framer-motion';
import { Star, Eye, EyeOff } from 'lucide-react';
import { Button } from './ui/button';
import { useState } from 'react';
import { toast } from 'sonner';

interface ContributionBadgeProps {
  badge: {
    id: string;
    badgeKey: string;
    name: string;
    description: string;
    icon: string;
    level: number;
    colorPrimary: string;
    colorSecondary: string;
    earnedAt: string;
    isShowcased: boolean;
  };
  size?: 'sm' | 'md' | 'lg';
  showActions?: boolean;
  onToggleShowcase?: (badgeId: string, showcase: boolean) => Promise<void>;
}

export const ContributionBadge = ({
  badge,
  size = 'md',
  showActions = false,
  onToggleShowcase
}: ContributionBadgeProps) => {
  const [isShowcased, setIsShowcased] = useState(badge.isShowcased);
  const [isUpdating, setIsUpdating] = useState(false);

  const sizeConfig = {
    sm: {
      container: 'h-20 w-20',
      icon: 'text-3xl',
      text: 'text-xs',
      badge: 'text-[8px] px-1.5 py-0.5'
    },
    md: {
      container: 'h-28 w-28',
      icon: 'text-5xl',
      text: 'text-sm',
      badge: 'text-[10px] px-2 py-1'
    },
    lg: {
      container: 'h-40 w-40',
      icon: 'text-7xl',
      text: 'text-base',
      badge: 'text-xs px-3 py-1.5'
    }
  };

  const config = sizeConfig[size];

  const handleToggleShowcase = async () => {
    if (!onToggleShowcase) return;

    setIsUpdating(true);
    try {
      await onToggleShowcase(badge.id, !isShowcased);
      setIsShowcased(!isShowcased);
      toast.success(
        !isShowcased
          ? 'Badge affiché sur votre profil'
          : 'Badge retiré de votre profil'
      );
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className="flex flex-col items-center gap-2"
    >
      {/* Badge Circle */}
      <div className="relative group">
        <div
          className={`
            ${config.container}
            rounded-full
            flex items-center justify-center
            shadow-xl
            border-2 border-white/30
            relative
            overflow-hidden
          `}
          style={{
            background: `linear-gradient(135deg, ${badge.colorPrimary}, ${badge.colorSecondary})`
          }}
        >
          {/* Icon */}
          <span className={`${config.icon} relative z-10`}>
            {badge.icon}
          </span>

          {/* Shine effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent"
            animate={{
              x: ['-100%', '100%']
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              repeatDelay: 5,
              ease: "easeInOut"
            }}
          />

          {/* Level badge */}
          {badge.level > 1 && (
            <div
              className={`
                absolute bottom-0 right-0
                bg-gradient-to-r from-amber-500 to-orange-500
                text-white font-bold
                rounded-full
                ${config.badge}
                shadow-lg
                border border-white/50
              `}
            >
              Niv. {badge.level}
            </div>
          )}

          {/* Showcased indicator */}
          {isShowcased && (
            <div className="absolute top-0 left-0">
              <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
            </div>
          )}
        </div>
      </div>

      {/* Badge Info */}
      <div className="text-center space-y-1">
        <p className={`font-bold ${config.text} text-foreground`}>
          {badge.name}
        </p>
        <p className="text-xs text-muted-foreground max-w-[150px]">
          {badge.description}
        </p>
        <p className="text-xs text-muted-foreground">
          Obtenu le {new Date(badge.earnedAt).toLocaleDateString('fr-FR')}
        </p>
      </div>

      {/* Actions */}
      {showActions && onToggleShowcase && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleToggleShowcase}
          disabled={isUpdating}
          className="text-xs"
        >
          {isShowcased ? (
            <>
              <EyeOff className="h-3 w-3 mr-1" />
              Masquer
            </>
          ) : (
            <>
              <Eye className="h-3 w-3 mr-1" />
              Afficher
            </>
          )}
        </Button>
      )}
    </motion.div>
  );
};
