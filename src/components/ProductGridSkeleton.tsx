import { motion, useReducedMotion } from "framer-motion";
import { ProductCardSkeleton } from "@/components/ProductCardSkeleton";

interface ProductGridSkeletonProps {
  count?: number;
  columns?: 1 | 2 | 3;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08
    }
  }
};

export function ProductGridSkeleton({ 
  count = 4, 
  columns = 2 
}: ProductGridSkeletonProps) {
  const shouldReduceMotion = useReducedMotion();

  const gridClass = {
    1: "grid-cols-1",
    2: "grid-cols-2",
    3: "grid-cols-3"
  }[columns];

  const content = (
    <>
      {Array.from({ length: count }, (_, i) => (
        <ProductCardSkeleton key={i} index={i} />
      ))}
    </>
  );

  if (shouldReduceMotion) {
    return (
      <div className={`grid ${gridClass} gap-3`}>
        {content}
      </div>
    );
  }

  return (
    <motion.div
      className={`grid ${gridClass} gap-3`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {content}
    </motion.div>
  );
}
