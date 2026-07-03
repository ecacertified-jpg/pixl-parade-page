import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Ensures the current auth user has a corresponding row in `public.profiles`.
 * Prevents foreign key errors when inserting rows that reference profiles.user_id
 * (e.g. collective_funds.creator_id).
 */
export function useEnsureProfile() {
  return useCallback(async () => {
    const { error } = await (supabase as any).rpc("ensure_profile_exists");
    if (error) {
      console.warn("ensure_profile_exists failed", error);
    }
  }, []);
}