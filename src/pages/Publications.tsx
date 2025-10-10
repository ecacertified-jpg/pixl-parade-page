import { memo, useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { usePosts } from "@/hooks/usePosts";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Share2, Heart, Gift, PartyPopper, Play } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CommentsSection } from "@/components/CommentsSection";
import { ShareMenu } from "@/components/ShareMenu";
import { GiftPromiseModal } from "@/components/GiftPromiseModal";
import { PostActionsMenu } from "@/components/PostActionsMenu";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

const Publications = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { posts, loading, toggleReaction, refreshPosts } = usePosts();
  const [showComments, setShowComments] = useState<Record<string, boolean>>({});
  const [shareMenuOpen, setShareMenuOpen] = useState<string | null>(null);
  const [giftWarningShown, setGiftWarningShown] = useState<Record<string, boolean>>({});
  const [giftPopoverOpen, setGiftPopoverOpen] = useState<Record<string, boolean>>({});
  const [showGiftPromise, setShowGiftPromise] = useState<Record<string, boolean>>({});
  const [giftPromisePost, setGiftPromisePost] = useState<{ postId: string; authorName: string } | null>(null);

  // Filter to show only current user's posts
  const userPosts = posts.filter((post) => post.user_id === user?.id);

  // Réinitialiser l'avertissement après 10 secondes
  useEffect(() => {
    Object.keys(giftWarningShown).forEach(postId => {
      if (giftWarningShown[postId]) {
        const timer = setTimeout(() => {
          setGiftWarningShown(prev => ({ ...prev, [postId]: false }));
        }, 10000);
        return () => clearTimeout(timer);
      }
    });
  }, [giftWarningShown]);

  const handleGiftClick = (postId: string, authorName: string) => {
    // Vibration haptique si disponible
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }

    if (giftWarningShown[postId]) {
      // Deuxième clic : afficher la modal de confirmation
      setGiftPromisePost({ postId, authorName });
      setShowGiftPromise(prev => ({ ...prev, [postId]: true }));
      setGiftPopoverOpen(prev => ({ ...prev, [postId]: false }));
    } else {
      // Premier clic : afficher l'avertissement
      setGiftWarningShown(prev => ({ ...prev, [postId]: true }));
      setGiftPopoverOpen(prev => ({ ...prev, [postId]: true }));
      
      // Fermer automatiquement après 3 secondes
      setTimeout(() => {
        setGiftPopoverOpen(prev => ({ ...prev, [postId]: false }));
      }, 3000);
    }
  };

  const handleGiftPromiseConfirm = async () => {
    if (giftPromisePost) {
      await toggleReaction(giftPromisePost.postId, 'gift');
      toast.success('🎁 Promesse de cadeau enregistrée avec succès !');
      setGiftWarningShown(prev => ({ ...prev, [giftPromisePost.postId]: false }));
      setShowGiftPromise(prev => ({ ...prev, [giftPromisePost.postId]: false }));
      setGiftPromisePost(null);
    }
  };

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
            {userPosts.map((post) => {
              const authorName = post.profiles?.first_name
                ? `${post.profiles.first_name} ${post.profiles.last_name || ''}`
                : 'Utilisateur';
              const initials = authorName
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase();
              const timestamp = formatDistanceToNow(new Date(post.created_at), {
                addSuffix: true,
                locale: fr,
              });

              return (
                <Card key={post.id} className="bg-card/80 backdrop-blur-sm border border-border/50 shadow-card">
                  <div className="p-4">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-primary font-medium">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-medium text-foreground text-sm">{authorName}</h4>
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-muted-foreground">{timestamp}</p>
                            {post.occasion && (
                              <Badge variant="secondary" className="text-xs px-2 py-0.5">
                                {post.occasion}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <PostActionsMenu
                        postId={post.id}
                        authorId={post.user_id}
                        currentUserId={user?.id || null}
                        isPinned={post.is_pinned}
                        postContent={post.content}
                        postMediaUrl={post.media_url}
                        postMediaType={post.type}
                        postOccasion={post.occasion}
                        onRefresh={refreshPosts}
                      />
                    </div>

                    {/* Content */}
                    {post.content && (
                      <div className="mb-3">
                        <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap">
                          {post.content}
                        </p>
                      </div>
                    )}

                    {/* Media */}
                    {post.media_url && (
                      <div className="mb-3 rounded-xl overflow-hidden">
                        {post.type === 'image' && (
                          <img
                            src={post.media_url}
                            alt="Post content"
                            className="w-full h-auto object-cover"
                          />
                        )}
                        {post.type === 'video' && (
                          <div className="relative">
                            <video
                              src={post.media_url}
                              controls
                              className="w-full h-auto object-cover"
                            />
                          </div>
                        )}
                        {(post.type === 'audio' || post.type === 'ai_song') && (
                          <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-4 rounded-xl flex items-center gap-3">
                            <div className="bg-primary/20 p-2 rounded-full">
                              <Play className="h-4 w-4 text-primary fill-current" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-foreground">
                                {post.type === 'ai_song' ? 'Chant IA' : 'Message audio'}
                              </p>
                              <p className="text-xs text-muted-foreground">Appuyez pour écouter</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Reactions Summary */}
                    {post.reactions && (post.reactions.love > 0 || post.reactions.gift > 0 || post.reactions.like > 0) && (
                      <div className="flex items-center gap-4 mb-3 pb-3 border-b border-border/30">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          {post.reactions.love > 0 && (
                            <span className="flex items-center gap-1">
                              <Heart className="h-3 w-3 text-red-500 fill-current" />
                              {post.reactions.love}
                            </span>
                          )}
                          {post.reactions.gift > 0 && (
                            <span className="flex items-center gap-1">
                              <Gift className="h-3 w-3 text-primary fill-current" />
                              {post.reactions.gift}
                            </span>
                          )}
                          {post.reactions.like > 0 && (
                            <span className="flex items-center gap-1">
                              <PartyPopper className="h-3 w-3 text-blue-500 fill-current" />
                              {post.reactions.like}
                            </span>
                          )}
                        </div>
                        {post.comments_count! > 0 && (
                          <span className="text-xs text-muted-foreground ml-auto">
                            {post.comments_count} commentaire{post.comments_count! > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between gap-0.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleReaction(post.id, 'love')}
                        className={cn(
                          "flex-1 h-8 text-xs gap-1 px-1 hover:bg-red-50 hover:text-red-600 transition-colors",
                          post.user_reaction === 'love' && "bg-red-50 text-red-600"
                        )}
                      >
                        <Heart className={cn("h-3.5 w-3.5", post.user_reaction === 'love' && "fill-current")} />
                        <span className="hidden sm:inline">J'adore</span>
                      </Button>

                      <Popover open={giftPopoverOpen[post.id]} onOpenChange={(open) => setGiftPopoverOpen(prev => ({ ...prev, [post.id]: open }))}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleGiftClick(post.id, authorName)}
                            className={cn(
                              "flex-1 h-8 text-xs gap-1 px-1 hover:bg-primary/10 hover:text-primary transition-colors",
                              post.user_reaction === 'gift' && "bg-primary/10 text-primary"
                            )}
                          >
                            <Gift className={cn("h-3.5 w-3.5", post.user_reaction === 'gift' && "fill-current")} />
                            <span className="hidden sm:inline">Cadeau</span>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64" side="top">
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-foreground">⚠️ Attention</p>
                            <p className="text-xs text-muted-foreground">
                              Vous allez faire une promesse de contribuer à offrir un cadeau à cette personne à son anniversaire. 
                              Cliquez à nouveau pour confirmer.
                            </p>
                          </div>
                        </PopoverContent>
                      </Popover>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleReaction(post.id, 'like')}
                        className={cn(
                          "flex-1 h-8 text-xs gap-1 px-1 hover:bg-blue-50 hover:text-blue-600 transition-colors",
                          post.user_reaction === 'like' && "bg-blue-50 text-blue-600"
                        )}
                      >
                        <PartyPopper className={cn("h-3.5 w-3.5", post.user_reaction === 'like' && "fill-current")} />
                        <span className="hidden sm:inline">Bravo</span>
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowComments(prev => ({ ...prev, [post.id]: !prev[post.id] }))}
                        className="flex-1 h-8 text-xs gap-1 px-1 hover:bg-muted/50 transition-colors"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Commenter</span>
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShareMenuOpen(post.id)}
                        className="flex-1 h-8 text-xs gap-1 px-1 hover:bg-muted/50 transition-colors"
                      >
                        <Share2 className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Partager</span>
                      </Button>
                    </div>

                    {/* Comments Section */}
                    {showComments[post.id] && (
                      <CommentsSection 
                        postId={post.id} 
                        onCommentAdded={refreshPosts}
                      />
                    )}
                  </div>

                  {/* Share Menu */}
                  <ShareMenu
                    open={shareMenuOpen === post.id}
                    onOpenChange={(open) => setShareMenuOpen(open ? post.id : null)}
                    postId={post.id}
                    postContent={post.content || ''}
                    authorName={authorName}
                  />

                  {/* Gift Promise Modal */}
                  <GiftPromiseModal 
                    open={showGiftPromise[post.id] || false}
                    onOpenChange={(open) => {
                      setShowGiftPromise(prev => ({ ...prev, [post.id]: open }));
                      if (!open) setGiftPromisePost(null);
                    }}
                    onConfirm={handleGiftPromiseConfirm}
                    authorName={authorName}
                    occasion={post.occasion}
                  />
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default memo(Publications);
