import { Star, Package, Sparkles, Heart, Share2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FollowBusinessButton } from "@/components/FollowBusinessButton";
import { cn } from "@/lib/utils";

interface VendorHeaderCardProps {
  businessId: string;
  businessName: string;
  businessType?: string;
  description?: string;
  logoUrl?: string;
  productCount: number;
  experienceCount: number;
  averageRating?: number;
  totalReviews?: number;
  onShare: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

export function VendorHeaderCard({
  businessId,
  businessName,
  businessType,
  description,
  logoUrl,
  productCount,
  experienceCount,
  averageRating,
  totalReviews,
  onShare,
  isFavorite,
  onToggleFavorite,
}: VendorHeaderCardProps) {
  return (
    <Card className="overflow-hidden shadow-soft">
      {/* Gradient Banner */}
      <div className="relative h-24 bg-gradient-to-br from-primary/30 via-primary/20 to-secondary/30">
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-primary/10 blur-2xl" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-secondary/20 blur-2xl" />
        </div>
      </div>

      {/* Main Content */}
      <div className="relative px-4 pb-4">
        {/* Avatar - Positioned to overlap banner */}
        <div className="flex items-end gap-4 -mt-12">
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-br from-primary to-accent rounded-full blur-sm opacity-50" />
            <Avatar className="relative h-24 w-24 border-4 border-background shadow-lg">
              <AvatarImage src={logoUrl || undefined} alt={businessName} />
              <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-2xl font-bold">
                {businessName.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
          
          <div className="flex-1 min-w-0 pb-1">
            <h2 className="text-xl font-bold text-foreground leading-tight mb-1 line-clamp-2">
              {businessName}
            </h2>
            {businessType && (
              <Badge variant="secondary" className="text-xs font-medium">
                {businessType}
              </Badge>
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex items-center flex-wrap gap-3 mt-4 mb-3">
          {averageRating !== undefined && averageRating > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-yellow-500/10">
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
              <span className="text-sm font-semibold text-yellow-700">{averageRating.toFixed(1)}</span>
              {totalReviews !== undefined && totalReviews > 0 && (
                <span className="text-xs text-muted-foreground">({totalReviews})</span>
              )}
            </div>
          )}
          
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10">
            <Package className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">{productCount}</span>
            <span className="text-xs text-muted-foreground">produits</span>
          </div>
          
          {experienceCount > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/10">
              <Sparkles className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">{experienceCount}</span>
              <span className="text-xs text-muted-foreground">expériences</span>
            </div>
          )}
        </div>

        {/* Description */}
        {description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
            {description}
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <FollowBusinessButton 
            businessId={businessId}
            businessName={businessName}
            showCount={true}
            className="flex-1"
          />
          
          {onToggleFavorite && (
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleFavorite}
              className={cn(
                "gap-2 transition-all",
                isFavorite && "text-destructive border-destructive/30 bg-destructive/5"
              )}
            >
              <Heart className={cn("h-4 w-4", isFavorite && "fill-current")} />
              <span className="hidden sm:inline">Favori</span>
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={onShare}
            className="gap-2"
          >
            <Share2 className="h-4 w-4" />
            <span className="hidden sm:inline">Partager</span>
          </Button>
        </div>
      </div>
    </Card>
  );
}
