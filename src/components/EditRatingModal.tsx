import { useState, useEffect } from "react";
import { Star, Pencil, Loader2, Clock } from "lucide-react";
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
  const { updateRating, isUpdating, getRemainingDays } = useEditRating();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [reviewText, setReviewText] = useState("");

  // Pre-fill with existing values when modal opens
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
  const remainingDays = order?.customerConfirmedAt ? getRemainingDays(order.customerConfirmedAt) : 0;
  const originalRating = order?.customerRating || 0;

  // Cannot rate below 3 if original was 3 or above
  const minAllowedRating = originalRating >= 3 ? 3 : 1;

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
              <strong>{remainingDays} jour{remainingDays > 1 ? "s" : ""}</strong>
            </p>
          </div>

          {/* Rating Section */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-foreground">
              Votre nouvelle note
            </h4>

            {originalRating >= 3 && (
              <p className="text-xs text-muted-foreground">
                Note minimum: 3 étoiles (vous avez confirmé votre satisfaction)
              </p>
            )}

            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => {
                const isDisabled = star < minAllowedRating;
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => !isDisabled && setRating(star)}
                    onMouseEnter={() => !isDisabled && setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    disabled={isDisabled}
                    className={cn(
                      "focus:outline-none transition-transform",
                      isDisabled ? "opacity-30 cursor-not-allowed" : "hover:scale-110"
                    )}
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
                );
              })}
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
