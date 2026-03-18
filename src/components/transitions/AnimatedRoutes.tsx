import { ReactNode } from "react";
import { Routes, useLocation } from "react-router-dom";

interface AnimatedRoutesProps {
  children: ReactNode;
}

/**
 * AnimatedRoutes - Wrapper léger pour React Router
 * Les pages se montent instantanément sans animation de blocage.
 */
export function AnimatedRoutes({ children }: AnimatedRoutesProps) {
  const location = useLocation();
  return <Routes location={location}>{children}</Routes>;
}
