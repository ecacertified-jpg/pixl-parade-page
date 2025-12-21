import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export const useOrderConfirmation = () => {
  const { user } = useAuth();
  const [isConfirming, setIsConfirming] = useState(false);
  const queryClient = useQueryClient();

  const confirmReceipt = async (
    orderId: string,
    rating: number,
    reviewText: string
  ) => {
    if (!user) {
      toast.error("Vous devez être connecté");
      throw new Error("User not authenticated");
    }

    setIsConfirming(true);

    try {
      // 1. Fetch the order to get product info
      const { data: order, error: orderError } = await supabase
        .from("business_orders")
        .select("*, business_accounts(business_name)")
        .eq("id", orderId)
        .eq("customer_id", user.id)
        .single();

      if (orderError || !order) {
        throw new Error("Commande non trouvée");
      }

      const isSatisfied = rating >= 3;
      const newStatus = isSatisfied ? "receipt_confirmed" : "refund_requested";

      // 2. Update the order status
      const updateData: Record<string, unknown> = {
        status: newStatus,
        customer_confirmed_at: new Date().toISOString(),
        customer_rating: rating,
        customer_review_text: reviewText || null,
      };

      if (!isSatisfied) {
        updateData.refund_reason = reviewText || "Note insuffisante";
        updateData.refund_requested_at = new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from("business_orders")
        .update(updateData)
        .eq("id", orderId);

      if (updateError) throw updateError;

      // 3. Create product ratings for each item in the order
      const orderSummary = order.order_summary as { items?: Array<{ product_id?: string; name: string }> } | null;
      const items = orderSummary?.items || [];

      // Get unique product IDs from items that have them
      const productIds = items
        .map((item) => item.product_id)
        .filter((id): id is string => !!id);

      // Create ratings for each unique product
      if (productIds.length > 0) {
        const uniqueProductIds = [...new Set(productIds)];
        
        for (const productId of uniqueProductIds) {
          // Check if user already rated this product
          const { data: existingRating } = await supabase
            .from("product_ratings")
            .select("id")
            .eq("product_id", productId)
            .eq("user_id", user.id)
            .maybeSingle();

          if (existingRating) {
            // Update existing rating
            await supabase
              .from("product_ratings")
              .update({
                rating,
                review_text: reviewText || null,
                order_id: orderId,
                updated_at: new Date().toISOString(),
              })
              .eq("id", existingRating.id);
          } else {
            // Create new rating
            await supabase
              .from("product_ratings")
              .insert({
                product_id: productId,
                user_id: user.id,
                rating,
                review_text: reviewText || null,
                order_id: orderId,
              });
          }
        }
      }

      // 4. Send notification to business via edge function
      try {
        await supabase.functions.invoke("notify-order-confirmation", {
          body: {
            orderId,
            rating,
            reviewText,
            isSatisfied,
            businessAccountId: order.business_account_id,
          },
        });
      } catch (notifyError) {
        console.error("Failed to send notification:", notifyError);
        // Don't fail the whole operation for notification failure
      }

      // 5. Refresh orders list
      queryClient.invalidateQueries({ queryKey: ["customer-orders"] });

      // 6. Show success message
      if (isSatisfied) {
        toast.success("Merci pour votre confirmation !", {
          description: "Votre avis a été publié sur la boutique.",
        });
      } else {
        toast.success("Demande de remboursement envoyée", {
          description: "Le prestataire va vous contacter pour organiser la reprise.",
        });
      }
    } catch (error) {
      console.error("Error confirming receipt:", error);
      toast.error("Erreur lors de la confirmation");
      throw error;
    } finally {
      setIsConfirming(false);
    }
  };

  return {
    confirmReceipt,
    isConfirming,
  };
};
