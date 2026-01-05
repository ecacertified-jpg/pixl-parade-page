import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { usePosts } from '@/hooks/usePosts';
import { useAuth } from '@/contexts/AuthContext';
import { TikTokPostCard } from '@/components/TikTokPostCard';
import { TikTokProgressIndicator } from '@/components/TikTokProgressIndicator';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Heart, Volume2, VolumeX } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';

export function TikTokFeed() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"all" | "following">("all");
  const [followingLoaded, setFollowingLoaded] = useState(false);
  
  // État global du son avec persistance localStorage
  const [globalMuted, setGlobalMuted] = useState(() => {
    const saved = localStorage.getItem('tiktok-feed-muted');
    return saved !== null ? JSON.parse(saved) : true; // Muet par défaut
  });

  // Toggle global mute
  const toggleGlobalMute = useCallback(() => {
    setGlobalMuted((prev: boolean) => {
      const newValue = !prev;
      localStorage.setItem('tiktok-feed-muted', JSON.stringify(newValue));
      return newValue;
    });
  }, []);
  
  // États séparés pour chaque onglet
  const [allVisiblePostId, setAllVisiblePostId] = useState<string | null>(null);
  const [followingVisiblePostId, setFollowingVisiblePostId] = useState<string | null>(null);
  const [allParallaxOffsets, setAllParallaxOffsets] = useState<Map<string, number>>(new Map());
  const [followingParallaxOffsets, setFollowingParallaxOffsets] = useState<Map<string, number>>(new Map());
  
  // Refs séparés pour chaque onglet
  const allContainerRef = useRef<HTMLDivElement>(null);
  const followingContainerRef = useRef<HTMLDivElement>(null);
  const allPostRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const followingPostRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Swipe horizontal pour navigation entre onglets
  const { handlers: tabSwipeHandlers, isSwiping: isTabSwiping, swipeOffset: tabSwipeOffset } = useSwipeGesture({
    onSwipeLeft: () => {
      if (activeTab === "all") {
        setActiveTab("following");
      }
    },
    onSwipeRight: () => {
      if (activeTab === "following") {
        setActiveTab("all");
      }
    },
    threshold: 60,
    maxOffset: 150,
  });
  
  const { posts: allPosts, loading: allLoading, toggleReaction: toggleAllReaction, refreshPosts: refreshAllPosts } = usePosts(false);
  const { posts: followingPosts, loading: followingLoading, toggleReaction: toggleFollowingReaction, refreshPosts: refreshFollowingPosts } = usePosts(activeTab === "following" || followingLoaded);

  // Préchargement automatique de l'onglet "Abonnés" après un délai
  useEffect(() => {
    const preloadTimer = setTimeout(() => {
      if (!followingLoaded) {
        setFollowingLoaded(true);
      }
    }, 2000);
    
    return () => clearTimeout(preloadTimer);
  }, []);

  // Préchargement anticipé pendant le swipe (avant complétion)
  useEffect(() => {
    if (activeTab === "all" && tabSwipeOffset < -20 && !followingLoaded) {
      setFollowingLoaded(true);
    }
  }, [tabSwipeOffset, activeTab, followingLoaded]);

  // Charger immédiatement si on change d'onglet manuellement
  useEffect(() => {
    if (activeTab === "following" && !followingLoaded) {
      setFollowingLoaded(true);
    }
  }, [activeTab, followingLoaded]);

  // Valeurs actives selon l'onglet
  const visiblePostId = activeTab === "all" ? allVisiblePostId : followingVisiblePostId;
  const posts = activeTab === "all" ? allPosts : followingPosts;
  const loading = allLoading;

  // Calculer l'index actuel pour l'indicateur de progression
  const currentIndex = posts.findIndex(p => p.id === visiblePostId);

  // Calculer les posts vidéo à précharger (±2 autour du visible)
  const preloadPostIds = useMemo(() => {
    if (currentIndex === -1) return [];
    
    const connection = (navigator as unknown as { connection?: { effectiveType?: string; saveData?: boolean } }).connection;
    if (connection?.effectiveType === '2g' || connection?.saveData) {
      return [];
    }
    
    const ids: string[] = [];
    if (currentIndex > 0 && posts[currentIndex - 1]?.type === 'video') {
      ids.push(posts[currentIndex - 1].id);
    }
    for (let i = 1; i <= 2; i++) {
      if (currentIndex + i < posts.length && posts[currentIndex + i]?.type === 'video') {
        ids.push(posts[currentIndex + i].id);
      }
    }
    return ids;
  }, [posts, currentIndex]);

  // Fonction pour scroller vers un post spécifique
  const scrollToPost = useCallback((index: number) => {
    const postRefs = activeTab === "all" ? allPostRefs : followingPostRefs;
    const currentPosts = activeTab === "all" ? allPosts : followingPosts;
    const postId = currentPosts[index]?.id;
    if (postId) {
      const element = postRefs.current.get(postId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [activeTab, allPosts, followingPosts]);

  // Ref callbacks pour chaque onglet
  const setAllPostRef = useCallback((postId: string, element: HTMLDivElement | null) => {
    if (element) {
      allPostRefs.current.set(postId, element);
    } else {
      allPostRefs.current.delete(postId);
    }
  }, []);

  const setFollowingPostRef = useCallback((postId: string, element: HTMLDivElement | null) => {
    if (element) {
      followingPostRefs.current.set(postId, element);
    } else {
      followingPostRefs.current.delete(postId);
    }
  }, []);

  // Scroll listener for parallax effect - Pour toi
  useEffect(() => {
    const container = allContainerRef.current;
    if (!container || allPosts.length === 0) return;

    const handleScroll = () => {
      const containerRect = container.getBoundingClientRect();
      const containerCenter = containerRect.height / 2;
      const newOffsets = new Map<string, number>();

      allPostRefs.current.forEach((element, postId) => {
        const elementRect = element.getBoundingClientRect();
        const elementCenter = elementRect.top - containerRect.top + elementRect.height / 2;
        const normalizedOffset = (elementCenter - containerCenter) / containerRect.height;
        newOffsets.set(postId, Math.max(-1, Math.min(1, normalizedOffset)));
      });

      setAllParallaxOffsets(newOffsets);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => container.removeEventListener('scroll', handleScroll);
  }, [allPosts]);

  // Scroll listener for parallax effect - Abonnés
  useEffect(() => {
    const container = followingContainerRef.current;
    if (!container || followingPosts.length === 0) return;

    const handleScroll = () => {
      const containerRect = container.getBoundingClientRect();
      const containerCenter = containerRect.height / 2;
      const newOffsets = new Map<string, number>();

      followingPostRefs.current.forEach((element, postId) => {
        const elementRect = element.getBoundingClientRect();
        const elementCenter = elementRect.top - containerRect.top + elementRect.height / 2;
        const normalizedOffset = (elementCenter - containerCenter) / containerRect.height;
        newOffsets.set(postId, Math.max(-1, Math.min(1, normalizedOffset)));
      });

      setFollowingParallaxOffsets(newOffsets);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => container.removeEventListener('scroll', handleScroll);
  }, [followingPosts]);

  // IntersectionObserver - Pour toi
  useEffect(() => {
    const container = allContainerRef.current;
    if (!container || allPosts.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            const postId = entry.target.getAttribute('data-post-id');
            if (postId && postId !== allVisiblePostId) {
              setAllVisiblePostId(postId);
            }
          }
        });
      },
      { root: container, rootMargin: '0px', threshold: 0.5 }
    );

    allPostRefs.current.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [allPosts, allVisiblePostId]);

  // IntersectionObserver - Abonnés
  useEffect(() => {
    const container = followingContainerRef.current;
    if (!container || followingPosts.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            const postId = entry.target.getAttribute('data-post-id');
            if (postId && postId !== followingVisiblePostId) {
              setFollowingVisiblePostId(postId);
            }
          }
        });
      },
      { root: container, rootMargin: '0px', threshold: 0.5 }
    );

    followingPostRefs.current.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [followingPosts, followingVisiblePostId]);

  // Set first post as visible initially - Pour toi
  useEffect(() => {
    if (allPosts.length > 0 && !allVisiblePostId) {
      setAllVisiblePostId(allPosts[0].id);
    }
  }, [allPosts, allVisiblePostId]);

  // Set first post as visible initially - Abonnés
  useEffect(() => {
    if (followingPosts.length > 0 && !followingVisiblePostId) {
      setFollowingVisiblePostId(followingPosts[0].id);
    }
  }, [followingPosts, followingVisiblePostId]);

  // Calculer le translateX du conteneur de pages
  const getSlideTransform = () => {
    const baseOffset = activeTab === "all" ? 0 : -100;
    
    if (isTabSwiping) {
      const swipePercent = (tabSwipeOffset / window.innerWidth) * 100;
      return baseOffset + swipePercent;
    }
    
    return baseOffset;
  };

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

  return (
    <div 
      className="relative h-[100dvh] w-full bg-black overflow-hidden"
      {...tabSwipeHandlers}
    >
      {/* Tab switcher overlay */}
      <div className="absolute top-16 left-0 right-0 z-20 px-4">
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
      </div>

      {/* Progress indicator */}
      <TikTokProgressIndicator
        totalPosts={posts.length}
        currentIndex={currentIndex >= 0 ? currentIndex : 0}
        onDotClick={scrollToPost}
      />

      {/* Bouton mute/unmute global */}
      <button
        onClick={toggleGlobalMute}
        className="absolute top-20 right-4 z-30 bg-black/50 backdrop-blur-sm p-3 rounded-full 
                   transition-all duration-200 hover:bg-black/70 active:scale-95"
        aria-label={globalMuted ? "Activer le son" : "Couper le son"}
      >
        {globalMuted ? (
          <VolumeX className="h-5 w-5 text-white" />
        ) : (
          <Volume2 className="h-5 w-5 text-white" />
        )}
      </button>

      {/* Edge glow indicators */}
      {activeTab === "all" && (
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white/5 to-transparent pointer-events-none z-10" />
      )}
      {activeTab === "following" && (
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white/5 to-transparent pointer-events-none z-10" />
      )}

      {/* Container de pages horizontales */}
      <div 
        className="flex h-full"
        style={{
          width: '200vw',
          transform: `translateX(${getSlideTransform()}vw)`,
          transition: isTabSwiping ? 'none' : 'transform 300ms ease-out',
        }}
      >
        {/* Page 1: Pour toi */}
        <div className="w-screen h-full flex-shrink-0 overflow-hidden">
          {allPosts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-white p-8">
              <Heart className="h-16 w-16 mb-4 text-primary" />
              <p className="text-lg font-medium mb-2">Aucune publication</p>
              <p className="text-sm text-white/60 text-center">
                Soyez le premier à partager un moment de joie ! 🎉
              </p>
            </div>
          ) : (
            <div 
              ref={allContainerRef}
              className="h-full w-full overflow-y-scroll tiktok-scroll scrollbar-hide"
            >
              {allPosts.map((post) => (
                <TikTokPostCard
                  key={post.id}
                  ref={(el) => setAllPostRef(post.id, el)}
                  post={post}
                  currentUserId={user?.id || null}
                  toggleReaction={toggleAllReaction}
                  refreshPosts={refreshAllPosts}
                  isVisible={post.id === allVisiblePostId && activeTab === "all"}
                  parallaxOffset={allParallaxOffsets.get(post.id) || 0}
                  shouldPreload={activeTab === "all" && preloadPostIds.includes(post.id)}
                  globalMuted={globalMuted}
                />
              ))}
            </div>
          )}
        </div>

        {/* Page 2: Abonnés */}
        <div className="w-screen h-full flex-shrink-0 overflow-hidden">
          {followingLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="space-y-4 p-8">
                <Skeleton className="w-48 h-48 rounded-full mx-auto bg-white/10" />
                <Skeleton className="w-32 h-4 mx-auto bg-white/10" />
              </div>
            </div>
          ) : followingPosts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-white p-8">
              <Users className="h-16 w-16 mb-4 text-primary" />
              <p className="text-lg font-medium mb-2">Aucune publication</p>
              <p className="text-sm text-white/60 text-center">
                Suivez des utilisateurs pour voir leurs publications ici
              </p>
            </div>
          ) : (
            <div 
              ref={followingContainerRef}
              className="h-full w-full overflow-y-scroll tiktok-scroll scrollbar-hide"
            >
              {followingPosts.map((post) => (
                <TikTokPostCard
                  key={post.id}
                  ref={(el) => setFollowingPostRef(post.id, el)}
                  post={post}
                  currentUserId={user?.id || null}
                  toggleReaction={toggleFollowingReaction}
                  refreshPosts={refreshFollowingPosts}
                  isVisible={post.id === followingVisiblePostId && activeTab === "following"}
                  parallaxOffset={followingParallaxOffsets.get(post.id) || 0}
                  shouldPreload={activeTab === "following" && preloadPostIds.includes(post.id)}
                  globalMuted={globalMuted}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
