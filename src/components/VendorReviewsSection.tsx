import { useState } from "react";
import { MessageSquare, Star, ChevronDown } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useVendorRatings, VendorRating } from "@/hooks/useVendorRatings";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface VendorReviewsSectionProps {
  businessId: string;
}

export function VendorReviewsSection({ businessId }: VendorReviewsSectionProps) {
  const { ratings, stats, loading } = useVendorRatings(businessId);
  const [isOpen, setIsOpen] = useState(false);

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-5 w-24" />
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  // No reviews state
  if (!stats || ratings.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="h-5 w-5 text-primary" />
            Avis clients
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">Aucun avis pour le moment</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Soyez le premier à donner votre avis !
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const recentRatings = ratings.slice(0, 5);
  const previewRatings = ratings.slice(0, 2);

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageSquare className="h-5 w-5 text-primary" />
              Avis clients
            </CardTitle>
            
            {/* Compact Rating Summary */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-500/10">
                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                <span className="text-sm font-bold text-yellow-700">{stats.averageRating}</span>
              </div>
              <span className="text-xs text-muted-foreground">({stats.totalRatings})</span>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          {/* Mini Star Distribution - Always visible */}
          <div className="flex items-center gap-2 mb-3">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = star === 5 ? stats.fiveStarCount :
                           star === 4 ? stats.fourStarCount :
                           star === 3 ? stats.threeStarCount :
                           star === 2 ? stats.twoStarCount :
                           stats.oneStarCount;
              const percentage = stats.totalRatings > 0 ? (count / stats.totalRatings) * 100 : 0;
              
              return (
                <div 
                  key={star}
                  className="flex-1 h-2 rounded-full bg-muted overflow-hidden"
                  title={`${star} étoiles: ${count} avis`}
                >
                  <div 
                    className="h-full bg-yellow-400 rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              );
            })}
          </div>

          {/* Preview Reviews - Always visible */}
          {!isOpen && previewRatings.length > 0 && (
            <div className="space-y-2 mb-2">
              {previewRatings.map((review) => (
                <MiniReviewCard key={review.id} review={review} />
              ))}
            </div>
          )}

          {/* Expand/Collapse Trigger */}
          <CollapsibleTrigger className="w-full flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer border-t border-border/50 mt-2">
            <span>{isOpen ? "Masquer les avis" : `Voir tous les avis (${recentRatings.length})`}</span>
            <ChevronDown className={cn(
              "h-4 w-4 transition-transform duration-200",
              isOpen && "rotate-180"
            )} />
          </CollapsibleTrigger>

          {/* Full Reviews List */}
          <CollapsibleContent>
            <div className="space-y-4 pt-4">
              {/* Full Stats Section */}
              <div className="flex gap-4 p-3 rounded-lg bg-muted/30">
                {/* Average Rating */}
                <div className="text-center">
                  <div className="flex items-center justify-center gap-0.5 mb-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= Math.round(stats.averageRating)
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-muted-foreground/30"
                        }`}
                      />
                    ))}
                  </div>
                  <div className="text-xl font-bold">{stats.averageRating}</div>
                  <div className="text-xs text-muted-foreground">{stats.totalRatings} avis</div>
                </div>

                {/* Star Distribution */}
                <div className="flex-1 space-y-1">
                  <StarProgressRow label={5} count={stats.fiveStarCount} total={stats.totalRatings} />
                  <StarProgressRow label={4} count={stats.fourStarCount} total={stats.totalRatings} />
                  <StarProgressRow label={3} count={stats.threeStarCount} total={stats.totalRatings} />
                  <StarProgressRow label={2} count={stats.twoStarCount} total={stats.totalRatings} />
                  <StarProgressRow label={1} count={stats.oneStarCount} total={stats.totalRatings} />
                </div>
              </div>

              {/* All Reviews */}
              {recentRatings.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          </CollapsibleContent>
        </CardContent>
      </Collapsible>
    </Card>
  );
}

// Mini Review Card for preview
function MiniReviewCard({ review }: { review: VendorRating }) {
  const userName = review.user?.first_name || 'Anonyme';
  
  return (
    <div className="flex items-start gap-2 p-2 rounded-lg bg-muted/30">
      <div className="flex items-center gap-0.5 flex-shrink-0">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-3 w-3 ${
              star <= review.rating
                ? "text-yellow-400 fill-yellow-400"
                : "text-muted-foreground/30"
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground line-clamp-1 flex-1">
        {review.review_text ? `"${review.review_text}"` : `${userName} - ${review.product.name}`}
      </p>
    </div>
  );
}

function StarProgressRow({ label, count, total }: { label: number; count: number; total: number }) {
  const percentage = total > 0 ? (count / total) * 100 : 0;
  
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-3 text-muted-foreground">{label}</span>
      <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
      <Progress value={percentage} className="h-2 flex-1" />
      <span className="w-6 text-right text-muted-foreground text-xs">{count}</span>
    </div>
  );
}

function ReviewCard({ review }: { review: VendorRating }) {
  const userName = review.user?.first_name || 'Anonyme';
  const avatarUrl = review.user?.avatar_url;
  
  const initials = review.user 
    ? review.user.first_name.charAt(0).toUpperCase()
    : 'A';

  const timeAgo = formatDistanceToNow(new Date(review.created_at), {
    addSuffix: true,
    locale: fr,
  });

  return (
    <div className="flex gap-3">
      <Avatar className="h-10 w-10 flex-shrink-0">
        {avatarUrl && <AvatarImage src={avatarUrl} alt={userName} />}
        <AvatarFallback className="bg-primary/10 text-primary text-sm">
          {initials.toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="font-medium text-sm truncate">{userName}</span>
          <span className="text-xs text-muted-foreground flex-shrink-0">{timeAgo}</span>
        </div>

        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-3 w-3 ${
                  star <= review.rating
                    ? "text-yellow-400 fill-yellow-400"
                    : "text-muted-foreground/30"
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">•</span>
          <span className="text-xs text-primary truncate">{review.product.name}</span>
        </div>

        {review.review_text && (
          <p className="text-sm text-muted-foreground line-clamp-3">
            "{review.review_text}"
          </p>
        )}
      </div>
    </div>
  );
}
