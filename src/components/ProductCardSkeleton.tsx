import { motion, useReducedMotion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { AnimatedSkeleton } from "@/components/AnimatedSkeleton";

interface ProductCardSkeletonProps {
  index?: number;
}

export function ProductCardSkeleton({ index = 0 }: ProductCardSkeletonProps) {
  const shouldReduceMotion = useReducedMotion();
  const staggerDelay = index * 0.1;

  const content = (
    <Card className="overflow-hidden h-full">
      <AnimatedSkeleton 
        className="w-full aspect-square" 
        delay={staggerDelay}
      />
      
      <div className="p-3 space-y-2">
        <AnimatedSkeleton 
          className="h-4 w-3/4" 
          variant="text"
          delay={staggerDelay + 0.1}
        />
        
        <AnimatedSkeleton 
          className="h-3 w-1/2" 
          variant="text"
          delay={staggerDelay + 0.15}
        />
        
        <AnimatedSkeleton 
          className="h-3 w-1/3" 
          variant="text"
          delay={staggerDelay + 0.2}
        />
        
        <div className="flex items-center justify-between pt-1">
          <AnimatedSkeleton 
            className="h-5 w-1/3" 
            delay={staggerDelay + 0.25}
          />
          <AnimatedSkeleton 
            className="h-7 w-7 rounded-md" 
            delay={staggerDelay + 0.3}
          />
        </div>
      </div>
    </Card>
  );

  if (shouldReduceMotion) {
    return content;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.3, 
        delay: staggerDelay,
        ease: "easeOut"
      }}
    >
      {content}
    </motion.div>
  );
}
