import { useState, useEffect } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
  MoreVertical,
  Link2,
  Bookmark,
  BookmarkCheck,
  Edit,
  Trash2,
  Flag,
  EyeOff,
  Pin,
  PinOff,
} from 'lucide-react';
import { usePostActions } from '@/hooks/usePostActions';
import { EditPostModal } from './EditPostModal';
import { ReportPostModal } from './ReportPostModal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface PostActionsMenuProps {
  postId: string;
  authorId: string;
  currentUserId: string | null;
  isPinned?: boolean;
  postContent?: string;
  postMediaUrl?: string;
  postMediaType?: string;
  postOccasion?: string;
  onRefresh?: () => void;
}

export function PostActionsMenu({
  postId,
  authorId,
  currentUserId,
  isPinned = false,
  postContent,
  postMediaUrl,
  postMediaType,
  postOccasion,
  onRefresh,
}: PostActionsMenuProps) {
  const isAuthor = currentUserId === authorId;
  const {
    copyLink,
    savePost,
    unsavePost,
    deletePost,
    hidePost,
    pinPost,
    unpinPost,
    checkIfSaved,
  } = usePostActions();

  const [isSaved, setIsSaved] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    checkIfSaved(postId).then(setIsSaved);
  }, [postId]);

  const handleSaveToggle = async () => {
    if (isSaved) {
      await unsavePost(postId);
      setIsSaved(false);
    } else {
      await savePost(postId);
      setIsSaved(true);
    }
  };

  const handleDelete = async () => {
    await deletePost(postId, () => {
      setShowDeleteDialog(false);
      if (onRefresh) onRefresh();
    });
  };

  const handleHide = async () => {
    await hidePost(postId, onRefresh);
  };

  const handlePinToggle = async () => {
    if (isPinned) {
      await unpinPost(postId, onRefresh);
    } else {
      await pinPost(postId, onRefresh);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={() => copyLink(postId)}>
            <Link2 className="mr-2 h-4 w-4" />
            <span>Copier le lien</span>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={handleSaveToggle}>
            {isSaved ? (
              <>
                <BookmarkCheck className="mr-2 h-4 w-4" />
                <span>Retirer des favoris</span>
              </>
            ) : (
              <>
                <Bookmark className="mr-2 h-4 w-4" />
                <span>Enregistrer</span>
              </>
            )}
          </DropdownMenuItem>

          {isAuthor && (
            <>
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={handlePinToggle}>
                {isPinned ? (
                  <>
                    <PinOff className="mr-2 h-4 w-4" />
                    <span>Désépingler</span>
                  </>
                ) : (
                  <>
                    <Pin className="mr-2 h-4 w-4" />
                    <span>Épingler</span>
                  </>
                )}
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => setShowEditModal(true)}>
                <Edit className="mr-2 h-4 w-4" />
                <span>Modifier</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Supprimer</span>
              </DropdownMenuItem>
            </>
          )}

          {!isAuthor && (
            <>
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={handleHide}>
                <EyeOff className="mr-2 h-4 w-4" />
                <span>Masquer</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => setShowReportModal(true)}
                className="text-destructive focus:text-destructive"
              >
                <Flag className="mr-2 h-4 w-4" />
                <span>Signaler</span>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Modals */}
      {showEditModal && (
        <EditPostModal
          postId={postId}
          currentContent={postContent || ''}
          currentMediaUrl={postMediaUrl}
          currentMediaType={postMediaType}
          currentOccasion={postOccasion}
          open={showEditModal}
          onOpenChange={setShowEditModal}
          onSuccess={() => {
            setShowEditModal(false);
            if (onRefresh) onRefresh();
          }}
        />
      )}

      {showReportModal && (
        <ReportPostModal
          postId={postId}
          open={showReportModal}
          onOpenChange={setShowReportModal}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la publication ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Votre publication sera définitivement supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
