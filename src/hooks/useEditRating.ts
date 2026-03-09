import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const EDIT_WINDOW_HOURS = 48;

export const useEditRating = () => {
  const { user } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const queryClient = useQueryClient();

  const canEditReview = (confirmedAt: string): boolean => {
    const confirmDate = new Date(confirmedAt);
    const now = new Date();
    const hoursDiff = (now.getTime() - confirmDate.getTime()) / (1000 * 60 * 60);
    return hoursDiff <= EDIT_WINDOW_HOURS;
  };

  const getRemainingHours = (confirmedAt: string): number => {
    const confirmDate = new Date(confirmedAt);
    const now = new Date();
    const hoursDiff = (now.getTime() - confirmDate.getTime()) / (1000 * 60 * 60);
    return Math.max(0, Math.ceil(EDIT_WINDOW_HOURS - hoursDiff));
  };

  /**
   * Update an existing rating/review
   * - Within 48h of confirmation
   * - Automatic status transition when category changes (≥3 ↔ <3)
   */
  const updateRating = async (
    orderId: string,
    newRating: number,
    newReviewText: string,
    currentRating: number,
    confirmedAt: string
  ) => {
    if (!user) {
      toast.error("Vous devez être connecté");
      throw new Error("User not authenticated");
    }

    if (!canEditReview(confirmedAt)) {
      toast.error("La période de modification est expirée", {
        description: "Vous ne pouvez modifier votre avis que dans les 48 heures suivant la confirmation.",
      });
      throw new Error("Edit window expired");
    }

    setIsUpdating(true);

    try {
      // 1. Fetch the order to verify ownership and get current status
      const { data: order, error: orderError } = await supabase
        .from("business_orders")
        .select("id, customer_id, order_summary, status")
        .eq("id", orderId)
        .eq("customer_id", user.id)
        .single();

      if (orderError || !order) {
        throw new Error("Commande non trouvée");
      }

      if (order.status === "refunded") {
        toast.error("Modification non autorisée", {
          description: "Cette commande a déjà été remboursée.",
        });
        throw new Error("Cannot edit refunded order");
      }

      // 2. Build update payload with automatic status transition
      const updatePayload: Record<string, unknown> = {
        customer_rating: newRating,
        customer_review_text: newReviewText || null,
      };

      let statusChanged = false;

      // Transition: satisfied → refund request
      if (newRating < 3 && currentRating >= 3 && order.status === "receipt_confirmed") {
        updatePayload.status = "refund_requested";
        updatePayload.refund_reason = newReviewText || "Insatisfaction après modification de l'avis";
        updatePayload.refund_requested_at = new Date().toISOString();
        statusChanged = true;
      }
      // Transition: refund request → satisfied
      else if (newRating >= 3 && currentRating < 3 && order.status === "refund_requested") {
        updatePayload.status = "receipt_confirmed";
        updatePayload.refund_reason = null;
        updatePayload.refund_requested_at = null;
        statusChanged = true;
      }

      // 3. Update the order
      const { error: updateError } = await supabase
        .from("business_orders")
        .update(updatePayload)
        .eq("id", orderId);

      if (updateError) throw updateError;

      // 4. Update product ratings
      const orderSummary = order.order_summary as { items?: Array<{ product_id?: string }> } | null;
      const items = orderSummary?.items || [];
      const productIds = items
        .map((item) => item.product_id)
        .filter((id): id is string => !!id);

      if (productIds.length > 0) {
        const uniqueProductIds = [...new Set(productIds)];
        for (const productId of uniqueProductIds) {
          await supabase
            .from("product_ratings")
            .update({
              rating: newRating,
              review_text: newReviewText || null,
              updated_at: new Date().toISOString(),
            })
            .eq("product_id", productId)
            .eq("user_id", user.id)
            .eq("order_id", orderId);
        }
      }

      // 5. Refresh & notify
      queryClient.invalidateQueries({ queryKey: ["customer-orders"] });

      if (statusChanged && newRating < 3) {
        toast.success("Avis modifié — demande de remboursement envoyée", {
          description: "Le vendeur sera notifié de votre demande.",
        });
      } else if (statusChanged && newRating >= 3) {
        toast.success("Avis modifié — demande de remboursement annulée", {
          description: "Votre satisfaction a été confirmée.",
        });
      } else {
        toast.success("Avis modifié avec succès");
      }
    } catch (error) {
      console.error("Error updating rating:", error);
      if (error instanceof Error && (error.message.includes("non autorisée") || error.message.includes("expirée"))) {
        // Already showed toast
      } else {
        toast.error("Erreur lors de la modification");
      }
      throw error;
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    updateRating,
    isUpdating,
    canEditReview,
    getRemainingHours,
  };
};
