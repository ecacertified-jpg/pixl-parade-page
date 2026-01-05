import { useState, useRef, useEffect, useCallback } from 'react';
import { usePosts } from '@/hooks/usePosts';
import { useAuth } from '@/contexts/AuthContext';
import { TikTokPostCard } from '@/components/TikTokPostCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Heart } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function TikTokFeed() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"all" | "following">("all");
  const [followingLoaded, setFollowingLoaded] = useState(false);
  const [visiblePostIndex, setVisiblePostIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { posts: allPosts, loading: allLoading, toggleReaction: toggleAllReaction, refreshPosts: refreshAllPosts } = usePosts(false);
  const { posts: followingPosts, loading: followingLoading, toggleReaction: toggleFollowingReaction, refreshPosts: refreshFollowingPosts } = usePosts(activeTab === "following" || followingLoaded);

  useEffect(() => {
    if (activeTab === "following" && !followingLoaded) {
      setFollowingLoaded(true);
    }
  }, [activeTab, followingLoaded]);

  const posts = activeTab === "all" ? allPosts : followingPosts;
  const loading = activeTab === "all" ? allLoading : followingLoading;
  const toggleReaction = activeTab === "all" ? toggleAllReaction : toggleFollowingReaction;
  const refreshPosts = activeTab === "all" ? refreshAllPosts : refreshFollowingPosts;

  // Track which post is visible using Intersection Observer
  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      const scrollTop = containerRef.current.scrollTop;
      const viewportHeight = containerRef.current.clientHeight;
      const newIndex = Math.round(scrollTop / viewportHeight);
      if (newIndex !== visiblePostIndex) {
        setVisiblePostIndex(newIndex);
      }
    }
  }, [visiblePostIndex]);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  if (loading) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <div className="space-y-4 p-8">
          <Skeleton className="w-48 h-48 rounded-full mx-auto bg-white/10" />
          <Skeleton className="w-32 h-4 mx-auto bg-white/10" />
          <Skeleton className="w-48 h-3 mx-auto bg-white/10" />
        </div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="relative h-[100dvh] w-full bg-black">
        {/* Tab switcher overlay - TOUJOURS VISIBLE */}
        <div className="absolute top-16 left-0 right-0 z-20 px-4">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "all" | "following")} className="w-full">
            <TabsList className="grid w-full max-w-xs mx-auto grid-cols-2 bg-black/40 backdrop-blur-sm">
              <TabsTrigger 
                value="all" 
                className="text-white/70 data-[state=active]:text-white data-[state=active]:bg-white/20"
              >
                <Heart className="h-4 w-4 mr-1" />
                Pour toi
              </TabsTrigger>
              <TabsTrigger 
                value="following" 
                className="text-white/70 data-[state=active]:text-white data-[state=active]:bg-white/20"
              >
                <Users className="h-4 w-4 mr-1" />
                Abonnés
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Contenu vide */}
        <div className="h-full flex flex-col items-center justify-center text-white p-8">
          <Heart className="h-16 w-16 mb-4 text-primary" />
          <p className="text-lg font-medium mb-2">Aucune publication</p>
          <p className="text-sm text-white/60 text-center">
            {activeTab === "following" 
              ? "Suivez des utilisateurs pour voir leurs publications ici"
              : "Soyez le premier à partager un moment de joie ! 🎉"
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[100dvh] w-full bg-black overflow-hidden">
      {/* Tab switcher overlay */}
      <div className="absolute top-16 left-0 right-0 z-20 px-4">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "all" | "following")} className="w-full">
          <TabsList className="grid w-full max-w-xs mx-auto grid-cols-2 bg-black/40 backdrop-blur-sm">
            <TabsTrigger 
              value="all"
              className="text-white/70 data-[state=active]:text-white data-[state=active]:bg-white/20"
            >
              <Heart className="h-4 w-4 mr-1" />
              Pour toi
            </TabsTrigger>
            <TabsTrigger 
              value="following" 
              className="text-white/70 data-[state=active]:text-white data-[state=active]:bg-white/20"
            >
              <Users className="h-4 w-4 mr-1" />
              Abonnés
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Scrollable posts container */}
      <div 
        ref={containerRef}
        className="h-full w-full overflow-y-scroll tiktok-scroll scrollbar-hide"
      >
        {posts.map((post, index) => (
          <TikTokPostCard
            key={post.id}
            post={post}
            currentUserId={user?.id || null}
            toggleReaction={toggleReaction}
            refreshPosts={refreshPosts}
            isVisible={index === visiblePostIndex}
          />
        ))}
      </div>
    </div>
  );
}
