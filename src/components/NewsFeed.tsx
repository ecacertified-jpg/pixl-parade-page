import { useState } from "react";
import { Heart, BookOpen, Users } from "lucide-react";
import { usePagesFeed } from "@/hooks/usePagesFeed";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { PageFeedCard } from "@/components/PageFeedCard";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { usePageFollow } from "@/hooks/usePageFollow";

export function NewsFeed() {
  const [filter, setFilter] = useState<'all' | 'following'>('all');
  const { pages, loading } = usePagesFeed(filter);
  const { isFollowing, toggleFollow } = usePageFollow();

  const renderSkeleton = () => (
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
  );

  const renderEmpty = () => (
    <Card className="p-8 text-center">
      {filter === 'following' ? (
        <>
          <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground font-medium mb-1">
            Aucune page suivie
          </p>
          <p className="text-sm text-muted-foreground">
            Suivez les pages de vos proches pour les retrouver ici ! 👥
          </p>
        </>
      ) : (
        <>
          <BookOpen className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground font-medium mb-1">
            Aucun album souvenir pour le moment
          </p>
          <p className="text-sm text-muted-foreground">
            Créez une page d'anniversaire ou d'événement pour partager vos moments de joie ! 🎉
          </p>
        </>
      )}
    </Card>
  );

  return (
    <div>
      <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-400 mb-4">
        <Heart className="h-5 w-5 text-primary" />
        Fil d'actualités
      </h3>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as 'all' | 'following')} className="mb-4">
        <TabsList className="w-full">
          <TabsTrigger value="all" className="flex-1">Tous</TabsTrigger>
          <TabsTrigger value="following" className="flex-1">Abonnements</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? renderSkeleton() : pages.length === 0 ? renderEmpty() : (
        <div className="space-y-4">
          {pages.map((page) => (
            <PageFeedCard
              key={`${page.type}-${page.id}`}
              page={page}
              isFollowing={isFollowing(page.type, page.id)}
              onToggleFollow={() => toggleFollow(page.type, page.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
