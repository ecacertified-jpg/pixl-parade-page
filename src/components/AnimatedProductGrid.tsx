import { ReactNode } from "react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";

interface AnimatedProductGridProps {
  children: ReactNode;
  className?: string;
  keyId?: string;
}

const gridVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1
    }
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2 }
  }
};

export function AnimatedProductGrid({ 
  children, 
  className,
  keyId 
}: AnimatedProductGridProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={keyId}
        className={className}
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={gridVariants}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
