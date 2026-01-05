import { useState, useRef, useEffect, useCallback } from 'react';
import { usePosts } from '@/hooks/usePosts';
import { useAuth } from '@/contexts/AuthContext';
import { TikTokPostCard } from '@/components/TikTokPostCard';
import { TikTokProgressIndicator } from '@/components/TikTokProgressIndicator';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Heart } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function TikTokFeed() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"all" | "following">("all");
  const [followingLoaded, setFollowingLoaded] = useState(false);
  const [visiblePostId, setVisiblePostId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const postRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  
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

  // Calculer l'index actuel pour l'indicateur de progression
  const currentIndex = posts.findIndex(p => p.id === visiblePostId);

  // Fonction pour scroller vers un post spécifique
  const scrollToPost = useCallback((index: number) => {
    const postId = posts[index]?.id;
    if (postId) {
      const element = postRefs.current.get(postId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [posts]);

  // Ref callback to register/unregister post elements
  const setPostRef = useCallback((postId: string, element: HTMLDivElement | null) => {
    if (element) {
      postRefs.current.set(postId, element);
    } else {
      postRefs.current.delete(postId);
    }
  }, []);

  // IntersectionObserver to detect which post is visible
  useEffect(() => {
    const container = containerRef.current;
    if (!container || posts.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            const postId = entry.target.getAttribute('data-post-id');
            if (postId && postId !== visiblePostId) {
              setVisiblePostId(postId);
            }
          }
        });
      },
      {
        root: container,
        rootMargin: '0px',
        threshold: 0.5, // 50% visible = active
      }
    );

    // Observe all post elements
    postRefs.current.forEach((element) => {
      observer.observe(element);
    });

    return () => observer.disconnect();
  }, [posts, visiblePostId]);

  // Set first post as visible initially
  useEffect(() => {
    if (posts.length > 0 && !visiblePostId) {
      setVisiblePostId(posts[0].id);
    }
  }, [posts, visiblePostId]);

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

      {/* Progress indicator */}
      <TikTokProgressIndicator
        totalPosts={posts.length}
        currentIndex={currentIndex >= 0 ? currentIndex : 0}
        onDotClick={scrollToPost}
      />

      {/* Scrollable posts container */}
      <div 
        ref={containerRef}
        className="h-full w-full overflow-y-scroll tiktok-scroll scrollbar-hide"
      >
        {posts.map((post) => (
          <TikTokPostCard
            key={post.id}
            ref={(el) => setPostRef(post.id, el)}
            post={post}
            currentUserId={user?.id || null}
            toggleReaction={toggleReaction}
            refreshPosts={refreshPosts}
            isVisible={post.id === visiblePostId}
          />
        ))}
      </div>
    </div>
  );
}
