import { memo } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { usePosts } from "@/hooks/usePosts";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { PostCard } from "@/components/PostCard";

const Publications = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { posts, loading, toggleReaction, refreshPosts } = usePosts();

  // Filter to show only current user's posts
  const userPosts = posts.filter((post) => post.user_id === user?.id);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-violet-50/30 to-rose-50/20">
      {/* Header */}
      <header className="bg-card/90 backdrop-blur-md sticky top-0 z-50 border-b border-border/30 shadow-sm">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="hover:bg-muted/50"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-poppins font-semibold text-foreground">
            Mes Publications
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 py-6">
        {loading ? (
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
                <Skeleton className="h-20 w-full mb-3" />
                <div className="flex gap-4">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : userPosts.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground mb-4">
              Vous n'avez pas encore de publications.
            </p>
            <Button onClick={() => navigate('/')}>
              Créer ma première publication
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {userPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                currentUserId={user?.id || null}
                toggleReaction={toggleReaction}
                refreshPosts={refreshPosts}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default memo(Publications);
