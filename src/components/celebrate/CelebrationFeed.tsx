import { useEffect, useMemo, useState } from "react";
import { useCelebrationFeed, type CelebrationPageType } from "@/hooks/useCelebrationFeed";
import { useVipSet } from "@/hooks/useCelebrationPremium";
import { supabase } from "@/integrations/supabase/client";
import { CelebrationCard } from "./CelebrationCard";
import { ComposerSheet } from "./ComposerSheet";
import { Loader2 } from "lucide-react";

const sb = supabase as any;

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
  const authorIds = useMemo(() => posts.map((p) => p.author_id), [posts]);
  const vipSet = useVipSet(authorIds);
  const [cardMap, setCardMap] = useState<Record<string, string>>({});

  useEffect(() => {
    const ids = Array.from(
      new Set(posts.map((p) => p.card_template_id).filter(Boolean) as string[])
    );
    if (!ids.length) {
      setCardMap({});
      return;
    }
    sb.from("birthday_card_templates")
      .select("id, image_url")
      .in("id", ids)
      .then(({ data }: any) => {
        const m: Record<string, string> = {};
        (data || []).forEach((c: any) => (m[c.id] = c.image_url));
        setCardMap(m);
      });
  }, [posts]);

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
              <CelebrationCard
                post={p}
                onDelete={deletePost}
                isAuthorVip={vipSet.has(p.author_id)}
                cardTemplateUrl={p.card_template_id ? cardMap[p.card_template_id] : null}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}