import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export function usePostActions() {
  const [loading, setLoading] = useState(false);

  const copyLink = async (postId: string) => {
    const url = `${window.location.origin}/publications/${postId}`;
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: "Lien copié !",
        description: "Le lien de la publication a été copié dans le presse-papiers.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de copier le lien.",
        variant: "destructive",
      });
    }
  };

  const savePost = async (postId: string) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { error } = await supabase
        .from('saved_posts')
        .insert({ user_id: user.id, post_id: postId });

      if (error) throw error;

      toast({
        title: "Publication enregistrée !",
        description: "Vous pouvez retrouver cette publication dans vos favoris.",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'enregistrer la publication.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const unsavePost = async (postId: string) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { error } = await supabase
        .from('saved_posts')
        .delete()
        .eq('user_id', user.id)
        .eq('post_id', postId);

      if (error) throw error;

      toast({
        title: "Publication retirée",
        description: "La publication a été retirée de vos favoris.",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de retirer la publication.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deletePost = async (postId: string, onSuccess?: () => void) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      toast({
        title: "Publication supprimée",
        description: "Votre publication a été supprimée avec succès.",
      });

      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer la publication.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const reportPost = async (postId: string, reason: string, details?: string) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { error } = await supabase
        .from('reports')
        .insert({
          post_id: postId,
          reporter_id: user.id,
          reason,
          details,
        });

      if (error) throw error;

      toast({
        title: "Signalement envoyé",
        description: "Merci pour votre signalement. Notre équipe va l'examiner.",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'envoyer le signalement.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const hidePost = async (postId: string, onSuccess?: () => void) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { error } = await supabase
        .from('hidden_posts')
        .insert({ user_id: user.id, post_id: postId });

      if (error) throw error;

      toast({
        title: "Publication masquée",
        description: "Cette publication n'apparaîtra plus dans votre fil d'actualités.",
      });

      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de masquer la publication.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const pinPost = async (postId: string, onSuccess?: () => void) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Dé-épingler toutes les autres publications de l'utilisateur
      await supabase
        .from('posts')
        .update({ is_pinned: false })
        .eq('user_id', user.id);

      // Épingler la publication sélectionnée
      const { error } = await supabase
        .from('posts')
        .update({ is_pinned: true })
        .eq('id', postId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Publication épinglée",
        description: "Cette publication apparaîtra en haut de votre profil.",
      });

      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'épingler la publication.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const unpinPost = async (postId: string, onSuccess?: () => void) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('posts')
        .update({ is_pinned: false })
        .eq('id', postId);

      if (error) throw error;

      toast({
        title: "Publication désépinglée",
        description: "La publication n'est plus épinglée.",
      });

      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de désépingler la publication.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkIfSaved = async (postId: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase
        .from('saved_posts')
        .select('id')
        .eq('user_id', user.id)
        .eq('post_id', postId)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    } catch {
      return false;
    }
  };

  return {
    loading,
    copyLink,
    savePost,
    unsavePost,
    deletePost,
    reportPost,
    hidePost,
    pinPost,
    unpinPost,
    checkIfSaved,
  };
}
