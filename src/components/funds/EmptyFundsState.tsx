import { motion, useReducedMotion } from "framer-motion";
import { Gift, Plus, Heart, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyFundsStateProps {
  occasionFilter?: string | null;
  occasionLabel?: string;
  onCreateFund: () => void;
}

export function EmptyFundsState({ 
  occasionFilter, 
  occasionLabel,
  onCreateFund 
}: EmptyFundsStateProps) {
  const shouldReduceMotion = useReducedMotion();
  
  // Animations désactivées si préférence utilisateur
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
      className="text-center py-12 px-4"
    >
      {/* Icône principale animée */}
      <motion.div
        initial={{ scale: 0, rotate: shouldReduceMotion ? 0 : -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ 
          type: "spring", 
          stiffness: 200, 
          damping: 15,
          delay: 0.1 
        }}
        className="relative mx-auto mb-6 w-24 h-24"
      >
        {/* Cercle de fond avec pulse */}
        <motion.div
          animate={pulseAnimation}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 bg-gradient-primary rounded-full blur-xl"
        />
        
        {/* Conteneur de l'icône */}
        <div className="relative bg-gradient-to-br from-secondary/80 to-primary/10 rounded-full w-24 h-24 flex items-center justify-center border border-primary/20">
          <Gift className="h-12 w-12 text-primary" />
        </div>
        
        {/* Étoiles décoratives flottantes */}
        <motion.div
          animate={floatAnimation}
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute -top-2 -right-2"
        >
          <Sparkles className="h-5 w-5 text-gratitude" />
        </motion.div>
        
        <motion.div
          animate={shouldReduceMotion ? {} : { y: [5, -5, 5], rotate: [0, -10, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
          className="absolute -bottom-1 -left-2"
        >
          <Heart className="h-4 w-4 text-heart fill-heart" />
        </motion.div>
      </motion.div>

      {/* Titre animé */}
      <motion.h3
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-lg font-semibold text-foreground mb-2"
      >
        Aucune cagnotte trouvée
      </motion.h3>

      {/* Description contextuelle */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-muted-foreground mb-6 max-w-xs mx-auto"
      >
        {occasionFilter && occasionLabel
          ? `Aucune cagnotte pour ${occasionLabel.toLowerCase()} n'est disponible pour le moment.`
          : "Aucune cagnotte publique n'est disponible pour le moment."
        }
      </motion.p>

      {/* Bouton CTA animé */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
      >
        <Button 
          onClick={onCreateFund}
          className="bg-gradient-primary hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4 mr-2" />
          Créer la première
        </Button>
      </motion.div>

      {/* Texte d'encouragement */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="text-xs text-muted-foreground/70 mt-4"
      >
        Soyez le premier à organiser un cadeau collectif !
      </motion.p>
    </motion.div>
  );
}
