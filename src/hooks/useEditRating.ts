import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const EDIT_WINDOW_DAYS = 7;

export const useEditRating = () => {
  const { user } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const queryClient = useQueryClient();

  /**
   * Check if the review can still be edited (within 7 days of confirmation)
   */
  const canEditReview = (confirmedAt: string): boolean => {
    const confirmDate = new Date(confirmedAt);
    const now = new Date();
    const daysDiff = (now.getTime() - confirmDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysDiff <= EDIT_WINDOW_DAYS;
  };

  /**
   * Get remaining days to edit the review
   */
  const getRemainingDays = (confirmedAt: string): number => {
    const confirmDate = new Date(confirmedAt);
    const now = new Date();
    const daysDiff = (now.getTime() - confirmDate.getTime()) / (1000 * 60 * 60 * 24);
    return Math.max(0, Math.ceil(EDIT_WINDOW_DAYS - daysDiff));
  };

  /**
   * Update an existing rating/review
   * Constraints:
   * - Cannot edit refund requests
   * - Cannot change rating from >=3 to <3 (prevent fraud)
   * - Can modify rating between 3-5
   * - Can modify comment freely
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

    // Check edit window
    if (!canEditReview(confirmedAt)) {
      toast.error("La période de modification est expirée", {
        description: "Vous ne pouvez modifier votre avis que dans les 7 jours suivant la confirmation.",
      });
      throw new Error("Edit window expired");
    }

    // Prevent changing from satisfied to refund request
    if (currentRating >= 3 && newRating < 3) {
      toast.error("Modification non autorisée", {
        description: "Vous ne pouvez pas demander un remboursement après avoir confirmé votre satisfaction.",
      });
      throw new Error("Cannot change from satisfied to refund");
    }

    setIsUpdating(true);

    try {
      // 1. Fetch the order to verify ownership
      const { data: order, error: orderError } = await supabase
        .from("business_orders")
        .select("id, customer_id, order_summary, status")
        .eq("id", orderId)
        .eq("customer_id", user.id)
        .single();

      if (orderError || !order) {
        throw new Error("Commande non trouvée");
      }

      // Cannot edit refund requests
      if (order.status === "refund_requested" || order.status === "refunded") {
        toast.error("Modification non autorisée", {
          description: "Vous ne pouvez pas modifier une demande de remboursement.",
        });
        throw new Error("Cannot edit refund request");
      }

      // 2. Update the order
      const { error: updateError } = await supabase
        .from("business_orders")
        .update({
          customer_rating: newRating,
          customer_review_text: newReviewText || null,
        })
        .eq("id", orderId);

      if (updateError) throw updateError;

      // 3. Update product ratings
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

      // 4. Refresh orders list
      queryClient.invalidateQueries({ queryKey: ["customer-orders"] });

      toast.success("Avis modifié avec succès");
    } catch (error) {
      console.error("Error updating rating:", error);
      if (error instanceof Error && error.message.includes("non autorisée")) {
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
    getRemainingDays,
  };
};
