import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { usePosts } from '@/hooks/usePosts';
import { useAuth } from '@/contexts/AuthContext';
import { TikTokPostCard } from '@/components/TikTokPostCard';
import { TikTokProgressIndicator } from '@/components/TikTokProgressIndicator';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Heart, ChevronLeft, ChevronRight } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';

export function TikTokFeed() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"all" | "following">("all");
  const [followingLoaded, setFollowingLoaded] = useState(false);
  const [visiblePostId, setVisiblePostId] = useState<string | null>(null);
  const [parallaxOffsets, setParallaxOffsets] = useState<Map<string, number>>(new Map());
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const postRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Swipe horizontal pour navigation entre onglets
  const { handlers: tabSwipeHandlers, isSwiping: isTabSwiping, swipeOffset: tabSwipeOffset } = useSwipeGesture({
    onSwipeLeft: () => {
      if (activeTab === "all") {
        setSlideDirection('left');
        setActiveTab("following");
        setTimeout(() => setSlideDirection(null), 300);
      }
    },
    onSwipeRight: () => {
      if (activeTab === "following") {
        setSlideDirection('right');
        setActiveTab("all");
        setTimeout(() => setSlideDirection(null), 300);
      }
    },
    threshold: 60,
    maxOffset: 150,
  });
  
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

  // Calculer les posts vidéo à précharger (±2 autour du visible)
  const preloadPostIds = useMemo(() => {
    if (currentIndex === -1) return [];
    
    // Vérifier le type de connexion pour éviter le préchargement sur connexion lente
    const connection = (navigator as unknown as { connection?: { effectiveType?: string; saveData?: boolean } }).connection;
    if (connection?.effectiveType === '2g' || connection?.saveData) {
      return []; // Pas de préchargement sur 2G ou mode économie de données
    }
    
    const ids: string[] = [];
    // Précharger le post précédent (si vidéo)
    if (currentIndex > 0 && posts[currentIndex - 1]?.type === 'video') {
      ids.push(posts[currentIndex - 1].id);
    }
    // Précharger les 2 posts suivants (si vidéo)
    for (let i = 1; i <= 2; i++) {
      if (currentIndex + i < posts.length && posts[currentIndex + i]?.type === 'video') {
        ids.push(posts[currentIndex + i].id);
      }
    }
    return ids;
  }, [posts, currentIndex]);

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

  // Scroll listener for parallax effect
  useEffect(() => {
    const container = containerRef.current;
    if (!container || posts.length === 0) return;

    const handleScroll = () => {
      const containerRect = container.getBoundingClientRect();
      const containerCenter = containerRect.height / 2;
      const newOffsets = new Map<string, number>();

      postRefs.current.forEach((element, postId) => {
        const elementRect = element.getBoundingClientRect();
        const elementCenter = elementRect.top - containerRect.top + elementRect.height / 2;
        
        // Normalized offset from -1 (above) to 1 (below), 0 = centered
        const normalizedOffset = (elementCenter - containerCenter) / containerRect.height;
        newOffsets.set(postId, Math.max(-1, Math.min(1, normalizedOffset)));
      });

      setParallaxOffsets(newOffsets);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial calculation

    return () => container.removeEventListener('scroll', handleScroll);
  }, [posts]);

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
      {/* Tab switcher overlay with swipe support */}
      <div 
        className="absolute top-16 left-0 right-0 z-20 px-4"
        {...tabSwipeHandlers}
      >
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "all" | "following")} className="w-full">
          <TabsList 
            className="grid w-full max-w-xs mx-auto grid-cols-2 bg-black/40 backdrop-blur-sm transition-transform duration-200"
            style={{
              transform: isTabSwiping ? `translateX(${tabSwipeOffset * 0.3}px)` : undefined,
            }}
          >
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

        {/* Swipe direction indicators */}
        {isTabSwiping && tabSwipeOffset < -30 && activeTab === "all" && (
          <div className="absolute right-8 top-1/2 -translate-y-1/2 text-white/60 text-xs flex items-center gap-1 animate-fade-in">
            <span>Abonnés</span>
            <ChevronRight className="h-4 w-4" />
          </div>
        )}
        {isTabSwiping && tabSwipeOffset > 30 && activeTab === "following" && (
          <div className="absolute left-8 top-1/2 -translate-y-1/2 text-white/60 text-xs flex items-center gap-1 animate-fade-in">
            <ChevronLeft className="h-4 w-4" />
            <span>Pour toi</span>
          </div>
        )}
      </div>

      {/* Progress indicator */}
      <TikTokProgressIndicator
        totalPosts={posts.length}
        currentIndex={currentIndex >= 0 ? currentIndex : 0}
        onDotClick={scrollToPost}
      />

      {/* Scrollable posts container with slide animation */}
      <div 
        ref={containerRef}
        className={`h-full w-full overflow-y-scroll tiktok-scroll scrollbar-hide transition-transform duration-300 ease-out ${
          slideDirection === 'left' ? 'animate-slide-out-left' : 
          slideDirection === 'right' ? 'animate-slide-out-right' : ''
        }`}
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
            parallaxOffset={parallaxOffsets.get(post.id) || 0}
            shouldPreload={preloadPostIds.includes(post.id)}
          />
        ))}
      </div>
    </div>
  );
}
