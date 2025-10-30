import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface UserStats {
  friendsCount: number;
  giftsGiven: number;
  giftsReceived: number;
  fundsCreated: number;
  contributionsCount: number;
  communityPoints: number;
}

export const useUserStats = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats>({
    friendsCount: 0,
    giftsGiven: 0,
    giftsReceived: 0,
    fundsCreated: 0,
    contributionsCount: 0,
    communityPoints: 0,
  });
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Fetch all stats in parallel
      const [
        friendsResult,
        giftsGivenResult,
        giftsReceivedResult,
        fundsResult,
        contributionsResult,
        communityScoreResult,
      ] = await Promise.all([
        // Count friends (contact_relationships where user is either user_a or user_b)
        supabase
          .from("contact_relationships")
          .select("*", { count: "exact", head: true })
          .or(`user_a.eq.${user.id},user_b.eq.${user.id}`),

        // Count gifts given
        supabase
          .from("gifts")
          .select("*", { count: "exact", head: true })
          .eq("giver_id", user.id),

        // Count gifts received
        supabase
          .from("gifts")
          .select("*", { count: "exact", head: true })
          .eq("receiver_id", user.id),

        // Count collective funds created
        supabase
          .from("collective_funds")
          .select("*", { count: "exact", head: true })
          .eq("creator_id", user.id),

        // Count contributions to funds
        supabase
          .from("fund_contributions")
          .select("*", { count: "exact", head: true })
          .eq("contributor_id", user.id),

        // Get community score
        supabase
          .from("community_scores")
          .select("total_points")
          .eq("user_id", user.id)
          .maybeSingle(),
      ]);

      setStats({
        friendsCount: friendsResult.count || 0,
        giftsGiven: giftsGivenResult.count || 0,
        giftsReceived: giftsReceivedResult.count || 0,
        fundsCreated: fundsResult.count || 0,
        contributionsCount: contributionsResult.count || 0,
        communityPoints: communityScoreResult.data?.total_points || 0,
      });
    } catch (error) {
      console.error("Error loading user stats:", error);
      // Keep default values on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, [user?.id]);

  return { stats, loading, refreshStats: loadStats };
};
