import { Heart, Users, LayoutGrid, Play } from "lucide-react";
import { useState, useEffect } from "react";
import { usePosts } from "@/hooks/usePosts";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { PostCard } from "@/components/PostCard";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NewsFeedProps {
  onModeChange?: (mode: 'feed' | 'tiktok') => void;
  currentMode?: 'feed' | 'tiktok';
}

export function NewsFeed({ onModeChange, currentMode = 'feed' }: NewsFeedProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"all" | "following">("all");
  const [followingLoaded, setFollowingLoaded] = useState(false);
  
  // Load "all" posts initially
  const { posts: allPosts, loading: allLoading, toggleReaction: toggleAllReaction, refreshPosts: refreshAllPosts } = usePosts(false);
  
  // Lazy load "following" posts only when tab is selected
  const { posts: followingPosts, loading: followingLoading, toggleReaction: toggleFollowingReaction, refreshPosts: refreshFollowingPosts } = usePosts(activeTab === "following" || followingLoaded);

  // Mark following as loaded once user switches to that tab
  useEffect(() => {
    if (activeTab === "following" && !followingLoaded) {
      setFollowingLoaded(true);
    }
  }, [activeTab, followingLoaded]);

  const posts = activeTab === "all" ? allPosts : followingPosts;
  const loading = activeTab === "all" ? allLoading : (activeTab === "following" && followingLoading);
  const toggleReaction = activeTab === "all" ? toggleAllReaction : toggleFollowingReaction;
  const refreshPosts = activeTab === "all" ? refreshAllPosts : refreshFollowingPosts;

  if (loading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-400">
            <Heart className="h-5 w-5 text-primary" />
            Fil d'actualités
          </h3>
          {onModeChange && (
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
                <Play className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
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
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-400">
          <Heart className="h-5 w-5 text-primary" />
          Fil d'actualités
        </h3>
        {onModeChange && (
          <div className="flex gap-1 bg-muted/50 rounded-lg p-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className={cn(
                "h-8 w-8 transition-colors",
                currentMode === 'feed' && "bg-background shadow-sm"
              )}
              onClick={() => onModeChange('feed')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className={cn(
                "h-8 w-8 transition-colors",
                currentMode === 'tiktok' && "bg-background shadow-sm"
              )}
              onClick={() => onModeChange('tiktok')}
            >
              <Play className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "all" | "following")} className="w-full mb-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Heart className="h-4 w-4" />
            Tous
          </TabsTrigger>
          <TabsTrigger value="following" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Abonnements
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          {allPosts.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">
                Aucune publication pour le moment. Soyez le premier à partager un moment de joie ! 🎉
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {allPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUserId={user?.id || null}
                  toggleReaction={toggleAllReaction}
                  refreshPosts={refreshAllPosts}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="following" className="mt-4">
          {followingPosts.length === 0 ? (
            <Card className="p-8 text-center">
              <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground mb-2 font-medium">
                Aucune publication de vos abonnements
              </p>
              <p className="text-sm text-muted-foreground">
                Suivez des utilisateurs pour voir leurs publications ici
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {followingPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUserId={user?.id || null}
                  toggleReaction={toggleFollowingReaction}
                  refreshPosts={refreshFollowingPosts}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
