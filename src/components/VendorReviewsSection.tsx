import { MessageSquare, Star, User } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useVendorRatings, VendorRating } from "@/hooks/useVendorRatings";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface VendorReviewsSectionProps {
  businessId: string;
}

export function VendorReviewsSection({ businessId }: VendorReviewsSectionProps) {
  const { ratings, stats, loading } = useVendorRatings(businessId);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </Card>
    );
  }

  // No reviews state
  if (!stats || ratings.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Avis clients</h3>
        </div>
        <div className="text-center py-8">
          <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">Aucun avis pour le moment</p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Soyez le premier à donner votre avis !
          </p>
        </div>
      </Card>
    );
  }

  const recentRatings = ratings.slice(0, 5);

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Avis clients</h3>
      </div>

      {/* Stats Section */}
      <div className="flex gap-6 mb-6">
        {/* Average Rating */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-5 w-5 ${
                  star <= Math.round(stats.averageRating)
                    ? "text-yellow-400 fill-yellow-400"
                    : "text-muted-foreground/30"
                }`}
              />
            ))}
          </div>
          <div className="text-2xl font-bold">{stats.averageRating}</div>
          <div className="text-sm text-muted-foreground">
            {stats.totalRatings} avis
          </div>
        </div>

        {/* Star Distribution */}
        <div className="flex-1 space-y-1.5">
          <StarProgressRow label={5} count={stats.fiveStarCount} total={stats.totalRatings} />
          <StarProgressRow label={4} count={stats.fourStarCount} total={stats.totalRatings} />
          <StarProgressRow label={3} count={stats.threeStarCount} total={stats.totalRatings} />
          <StarProgressRow label={2} count={stats.twoStarCount} total={stats.totalRatings} />
          <StarProgressRow label={1} count={stats.oneStarCount} total={stats.totalRatings} />
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-border/50 mb-4" />

      {/* Reviews List */}
      <div className="space-y-4">
        {recentRatings.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>
    </Card>
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
  const userName = review.user 
    ? `${review.user.first_name} ${review.user.last_name.charAt(0) || ''}.`
    : 'Anonyme';
  
  const initials = review.user 
    ? `${review.user.first_name.charAt(0)}${review.user.last_name.charAt(0) || ''}`
    : 'A';

  const timeAgo = formatDistanceToNow(new Date(review.created_at), {
    addSuffix: true,
    locale: fr,
  });

  return (
    <div className="flex gap-3">
      <Avatar className="h-10 w-10 flex-shrink-0">
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
