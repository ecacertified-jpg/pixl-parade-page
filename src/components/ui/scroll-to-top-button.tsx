import { useState, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ScrollToTopButtonProps {
  threshold?: number;
  className?: string;
  position?: "left" | "right";
}

export function ScrollToTopButton({
  threshold = 400,
  className,
  position = "right",
}: ScrollToTopButtonProps) {
  const [isVisible, setIsVisible] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > threshold);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Check initial state
    
    return () => window.removeEventListener("scroll", handleScroll);
  }, [threshold]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: shouldReduceMotion ? "auto" : "smooth",
    });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className={cn(
            "fixed bottom-24 z-40",
            position === "right" ? "right-4" : "left-4",
            className
          )}
        >
          <Button
            onClick={scrollToTop}
            size="icon"
            className="h-12 w-12 rounded-full bg-gradient-primary shadow-lg 
                       hover:shadow-xl hover:scale-105 transition-all duration-200
                       border-2 border-white/20"
            aria-label="Retour en haut de la page"
          >
            <ArrowUp className="h-5 w-5 text-primary-foreground" />
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
