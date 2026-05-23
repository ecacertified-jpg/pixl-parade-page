import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AlbumPhotoComment {
  id: string;
  photo_id: string;
  user_id: string | null;
  author_name: string | null;
  content: string;
  created_at: string;
}

export function useAlbumPhotoComments(photoId: string | null, enabled = true) {
  const [comments, setComments] = useState<AlbumPhotoComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    if (!photoId || !enabled) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("album_photo_comments")
      .select("id, photo_id, user_id, author_name, content, created_at")
      .eq("photo_id", photoId)
      .order("created_at", { ascending: true });
    setLoading(false);
    if (!error && data) setComments(data as AlbumPhotoComment[]);
  }, [photoId, enabled]);

  useEffect(() => {
    load();
  }, [load]);

  const addComment = useCallback(
    async (content: string, authorName: string | null, userId: string) => {
      if (!photoId) return;
      const text = content.trim();
      if (!text) return;
      setSending(true);
      const { data, error } = await supabase
        .from("album_photo_comments")
        .insert({
          photo_id: photoId,
          user_id: userId,
          author_name: authorName,
          content: text,
        })
        .select("id, photo_id, user_id, author_name, content, created_at")
        .single();
      setSending(false);
      if (error || !data) {
        toast.error("Impossible d'envoyer le commentaire");
        return;
      }
      setComments((prev) => [...prev, data as AlbumPhotoComment]);
    },
    [photoId],
  );

  const deleteComment = useCallback(async (id: string) => {
    const { error } = await supabase.from("album_photo_comments").delete().eq("id", id);
    if (error) {
      toast.error("Suppression refusée");
      return;
    }
    setComments((prev) => prev.filter((c) => c.id !== id));
  }, []);

  return { comments, loading, sending, addComment, deleteComment, reload: load };
}