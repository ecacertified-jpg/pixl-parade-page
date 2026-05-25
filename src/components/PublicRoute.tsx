import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePresenceTracker } from "@/hooks/usePresenceTracker";

/**
 * Wraps a route that is accessible to both signed-in users and visitors.
 * - Tracks presence only when a user is signed in.
 * - Persists the last visited route for session restoration.
 * - Does NOT redirect visitors away. Action-level gating is handled by
 *   `useAuthGate` inside individual components.
 */
export const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const location = useLocation();

  usePresenceTracker();

  useEffect(() => {
    if (user && location.pathname !== "/auth") {
      localStorage.setItem("last_visited_route", location.pathname + location.search);
    }
  }, [user, location.pathname, location.search]);

  return <>{children}</>;
};