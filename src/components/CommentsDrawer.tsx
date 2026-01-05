import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { CommentsSection } from "@/components/CommentsSection";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CommentsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
  onCommentAdded: () => void;
}

export function CommentsDrawer({ open, onOpenChange, postId, onCommentAdded }: CommentsDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[70vh] max-h-[70vh]">
        <DrawerHeader className="flex items-center justify-between border-b pb-3">
          <DrawerTitle className="text-base font-semibold">Commentaires</DrawerTitle>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </DrawerHeader>
        <div className="flex-1 overflow-y-auto p-4">
          <CommentsSection 
            postId={postId} 
            onCommentAdded={onCommentAdded}
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
