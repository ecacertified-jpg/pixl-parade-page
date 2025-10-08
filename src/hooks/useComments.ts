import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: {
    first_name?: string;
    last_name?: string;
  };
}

export function useComments(postId: string) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const { data: commentsData, error } = await supabase
        .from('post_comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Fetch profiles for all unique user IDs
      const userIds = [...new Set(commentsData?.map((comment) => comment.user_id) || [])];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name')
        .in('user_id', userIds);

      // Create a map of user_id to profile
      const profilesMap = new Map(
        profilesData?.map((profile) => [profile.user_id, profile]) || []
      );

      // Merge comments with profiles
      const commentsWithProfiles = (commentsData || []).map((comment) => {
        const profile = profilesMap.get(comment.user_id);
        return {
          ...comment,
          profiles: profile ? {
            first_name: profile.first_name,
            last_name: profile.last_name,
          } : undefined,
        };
      });

      setComments(commentsWithProfiles);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast.error('Erreur lors du chargement des commentaires');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (postId) {
      fetchComments();
    }
  }, [postId]);

  const addComment = async (content: string) => {
    if (!user?.id || !content.trim()) {
      toast.error('Veuillez saisir un commentaire');
      return false;
    }

    try {
      const { error } = await supabase
        .from('post_comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content: content.trim(),
        });

      if (error) throw error;

      toast.success('Commentaire publié');
      await fetchComments();
      return true;
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Erreur lors de la publication du commentaire');
      return false;
    }
  };

  const deleteComment = async (commentId: string) => {
    if (!user?.id) return false;

    try {
      const { error } = await supabase
        .from('post_comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Commentaire supprimé');
      await fetchComments();
      return true;
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Erreur lors de la suppression du commentaire');
      return false;
    }
  };

  return {
    comments,
    loading,
    addComment,
    deleteComment,
    refreshComments: fetchComments,
  };
}
