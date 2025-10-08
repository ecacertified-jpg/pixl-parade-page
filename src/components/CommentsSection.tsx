import { useState } from 'react';
import { useComments } from '@/hooks/useComments';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Trash2, Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface CommentsSectionProps {
  postId: string;
  onCommentAdded?: () => void;
}

export function CommentsSection({ postId, onCommentAdded }: CommentsSectionProps) {
  const { user } = useAuth();
  const { comments, loading, addComment, deleteComment } = useComments(postId);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;

    setSubmitting(true);
    const success = await addComment(newComment);
    if (success) {
      setNewComment('');
      onCommentAdded?.();
    }
    setSubmitting(false);
  };

  const handleDelete = async (commentId: string) => {
    await deleteComment(commentId);
    onCommentAdded?.();
  };

  return (
    <div className="mt-4 pt-4 border-t border-border/30 animate-in slide-in-from-top-2 duration-200">
      {/* Comments List */}
      <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
        {loading ? (
          <>
            {[1, 2].map((i) => (
              <div key={i} className="flex gap-2">
                <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-12 w-full" />
                </div>
              </div>
            ))}
          </>
        ) : comments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Aucun commentaire pour le moment. Soyez le premier à commenter ! 💬
          </p>
        ) : (
          comments.map((comment) => {
            const authorName = comment.profiles?.first_name
              ? `${comment.profiles.first_name} ${comment.profiles.last_name || ''}`
              : 'Utilisateur';
            const initials = authorName
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase();
            const timestamp = formatDistanceToNow(new Date(comment.created_at), {
              addSuffix: true,
              locale: fr,
            });
            const isOwn = comment.user_id === user?.id;

            return (
              <div key={comment.id} className="flex gap-2 group">
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-primary text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="bg-muted/50 rounded-2xl px-3 py-2">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-xs font-medium text-foreground">{authorName}</p>
                      {isOwn && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(comment.id)}
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      )}
                    </div>
                    <p className="text-sm text-foreground whitespace-pre-wrap break-words">
                      {comment.content}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 ml-3">{timestamp}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Comment Form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-primary text-xs">
            {user?.email?.[0].toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 flex gap-2">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Écrivez un commentaire..."
            className={cn(
              "min-h-[40px] max-h-32 resize-none text-sm",
              "focus-visible:ring-1 focus-visible:ring-primary"
            )}
            disabled={submitting}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <Button
            type="submit"
            size="sm"
            disabled={!newComment.trim() || submitting}
            className="self-end h-10 px-3"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
