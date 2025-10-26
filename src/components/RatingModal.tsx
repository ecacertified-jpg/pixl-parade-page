import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';
import { toast } from 'sonner';
import { useProductRatings } from '@/hooks/useProductRatings';
import { useAuth } from '@/contexts/AuthContext';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  existingRating?: number;
  existingReview?: string;
}

export const RatingModal = ({
  isOpen,
  onClose,
  productId,
  productName,
  existingRating,
  existingReview,
}: RatingModalProps) => {
  const { user } = useAuth();
  const { submitRating } = useProductRatings(productId);
  const [rating, setRating] = useState(existingRating || 0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [reviewText, setReviewText] = useState(existingReview || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Vous devez être connecté pour noter un produit');
      return;
    }

    if (rating === 0) {
      toast.error('Veuillez sélectionner une note');
      return;
    }

    try {
      setIsSubmitting(true);
      await submitRating(rating, reviewText);
      toast.success(
        existingRating ? 'Votre note a été mise à jour !' : 'Merci pour votre avis !'
      );
      onClose();
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast.error('Erreur lors de l\'envoi de votre note');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {existingRating ? 'Modifier votre avis' : 'Noter le produit'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">
              {productName}
            </p>
            
            <div className="flex justify-center gap-2 my-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="focus:outline-none transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= (hoveredRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>

            {rating > 0 && (
              <p className="text-sm font-medium">
                {rating === 1 && 'Très décevant'}
                {rating === 2 && 'Décevant'}
                {rating === 3 && 'Correct'}
                {rating === 4 && 'Bon'}
                {rating === 5 && 'Excellent'}
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Votre avis (optionnel)
            </label>
            <Textarea
              placeholder="Partagez votre expérience avec ce produit..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {reviewText.length}/500 caractères
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1"
              disabled={isSubmitting || rating === 0}
            >
              {isSubmitting
                ? 'Envoi...'
                : existingRating
                ? 'Mettre à jour'
                : 'Publier'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
