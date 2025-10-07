import { MessageCircle, Share2, Heart, Gift, PartyPopper, MoreHorizontal, Play } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useState } from "react";
import { cn } from "@/lib/utils";

export interface Post {
  id: string;
  author: {
    name: string;
    avatar?: string;
    initials: string;
  };
  content: string;
  timestamp: string;
  type: 'text' | 'image' | 'video' | 'audio';
  media?: {
    url: string;
    thumbnail?: string;
  };
  occasion?: string;
  reactions: {
    love: number;
    gift: number;
    like: number;
  };
  comments: number;
  userReaction?: 'love' | 'gift' | 'like' | null;
}

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  const [userReaction, setUserReaction] = useState<'love' | 'gift' | 'like' | null>(post.userReaction || null);
  const [showComments, setShowComments] = useState(false);

  const handleReaction = (reaction: 'love' | 'gift' | 'like') => {
    setUserReaction(prev => prev === reaction ? null : reaction);
  };

  const getReactionCount = (reaction: 'love' | 'gift' | 'like') => {
    const baseCount = post.reactions[reaction];
    const hadReaction = post.userReaction === reaction;
    const hasReaction = userReaction === reaction;
    
    if (hadReaction && !hasReaction) return baseCount - 1;
    if (!hadReaction && hasReaction) return baseCount + 1;
    return baseCount;
  };

  return (
    <Card className="bg-card/80 backdrop-blur-sm border border-border/50 shadow-card">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={post.author.avatar} alt={post.author.name} />
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-primary font-medium">
                {post.author.initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h4 className="font-medium text-foreground text-sm">{post.author.name}</h4>
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground">{post.timestamp}</p>
                {post.occasion && (
                  <Badge variant="secondary" className="text-xs px-2 py-0.5">
                    {post.occasion}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="mb-3">
          <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap">
            {post.content}
          </p>
        </div>

        {/* Media */}
        {post.media && (
          <div className="mb-3 rounded-xl overflow-hidden">
            {post.type === 'image' && (
              <img 
                src={post.media.url} 
                alt="Post content" 
                className="w-full h-auto object-cover"
              />
            )}
            {post.type === 'video' && (
              <div className="relative">
                <img 
                  src={post.media.thumbnail || post.media.url} 
                  alt="Video thumbnail" 
                  className="w-full h-48 object-cover"
                />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                  <div className="bg-white/90 rounded-full p-3">
                    <Play className="h-6 w-6 text-black fill-current ml-1" />
                  </div>
                </div>
              </div>
            )}
            {post.type === 'audio' && (
              <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-4 rounded-xl flex items-center gap-3">
                <div className="bg-primary/20 p-2 rounded-full">
                  <Play className="h-4 w-4 text-primary fill-current" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Message audio</p>
                  <p className="text-xs text-muted-foreground">Appuyez pour écouter</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Reactions Summary */}
        {(post.reactions.love > 0 || post.reactions.gift > 0 || post.reactions.like > 0) && (
          <div className="flex items-center gap-4 mb-3 pb-3 border-b border-border/30">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {getReactionCount('love') > 0 && (
                <span className="flex items-center gap-1">
                  <Heart className="h-3 w-3 text-red-500 fill-current" />
                  {getReactionCount('love')}
                </span>
              )}
              {getReactionCount('gift') > 0 && (
                <span className="flex items-center gap-1">
                  <Gift className="h-3 w-3 text-primary fill-current" />
                  {getReactionCount('gift')}
                </span>
              )}
              {getReactionCount('like') > 0 && (
                <span className="flex items-center gap-1">
                  <PartyPopper className="h-3 w-3 text-blue-500 fill-current" />
                  {getReactionCount('like')}
                </span>
              )}
            </div>
            {post.comments > 0 && (
              <span className="text-xs text-muted-foreground ml-auto">
                {post.comments} commentaire{post.comments > 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-0.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleReaction('love')}
            className={cn(
              "flex-1 h-8 text-xs gap-1 px-1 hover:bg-red-50 hover:text-red-600 transition-colors",
              userReaction === 'love' && "bg-red-50 text-red-600"
            )}
          >
            <Heart className={cn("h-3.5 w-3.5", userReaction === 'love' && "fill-current")} />
            <span className="hidden sm:inline">J'adore</span>
          </Button>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleReaction('gift')}
                  className={cn(
                    "flex-1 h-8 text-xs gap-1 px-1 hover:bg-primary/10 hover:text-primary transition-colors",
                    userReaction === 'gift' && "bg-primary/10 text-primary"
                  )}
                >
                  <Gift className={cn("h-3.5 w-3.5", userReaction === 'gift' && "fill-current")} />
                  <span className="hidden sm:inline">Cadeau</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-center">
                <p className="text-xs">Attention, vous allez faire une promesse de contribuer à offrir un cadeau à cette personne à son anniversaire</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleReaction('like')}
            className={cn(
              "flex-1 h-8 text-xs gap-1 px-1 hover:bg-blue-50 hover:text-blue-600 transition-colors",
              userReaction === 'like' && "bg-blue-50 text-blue-600"
            )}
          >
            <PartyPopper className={cn("h-3.5 w-3.5", userReaction === 'like' && "fill-current")} />
            <span className="hidden sm:inline">Bravo</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowComments(!showComments)}
            className="flex-1 h-8 text-xs gap-1 px-1 hover:bg-muted/50 transition-colors"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Commenter</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 h-8 text-xs gap-1 px-1 hover:bg-muted/50 transition-colors"
          >
            <Share2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Partager</span>
          </Button>
        </div>
      </div>
    </Card>
  );
}