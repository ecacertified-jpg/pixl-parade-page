import { useState } from "react";
import { Star, Package, AlertTriangle, CheckCircle2, Loader2, Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { type CustomerOrder } from "@/hooks/useCustomerOrders";

interface ConfirmDeliveryModalProps {
  order: CustomerOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (orderId: string, rating: number, reviewText: string) => Promise<void>;
}

export const ConfirmDeliveryModal = ({
  order,
  isOpen,
  onClose,
  onConfirm,
}: ConfirmDeliveryModalProps) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    setRating(0);
    setHoveredRating(0);
    setReviewText("");
    onClose();
  };

  const handleSubmit = async () => {
    if (!order || rating === 0) return;

    setIsSubmitting(true);
    try {
      // Délai minimum pour voir le spinner + exécution de l'action
      await Promise.all([
        onConfirm(order.id, rating, reviewText),
        new Promise(resolve => setTimeout(resolve, 500))
      ]);
      handleClose();
    } catch (error) {
      console.error("Error confirming delivery:", error);
      toast.error("Erreur lors de la confirmation. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSatisfied = rating >= 3;
  const displayRating = hoveredRating || rating;

  if (!order) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Confirmer la réception
          </DialogTitle>
          <DialogDescription>
            Commande #{order.orderNumber.substring(0, 8).toUpperCase()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Order Summary */}
          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-medium text-sm text-foreground mb-2">
              Résumé de la commande
            </h4>
            <div className="space-y-2">
              {order.items.length > 0 ? (
                order.items.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {item.quantity}x {item.name}
                    </span>
                    <span className="font-medium">
                      {(item.price * item.quantity).toLocaleString()} {order.currency}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  Total: {order.totalAmount.toLocaleString()} {order.currency}
                </p>
              )}
            </div>
            {order.businessName && (
              <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border">
                Boutique: {order.businessName}
              </p>
            )}
          </div>

          {/* Rating Section */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-foreground">
              Comment évaluez-vous votre commande ?
            </h4>
            
            {/* Note informative */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-800">
                Votre note nous aide à garantir la qualité des produits.
                <strong> 3 étoiles ou plus</strong> confirme votre satisfaction.
                <strong> Moins de 3 étoiles</strong> déclenchera une demande de remboursement.
              </p>
            </div>
            
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => !isSubmitting && setRating(star)}
                  onMouseEnter={() => !isSubmitting && setHoveredRating(star)}
                  onMouseLeave={() => !isSubmitting && setHoveredRating(0)}
                  disabled={isSubmitting}
                  className={cn(
                    "focus:outline-none transition-transform hover:scale-110",
                    isSubmitting && "opacity-50 cursor-not-allowed"
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

          {/* Review Text */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Votre commentaire (optionnel)
            </label>
            <Textarea
              placeholder="Partagez votre expérience avec ce produit..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              rows={3}
              className="resize-none"
              disabled={isSubmitting}
            />
          </div>

          {/* Consequence Message */}
          {rating > 0 && (
            <div
              className={cn(
                "rounded-lg p-4 flex items-start gap-3",
                isSatisfied
                  ? "bg-green-50 border border-green-200"
                  : "bg-amber-50 border border-amber-200"
              )}
            >
              {isSatisfied ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <div className="text-sm text-green-800">
                    <p className="font-medium">Merci pour votre satisfaction !</p>
                    <p className="mt-1 text-green-700">
                      Votre avis sera publié sur la boutique et aidera d'autres clients.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-800">
                    <p className="font-medium">Demande de remboursement</p>
                    <p className="mt-1 text-amber-700">
                      Nous allons contacter le prestataire pour organiser la reprise du produit et votre remboursement.
                    </p>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleClose}
            className="flex-1"
            disabled={isSubmitting}
          >
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={rating === 0 || isSubmitting}
            className={cn(
              "flex-1",
              rating > 0 && !isSatisfied && "bg-amber-600 hover:bg-amber-700"
            )}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Envoi en cours...
              </>
            ) : (
              rating > 0 && !isSatisfied ? "Demander remboursement" : "Confirmer"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
