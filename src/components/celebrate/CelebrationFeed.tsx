import { useCelebrationFeed, type CelebrationPageType } from "@/hooks/useCelebrationFeed";
import { CelebrationCard } from "./CelebrationCard";
import { ComposerSheet } from "./ComposerSheet";
import { Loader2 } from "lucide-react";

interface Props {
  pageType?: CelebrationPageType;
  pageId?: string | null;
  emptyTitle?: string;
  showComposer?: boolean;
}

export function CelebrationFeed({
  pageType,
  pageId,
  emptyTitle = "Aucune célébration pour le moment",
  showComposer = true,
}: Props) {
  const { posts, loading, createPost, deletePost } = useCelebrationFeed({ pageType, pageId });

  return (
    <div className="space-y-4">
      {showComposer && (
        <ComposerSheet
          pageType={pageType}
          pageId={pageId}
          onPublish={(i) => createPost(i as any)}
          fullWidth
        />
      )}

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/40 p-8 text-center">
          <p className="text-2xl mb-2">✨</p>
          <p className="text-sm text-muted-foreground">{emptyTitle}</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {posts.map((p) => (
            <li key={p.id} className="animate-fade-in">
              <CelebrationCard post={p} onDelete={deletePost} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}