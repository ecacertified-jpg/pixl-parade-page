import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type ExternalPurchaseStatus =
  | "pending"
  | "purchased"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export interface ExternalPurchaseRequest {
  id: string;
  fund_id: string;
  status: ExternalPurchaseStatus;
  external_url: string;
  product_name: string;
  estimated_price: number;
  currency: string;
  actual_purchase_amount: number | null;
  external_platform: string | null;
  purchased_by_admin_id: string | null;
  purchased_at: string | null;
  external_order_reference: string | null;
  proof_url: string | null;
  delivery_address: string | null;
  beneficiary_phone: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  collective_funds?: {
    id: string;
    title: string;
    current_amount: number;
    target_amount: number;
    creator_id: string;
    country_code: string | null;
    external_product_image_url: string | null;
  } | null;
}

export function useExternalPurchaseRequests(filterStatus?: ExternalPurchaseStatus | "all") {
  return useQuery({
    queryKey: ["external-purchase-requests", filterStatus ?? "all"],
    queryFn: async (): Promise<ExternalPurchaseRequest[]> => {
      let q = supabase
        .from("external_purchase_requests")
        .select(
          `*, collective_funds!fund_id(id,title,current_amount,target_amount,creator_id,country_code,external_product_image_url)`
        )
        .order("created_at", { ascending: false });
      if (filterStatus && filterStatus !== "all") {
        q = q.eq("status", filterStatus);
      }
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as any;
    },
  });
}

export function useUpdateExternalPurchaseRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string;
      patch: Partial<ExternalPurchaseRequest>;
    }) => {
      const { error } = await supabase
        .from("external_purchase_requests")
        .update(patch)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["external-purchase-requests"] });
      toast.success("Demande mise à jour.");
    },
    onError: (err: any) => {
      toast.error(err?.message ?? "Échec de la mise à jour.");
    },
  });
}