import { useState, useEffect } from "react";
import { Star, Pencil, Loader2, Clock, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { type CustomerOrder } from "@/hooks/useCustomerOrders";
import { useEditRating } from "@/hooks/useEditRating";

interface EditRatingModalProps {
  order: CustomerOrder | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EditRatingModal = ({
  order,
  isOpen,
  onClose,
}: EditRatingModalProps) => {
  const { updateRating, isUpdating, getRemainingHours } = useEditRating();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [reviewText, setReviewText] = useState("");

  useEffect(() => {
    if (order && isOpen) {
      setRating(order.customerRating || 0);
      setReviewText(order.customerReviewText || "");
    }
  }, [order, isOpen]);

  const handleClose = () => {
    setRating(0);
    setHoveredRating(0);
    setReviewText("");
    onClose();
  };

  const handleSubmit = async () => {
    if (!order || rating === 0 || !order.customerConfirmedAt || !order.customerRating) return;

    try {
      await updateRating(
        order.id,
        rating,
        reviewText,
        order.customerRating,
        order.customerConfirmedAt
      );
      handleClose();
    } catch (error) {
      console.error("Error updating rating:", error);
    }
  };

  const displayRating = hoveredRating || rating;
  const remainingHours = order?.customerConfirmedAt ? getRemainingHours(order.customerConfirmedAt) : 0;
  const originalRating = order?.customerRating || 0;

  // Detect category change
  const isCategoryChange = rating > 0 && (
    (originalRating >= 3 && rating < 3) || (originalRating < 3 && rating >= 3)
  );

  if (!order) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5 text-primary" />
            Modifier votre avis
          </DialogTitle>
          <DialogDescription>
            Commande #{order.orderNumber.substring(0, 8).toUpperCase()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Time remaining notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2 dark:bg-blue-950/50 dark:border-blue-800">
            <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <p className="text-xs text-blue-800 dark:text-blue-300">
              Vous pouvez modifier votre avis pendant encore{" "}
              <strong>{remainingHours} heure{remainingHours > 1 ? "s" : ""}</strong>
            </p>
          </div>

          {/* Rating Section */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-foreground">
              Votre nouvelle note
            </h4>

            <div className="flex justify-center gap-2">
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
                    className={cn(
                      "h-10 w-10 transition-colors",
                      star <= displayRating
                        ? "fill-amber-400 text-amber-400"
                        : "text-muted-foreground/30"
                    )}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-center text-sm text-muted-foreground">
                {rating === 1 && "Très insatisfait"}
                {rating === 2 && "Insatisfait"}
                {rating === 3 && "Correct"}
                {rating === 4 && "Satisfait"}
                {rating === 5 && "Très satisfait"}
              </p>
            )}
          </div>

          {/* Category change warning */}
          {isCategoryChange && (
            <div className={cn(
              "rounded-lg p-3 flex items-start gap-2 border",
              originalRating >= 3 && rating < 3
                ? "bg-amber-50 border-amber-200 dark:bg-amber-950/50 dark:border-amber-800"
                : "bg-green-50 border-green-200 dark:bg-green-950/50 dark:border-green-800"
            )}>
              <AlertTriangle className={cn(
                "h-4 w-4 shrink-0 mt-0.5",
                originalRating >= 3 && rating < 3
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-green-600 dark:text-green-400"
              )} />
              <p className={cn(
                "text-xs",
                originalRating >= 3 && rating < 3
                  ? "text-amber-800 dark:text-amber-300"
                  : "text-green-800 dark:text-green-300"
              )}>
                {originalRating >= 3 && rating < 3
                  ? "En passant à moins de 3 étoiles, une demande de remboursement sera automatiquement envoyée au vendeur."
                  : "En passant à 3 étoiles ou plus, votre demande de remboursement sera annulée et votre satisfaction confirmée."
                }
              </p>
            </div>
          )}

          {/* Review Text */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Votre commentaire
            </label>
            <Textarea
              placeholder="Partagez votre expérience avec ce produit..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleClose}
            className="flex-1"
            disabled={isUpdating}
          >
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={rating === 0 || isUpdating}
            className="flex-1"
          >
            {isUpdating ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Enregistrer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
