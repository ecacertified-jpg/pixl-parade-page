import { Heart } from "lucide-react";
import { usePosts } from "@/hooks/usePosts";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { PostCard } from "@/components/PostCard";
export function NewsFeed() {
  const {
    user
  } = useAuth();
  const {
    posts,
    loading,
    toggleReaction,
    refreshPosts
  } = usePosts();
  if (loading) {
    return <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-400">
          <Heart className="h-5 w-5 text-primary" />
          Fil d'actualités
        </h3>
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="bg-card p-4 rounded-2xl">
              <div className="flex items-center gap-3 mb-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <Skeleton className="h-20 w-full mb-3" />
              <div className="flex gap-4">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-16" />
              </div>
            </div>)}
        </div>
      </div>;
  }
  if (posts.length === 0) {
    return <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-foreground">
          <Heart className="h-5 w-5 text-primary" />
          Fil d'actualités
        </h3>
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">
            Aucune publication pour le moment. Soyez le premier à partager un moment de joie ! 🎉
          </p>
        </Card>
      </div>;
  }
  return <div>
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-foreground">
        <Heart className="h-5 w-5 text-primary" />
        Fil d'actualités
      </h3>

      <div className="space-y-4">
        {posts.map(post => <PostCard key={post.id} post={post} currentUserId={user?.id || null} toggleReaction={toggleReaction} refreshPosts={refreshPosts} />)}
      </div>
    </div>;
}