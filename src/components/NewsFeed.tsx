import { Heart, BookOpen } from "lucide-react";
import { usePagesFeed } from "@/hooks/usePagesFeed";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { PageFeedCard } from "@/components/PageFeedCard";

export function NewsFeed() {
  const { pages, loading } = usePagesFeed();

  if (loading) {
    return (
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-400 mb-4">
          <Heart className="h-5 w-5 text-primary" />
          Fil d'actualités
        </h3>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card p-4 rounded-2xl">
              <div className="flex items-center gap-3 mb-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <Skeleton className="h-40 w-full rounded-xl mb-3" />
              <Skeleton className="h-8 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-400 mb-4">
        <Heart className="h-5 w-5 text-primary" />
        Fil d'actualités
      </h3>

      {pages.length === 0 ? (
        <Card className="p-8 text-center">
          <BookOpen className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground font-medium mb-1">
            Aucun album souvenir pour le moment
          </p>
          <p className="text-sm text-muted-foreground">
            Créez une page d'anniversaire ou d'événement pour partager vos moments de joie ! 🎉
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {pages.map((page) => (
            <PageFeedCard key={`${page.type}-${page.id}`} page={page} />
          ))}
        </div>
      )}
    </div>
  );
}
