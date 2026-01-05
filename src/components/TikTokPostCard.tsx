import { useState, useRef, useEffect, forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Share2, Plus, Play, Volume2, VolumeX, Gift, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, isValidImageUrl } from "@/lib/utils";
import { ShareMenu } from "@/components/ShareMenu";
import { CommentsDrawer } from "@/components/CommentsDrawer";
import { GiftPromiseModal } from "@/components/GiftPromiseModal";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";
import type { PostData } from "@/hooks/usePosts";

interface TikTokPostCardProps {
  post: PostData;
  currentUserId: string | null;
  toggleReaction: (postId: string, reactionType: 'love' | 'gift' | 'like') => Promise<void>;
  refreshPosts: () => void;
  isVisible?: boolean;
  parallaxOffset?: number; // -1 (above) to 1 (below), 0 = centered
}

export const TikTokPostCard = forwardRef<HTMLDivElement, TikTokPostCardProps>(
  function TikTokPostCard({ post, currentUserId, toggleReaction, refreshPosts, isVisible = false, parallaxOffset = 0 }, ref) {
  const navigate = useNavigate();
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showHeart, setShowHeart] = useState(false);
  const [showGift, setShowGift] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [giftPopoverOpen, setGiftPopoverOpen] = useState(false);
  const [giftModalOpen, setGiftModalOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastTapRef = useRef<number>(0);

  // Profile info
  const isProfileVisible = post.profiles?.is_visible !== false;

  // Swipe gesture hook
  const { handlers: swipeHandlers, isSwiping, swipeOffset } = useSwipeGesture({
    onSwipeLeft: () => {
      if (isProfileVisible) {
        navigate(`/profile/${post.user_id}`);
      }
    },
    onSwipeRight: () => {
      setShareMenuOpen(true);
    },
    threshold: 80,
  });

  const authorName = isProfileVisible && post.profiles?.first_name
    ? `${post.profiles.first_name} ${post.profiles.last_name || ''}`
    : 'Utilisateur';
  const initials = isProfileVisible && post.profiles?.first_name
    ? authorName.split(' ').map((n) => n[0]).join('').toUpperCase()
    : 'U';
  const avatarUrl = isProfileVisible ? post.profiles?.avatar_url : undefined;

  // Format numbers (2400 -> 2,4K)
  const formatCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1).replace('.', ',')}K`;
    }
    return count.toString();
  };

  // Handle video autoplay when visible using IntersectionObserver
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isVisible) {
      // Reset to beginning and play
      video.currentTime = 0;
      const playPromise = video.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch((error) => {
            // Autoplay blocked by browser - user needs to interact
            console.log('Autoplay prevented:', error.message);
            setIsPlaying(false);
          });
      }
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, [isVisible]);

  // Double tap to like
  const handleDoubleTap = async () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Double tap detected
      setShowHeart(true);
      if (post.user_reaction !== 'love') {
        await toggleReaction(post.id, 'love');
      }
      setTimeout(() => setShowHeart(false), 1000);
    }
    lastTapRef.current = now;
  };

  const handleVideoTap = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
    handleDoubleTap();
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // Handle gift click
  const handleGiftClick = () => {
    if (post.user_reaction === 'gift') {
      // Already promised - toggle off
      toggleReaction(post.id, 'gift');
    } else {
      // Show warning popover first
      setGiftPopoverOpen(true);
    }
  };

  const handleGiftConfirm = () => {
    // Déclencher l'animation
    setShowGift(true);
    setTimeout(() => setShowGift(false), 1500);
    
    toggleReaction(post.id, 'gift');
    setGiftModalOpen(false);
  };

  // Background for posts without media
  const gradientBg = "bg-gradient-to-br from-primary via-accent to-secondary";

  // Parallax offsets for different layers (creates depth effect)
  const mediaParallax = parallaxOffset * 25; // Media moves slower (background)
  const buttonsParallax = parallaxOffset * -12; // Buttons arrive faster
  const textParallax = parallaxOffset * -8; // Text slightly faster than media

  return (
    <div 
      ref={ref}
      data-post-id={post.id}
      {...swipeHandlers}
      className={cn(
        "relative h-[100dvh] w-full snap-start snap-always bg-black flex-shrink-0",
        "transition-all duration-500 ease-out",
        isVisible 
          ? "opacity-100 scale-100" 
          : "opacity-40 scale-95"
      )}
      style={{
        transform: isSwiping ? `translateX(${swipeOffset}px)` : undefined,
        transition: isSwiping ? 'none' : 'transform 0.3s ease-out',
      }}
    >
      {/* Swipe left indicator - Profile */}
      {isSwiping && swipeOffset < -30 && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 z-30 
                        flex items-center gap-2 text-white bg-primary/80 
                        px-4 py-2 rounded-full animate-fade-in">
          <User className="h-5 w-5" />
          <span className="text-sm font-medium">Voir profil</span>
        </div>
      )}

      {/* Swipe right indicator - Share */}
      {isSwiping && swipeOffset > 30 && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 z-30 
                        flex items-center gap-2 text-white bg-accent/80 
                        px-4 py-2 rounded-full animate-fade-in">
          <Share2 className="h-5 w-5" />
          <span className="text-sm font-medium">Partager</span>
        </div>
      )}
      {/* Media background with parallax */}
      <div 
        className="absolute inset-0 will-change-transform" 
        onClick={handleDoubleTap}
        style={{ 
          transform: `translateY(${mediaParallax}px) scale(1.05)`,
          transition: 'transform 0.1s ease-out',
        }}
      >
        {post.type === 'video' && isValidImageUrl(post.media_url) ? (
          <>
            <video
              ref={videoRef}
              src={post.media_url}
              className="w-full h-full object-cover"
              loop
              muted={isMuted}
              playsInline
              onClick={handleVideoTap}
            />
            {/* Video controls */}
            <button 
              onClick={toggleMute}
              className="absolute top-20 right-4 bg-black/40 p-2 rounded-full"
            >
              {isMuted ? (
                <VolumeX className="h-5 w-5 text-white" />
              ) : (
                <Volume2 className="h-5 w-5 text-white" />
              )}
            </button>
            {!isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-black/40 p-4 rounded-full">
                  <Play className="h-12 w-12 text-white fill-white" />
                </div>
              </div>
            )}
          </>
        ) : post.type === 'image' && isValidImageUrl(post.media_url) ? (
          <img 
            src={post.media_url} 
            alt="Post content" 
            className="w-full h-full object-cover"
          />
        ) : (
          // Text post with gradient background
          <div className={cn("w-full h-full flex items-center justify-center p-8", gradientBg)}>
            <p className="text-white text-2xl font-semibold text-center leading-relaxed">
              {post.content}
            </p>
          </div>
        )}
      </div>

      {/* Gradient overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />

      {/* Double tap heart animation */}
      {showHeart && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <Heart className="h-32 w-32 text-white fill-white animate-scale-in opacity-90" />
        </div>
      )}

      {/* Gift promise animation */}
      {showGift && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          {/* Cercles d'ondes qui s'expandent */}
          <div className="absolute w-40 h-40 rounded-full bg-gift/30 animate-ping" />
          <div className="absolute w-32 h-32 rounded-full bg-gift/40 animate-ping" style={{ animationDelay: '100ms' }} />
          
          {/* Particules qui s'envolent */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(8)].map((_, i) => (
              <div 
                key={i}
                className="absolute left-1/2 top-1/2 w-3 h-3 bg-gift rounded-full animate-gift-particle"
                style={{
                  '--particle-angle': `${i * 45}deg`,
                  animationDelay: `${i * 50}ms`,
                } as React.CSSProperties}
              />
            ))}
          </div>
          
          {/* Cadeau principal géant */}
          <div className="animate-gift-pop">
            <Gift className="h-36 w-36 text-white fill-gift drop-shadow-2xl" />
          </div>
        </div>
      )}

      {/* Right side action buttons with parallax */}
      <div 
        className={cn(
          "absolute right-3 bottom-32 flex flex-col items-center gap-5 z-10 will-change-transform",
          "transition-opacity duration-500 delay-100",
          isVisible 
            ? "opacity-100" 
            : "opacity-0"
        )}
        style={{ 
          transform: `translateY(${buttonsParallax}px) translateX(${isVisible ? 0 : 16}px)`,
          transition: 'transform 0.1s ease-out, opacity 0.5s ease',
        }}
      >
        {/* Avatar with follow button */}
        <div 
          className="relative cursor-pointer"
          onClick={() => isProfileVisible && navigate(`/profile/${post.user_id}`)}
        >
          <Avatar className="w-12 h-12 border-2 border-white shadow-lg">
            {avatarUrl && (
              <AvatarImage src={avatarUrl} alt={authorName} className="object-cover" />
            )}
            <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          {currentUserId !== post.user_id && (
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-5 h-5 bg-heart rounded-full flex items-center justify-center shadow-md">
              <Plus className="h-3 w-3 text-white" />
            </div>
          )}
        </div>

        {/* Heart/Like */}
        <button 
          className="flex flex-col items-center"
          onClick={() => toggleReaction(post.id, 'love')}
        >
          <div className={cn(
            "p-2 rounded-full transition-colors",
            post.user_reaction === 'love' && "bg-heart/20"
          )}>
            <Heart className={cn(
              "h-8 w-8 text-white transition-all",
              post.user_reaction === 'love' && "fill-heart text-heart scale-110"
            )} />
          </div>
          <span className="text-white text-xs font-medium mt-1">
            {formatCount(post.reactions?.love || 0)}
          </span>
        </button>

        {/* Gift Promise */}
        <Popover open={giftPopoverOpen} onOpenChange={setGiftPopoverOpen}>
          <PopoverTrigger asChild>
            <button 
              className="flex flex-col items-center"
              onClick={handleGiftClick}
            >
              <div className={cn(
                "p-2 rounded-full transition-colors",
                post.user_reaction === 'gift' && "bg-gift/20"
              )}>
                <Gift className={cn(
                  "h-8 w-8 text-white transition-all",
                  post.user_reaction === 'gift' && "fill-gift text-gift scale-110"
                )} />
              </div>
              <span className="text-white text-xs font-medium mt-1">
                {formatCount(post.reactions?.gift || 0)}
              </span>
            </button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-72 p-4 bg-background/95 backdrop-blur-sm border-border"
            side="left"
            align="center"
          >
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-gift">
                <Gift className="h-5 w-5" />
                <p className="font-semibold">Promesse de cadeau</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Ceci est un engagement à contribuer pour offrir un cadeau à {authorName}. 
                Êtes-vous sûr de vouloir continuer ?
              </p>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => setGiftPopoverOpen(false)}
                >
                  Annuler
                </Button>
                <Button 
                  size="sm" 
                  className="flex-1 bg-gift hover:bg-gift/90"
                  onClick={() => {
                    setGiftPopoverOpen(false);
                    setGiftModalOpen(true);
                  }}
                >
                  Continuer
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Comments */}
        <button 
          className="flex flex-col items-center"
          onClick={() => setCommentsOpen(true)}
        >
          <div className="p-2">
            <MessageCircle className="h-8 w-8 text-white" />
          </div>
          <span className="text-white text-xs font-medium mt-1">
            {formatCount(post.comments_count || 0)}
          </span>
        </button>

        {/* Share */}
        <button 
          className="flex flex-col items-center"
          onClick={() => setShareMenuOpen(true)}
        >
          <div className="p-2">
            <Share2 className="h-8 w-8 text-white" />
          </div>
          <span className="text-white text-xs font-medium mt-1">
            {formatCount((post.reactions?.gift || 0) + (post.reactions?.like || 0))}
          </span>
        </button>
      </div>

      {/* Bottom info section with parallax */}
      <div 
        className={cn(
          "absolute bottom-6 left-4 right-20 z-10 will-change-transform",
          "transition-opacity duration-500 delay-150",
          isVisible 
            ? "opacity-100" 
            : "opacity-0"
        )}
        style={{ 
          transform: `translateY(${textParallax + (isVisible ? 0 : 16)}px)`,
          transition: 'transform 0.1s ease-out, opacity 0.5s ease',
        }}
      >
        <h4 
          className={cn(
            "text-white font-semibold text-base mb-1",
            isProfileVisible && "cursor-pointer"
          )}
          onClick={() => isProfileVisible && navigate(`/profile/${post.user_id}`)}
        >
          @{authorName.replace(' ', '_').toLowerCase()}
        </h4>
        
        {post.occasion && (
          <span className="inline-block bg-white/20 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded-full mb-2">
            {post.occasion}
          </span>
        )}
        
        {post.content && post.type !== 'text' && (
          <div>
            <p className={cn(
              "text-white/90 text-sm",
              !expanded && "line-clamp-2"
            )}>
              {post.content}
            </p>
            {post.content.length > 100 && (
              <button 
                className="text-white/60 text-xs mt-1"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? 'Voir moins' : '...Voir plus'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Share Menu */}
      <ShareMenu
        open={shareMenuOpen}
        onOpenChange={setShareMenuOpen}
        postId={post.id}
        postContent={post.content || ''}
        authorName={authorName}
      />

      {/* Comments Drawer */}
      <CommentsDrawer
        open={commentsOpen}
        onOpenChange={setCommentsOpen}
        postId={post.id}
        onCommentAdded={refreshPosts}
      />

      {/* Gift Promise Modal */}
      <GiftPromiseModal
        open={giftModalOpen}
        onOpenChange={setGiftModalOpen}
        onConfirm={handleGiftConfirm}
        authorName={authorName}
        occasion={post.occasion || 'anniversaire'}
      />
    </div>
  );
});
