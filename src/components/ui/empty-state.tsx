import { motion, useReducedMotion } from "framer-motion";
import { LucideIcon, Heart, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface EmptyStateProps {
  // Icône principale (composant Lucide)
  icon: LucideIcon;
  
  // Textes
  title: string;
  description?: string;
  encouragement?: string;
  
  // Action CTA (optionnel)
  actionLabel?: string;
  actionIcon?: LucideIcon;
  onAction?: () => void;
  
  // Personnalisation couleurs
  iconColor?: string;
  accentColor?: string;
  pulseGradient?: string;
  
  // Décorations flottantes (optionnel)
  showDecorations?: boolean;
  decorationTopIcon?: LucideIcon;
  decorationBottomIcon?: LucideIcon;
  
  // Layout
  className?: string;
  size?: "sm" | "md" | "lg";
  
  // Contenu custom (remplace le bouton)
  children?: ReactNode;
}

const sizeClasses = {
  sm: { container: "w-16 h-16", icon: "h-8 w-8", decoration: "h-3 w-3" },
  md: { container: "w-24 h-24", icon: "h-12 w-12", decoration: "h-4 w-4" },
  lg: { container: "w-32 h-32", icon: "h-16 w-16", decoration: "h-5 w-5" },
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  encouragement,
  actionLabel,
  actionIcon: ActionIcon,
  onAction,
  iconColor = "text-primary",
  accentColor = "text-gratitude",
  pulseGradient = "bg-gradient-primary",
  showDecorations = true,
  decorationTopIcon: TopIcon = Sparkles,
  decorationBottomIcon: BottomIcon = Heart,
  className,
  size = "md",
  children,
}: EmptyStateProps) {
  const shouldReduceMotion = useReducedMotion();
  const sizes = sizeClasses[size];

  // Animations conditionnelles
  const floatAnimation = shouldReduceMotion 
    ? {} 
    : { y: [-5, 5, -5], rotate: [0, 10, 0] };
    
  const pulseAnimation = shouldReduceMotion
    ? {}
    : { scale: [1, 1.1, 1], opacity: [0.5, 0.3, 0.5] };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn("text-center py-12 px-4", className)}
    >
      {/* Icône principale animée */}
      <motion.div
        initial={{ scale: 0, rotate: shouldReduceMotion ? 0 : -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
        className={cn("relative mx-auto mb-6", sizes.container)}
      >
        {/* Cercle pulse */}
        <motion.div
          animate={pulseAnimation}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className={cn("absolute inset-0 rounded-full blur-xl", pulseGradient)}
        />
        
        {/* Conteneur icône */}
        <div className={cn(
          "relative rounded-full flex items-center justify-center border border-primary/20",
          "bg-gradient-to-br from-secondary/80 to-primary/10",
          sizes.container
        )}>
          <Icon className={cn(sizes.icon, iconColor)} />
        </div>
        
        {/* Décorations flottantes */}
        {showDecorations && (
          <>
            <motion.div
              animate={floatAnimation}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute -top-2 -right-2"
            >
              <TopIcon className={cn(sizes.decoration, accentColor)} />
            </motion.div>
            
            <motion.div
              animate={shouldReduceMotion ? {} : { y: [5, -5, 5], rotate: [0, -10, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
              className="absolute -bottom-1 -left-2"
            >
              <BottomIcon className={cn(sizes.decoration, "text-heart fill-heart")} />
            </motion.div>
          </>
        )}
      </motion.div>

      {/* Titre */}
      <motion.h3
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-lg font-semibold text-foreground mb-2"
      >
        {title}
      </motion.h3>

      {/* Description */}
      {description && (
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-muted-foreground mb-6 max-w-xs mx-auto"
        >
          {description}
        </motion.p>
      )}

      {/* CTA Button ou children custom */}
      {(onAction && actionLabel) ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
        >
          <Button 
            onClick={onAction}
            className="bg-gradient-primary hover:opacity-90 transition-opacity"
          >
            {ActionIcon && <ActionIcon className="h-4 w-4 mr-2" />}
            {actionLabel}
          </Button>
        </motion.div>
      ) : children ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
        >
          {children}
        </motion.div>
      ) : null}

      {/* Texte d'encouragement */}
      {encouragement && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-xs text-muted-foreground/70 mt-4"
        >
          {encouragement}
        </motion.p>
      )}
    </motion.div>
  );
}
