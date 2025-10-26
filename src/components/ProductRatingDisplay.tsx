import { Star, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useProductRatings, ProductRating } from '@/hooks/useProductRatings';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ProductRatingDisplayProps {
  productId: string;
  onWriteReview: () => void;
  compact?: boolean;
}

export const ProductRatingDisplay = ({
  productId,
  onWriteReview,
  compact = false,
}: ProductRatingDisplayProps) => {
  const { ratings, stats, loading } = useProductRatings(productId);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-muted rounded w-32 mb-2"></div>
        <div className="h-3 bg-muted rounded w-24"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-sm text-muted-foreground">
        Aucune note pour le moment
        <Button
          variant="link"
          size="sm"
          onClick={onWriteReview}
          className="ml-2 p-0 h-auto"
        >
          Soyez le premier à noter !
        </Button>
      </div>
    );
  }

  const StarRating = ({ rating, size = 'default' }: { rating: number; size?: 'sm' | 'default' }) => {
    const starSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${starSize} ${
              star <= Math.round(rating)
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <StarRating rating={stats.average_rating} />
        <span className="text-sm font-medium">{stats.average_rating}</span>
        <span className="text-xs text-muted-foreground">
          ({stats.rating_count} {stats.rating_count === 1 ? 'avis' : 'avis'})
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="flex items-start gap-6">
        <div className="text-center">
          <div className="text-4xl font-bold mb-1">{stats.average_rating}</div>
          <StarRating rating={stats.average_rating} />
          <div className="text-sm text-muted-foreground mt-1">
            {stats.rating_count} {stats.rating_count === 1 ? 'avis' : 'avis'}
          </div>
        </div>

        <div className="flex-1 space-y-2">
          {[5, 4, 3, 2, 1].map((star) => {
            const count =
              star === 5
                ? stats.five_star_count
                : star === 4
                ? stats.four_star_count
                : star === 3
                ? stats.three_star_count
                : star === 2
                ? stats.two_star_count
                : stats.one_star_count;
            const percentage = stats.rating_count > 0 ? (count / stats.rating_count) * 100 : 0;

            return (
              <div key={star} className="flex items-center gap-2 text-sm">
                <span className="w-12">{star} ★</span>
                <Progress value={percentage} className="flex-1 h-2" />
                <span className="w-8 text-muted-foreground text-right">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      <Button onClick={onWriteReview} variant="outline" className="w-full">
        <MessageSquare className="h-4 w-4 mr-2" />
        Écrire un avis
      </Button>

      {/* Reviews List */}
      {ratings.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold">Avis des clients</h3>
          {ratings.slice(0, 5).map((rating: ProductRating) => (
            <Card key={rating.id} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="font-medium">
                    {rating.user?.first_name} {rating.user?.last_name?.[0]}.
                  </div>
                  <StarRating rating={rating.rating} size="sm" />
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(rating.created_at), {
                    addSuffix: true,
                    locale: fr,
                  })}
                </span>
              </div>
              {rating.review_text && (
                <p className="text-sm text-muted-foreground mt-2">{rating.review_text}</p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
