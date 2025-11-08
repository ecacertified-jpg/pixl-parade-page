import { useState } from "react";
import { useFundComments } from "@/hooks/useFundComments";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { MessageSquare, Send, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface FundCommentsSectionProps {
  fundId: string;
  isExpanded?: boolean;
}

export const FundCommentsSection = ({ fundId, isExpanded = false }: FundCommentsSectionProps) => {
  const { user } = useAuth();
  const { comments, loading, addComment, deleteComment } = useFundComments(fundId);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showComments, setShowComments] = useState(isExpanded);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    await addComment(newComment);
    setNewComment("");
    setIsSubmitting(false);
  };

  const handleDelete = async (commentId: string) => {
    await deleteComment(commentId);
  };

  if (!showComments && !isExpanded) {
    return (
      <Button
        variant="ghost"
        onClick={() => setShowComments(true)}
        className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
      >
        <MessageSquare className="h-4 w-4" />
        <span>
          {comments.length > 0
            ? `Voir les commentaires (${comments.length})`
            : "Ajouter un commentaire"}
        </span>
      </Button>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Commentaires ({comments.length})
        </h3>
        {!isExpanded && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowComments(false)}
            className="text-xs text-muted-foreground"
          >
            Masquer
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <Card key={i} className="p-3">
              <div className="flex gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-12 w-full" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {comments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucun commentaire pour le moment. Soyez le premier à encourager !
            </p>
          ) : (
            comments.map((comment) => (
              <Card key={comment.id} className="p-3 bg-muted/30">
                <div className="flex gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={comment.user?.avatar_url} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {comment.user?.name?.charAt(0)?.toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {comment.user?.name || "Utilisateur inconnu"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(comment.created_at), {
                            addSuffix: true,
                            locale: fr
                          })}
                        </span>
                      </div>
                      {user?.id === comment.user_id && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Supprimer le commentaire</AlertDialogTitle>
                              <AlertDialogDescription>
                                Êtes-vous sûr de vouloir supprimer ce commentaire ? Cette action est irréversible.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(comment.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Supprimer
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                    <p className="text-sm text-foreground whitespace-pre-wrap">
                      {comment.content}
                    </p>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {user && (
        <form onSubmit={handleSubmit} className="space-y-2">
          <Textarea
            placeholder="Écrivez un message de soutien..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[80px] resize-none"
            disabled={isSubmitting}
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              size="sm"
              disabled={!newComment.trim() || isSubmitting}
              className="gap-2"
            >
              <Send className="h-4 w-4" />
              Envoyer
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};
