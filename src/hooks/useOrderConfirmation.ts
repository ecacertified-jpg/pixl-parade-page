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
      console.log('🔄 Starting order confirmation:', { orderId, userId: user.id, rating });

      // 1. Fetch the order to get product info
      const { data: order, error: orderError } = await supabase
        .from("business_orders")
        .select("*, business_accounts(business_name)")
        .eq("id", orderId)
        .eq("customer_id", user.id)
        .single();

      console.log('📦 Order fetch result:', { order, orderError });

      if (orderError || !order) {
        console.error('❌ Order not found or fetch error:', orderError);
        throw new Error("Commande non trouvée");
      }

      // Vérifier que l'utilisateur connecté est bien le client de cette commande
      if (order.customer_id !== user.id) {
        console.error('❌ Customer ID mismatch:', { orderCustomerId: order.customer_id, userId: user.id });
        throw new Error("Vous n'êtes pas le client de cette commande.");
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

      console.log('🔄 Attempting to update order:', { orderId, userId: user.id, rating, newStatus, updateData });

      const { data: updateResult, error: updateError } = await supabase
        .from("business_orders")
        .update(updateData)
        .eq("id", orderId)
        .select();

      console.log('📊 Update result:', { updateResult, updateError });

      if (updateError) {
        console.error('❌ Update error:', updateError);
        throw updateError;
      }

      // Vérifier si la mise à jour a réellement affecté une ligne (RLS peut bloquer silencieusement)
      if (!updateResult || updateResult.length === 0) {
        console.error('❌ No rows updated - RLS may have blocked the update');
        throw new Error("Impossible de mettre à jour la commande. Vérifiez que vous êtes bien le client de cette commande.");
      }

      console.log('✅ Order updated successfully:', updateResult[0]);

      // 3. Create product ratings for each item in the order
      const orderSummary = order.order_summary as { items?: Array<{ product_id?: string; name: string }> } | null;
      const items = orderSummary?.items || [];

      // Get unique product IDs from items that have them
      const productIds = items
        .map((item) => item.product_id)
        .filter((id): id is string => !!id);

      console.log('📊 Order items for ratings:', items);
      console.log('🆔 Product IDs found:', productIds);

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
        console.log('✅ Product ratings created successfully');
      } else {
        console.warn('⚠️ No product_id found in order items - ratings cannot be created. Items:', items);
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

      // 5. Refresh orders list and ratings cache
      queryClient.invalidateQueries({ queryKey: ["customer-orders"] });
      queryClient.invalidateQueries({ queryKey: ["product-ratings"] });
      queryClient.invalidateQueries({ queryKey: ["vendor-ratings"] });
      
      console.log('✅ Order confirmation complete, caches invalidated');

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
