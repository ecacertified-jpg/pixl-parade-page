import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface FundComment {
  id: string;
  fund_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
}

export const useFundComments = (fundId: string) => {
  const [comments, setComments] = useState<FundComment[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const loadComments = async () => {
    try {
      setLoading(true);
      
      // Fetch comments with user profiles
      const { data: commentsData, error: commentsError } = await supabase
        .from("fund_comments")
        .select("*")
        .eq("fund_id", fundId)
        .order("created_at", { ascending: true });

      if (commentsError) throw commentsError;

      if (commentsData && commentsData.length > 0) {
        // Get unique user IDs
        const userIds = [...new Set(commentsData.map(c => c.user_id))];
        
        // Fetch profiles for all users
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("id, first_name, last_name")
          .in("id", userIds);

        if (profilesError) throw profilesError;

        // Map profiles to comments
        const commentsWithProfiles = commentsData.map(comment => {
          const profile = profilesData?.find(p => p.id === comment.user_id);
          return {
            ...comment,
            user: {
              id: comment.user_id,
              name: profile 
                ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || "Utilisateur"
                : "Utilisateur inconnu"
            }
          };
        });

        setComments(commentsWithProfiles);
      } else {
        setComments([]);
      }
    } catch (error) {
      console.error("Error loading comments:", error);
      toast.error("Erreur lors du chargement des commentaires");
    } finally {
      setLoading(false);
    }
  };

  const addComment = async (content: string) => {
    if (!user) {
      toast.error("Vous devez être connecté pour commenter");
      return;
    }

    if (!content.trim()) {
      toast.error("Le commentaire ne peut pas être vide");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("fund_comments")
        .insert({
          fund_id: fundId,
          user_id: user.id,
          content: content.trim()
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Commentaire ajouté");
      await loadComments();
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Erreur lors de l'ajout du commentaire");
    }
  };

  const deleteComment = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from("fund_comments")
        .delete()
        .eq("id", commentId);

      if (error) throw error;

      toast.success("Commentaire supprimé");
      await loadComments();
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error("Erreur lors de la suppression du commentaire");
    }
  };

  useEffect(() => {
    loadComments();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`fund_comments_${fundId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "fund_comments",
          filter: `fund_id=eq.${fundId}`
        },
        () => {
          loadComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fundId]);

  return {
    comments,
    loading,
    addComment,
    deleteComment,
    refreshComments: loadComments
  };
};
