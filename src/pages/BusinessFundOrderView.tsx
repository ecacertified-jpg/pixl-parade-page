import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { cleanMetaParam } from "@/utils/cleanMetaParam";
import { useAuth } from "@/contexts/AuthContext";
import { CollectiveFundBusinessCard } from "@/components/CollectiveFundBusinessCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, AlertCircle, Gift } from "lucide-react";

export default function BusinessFundOrderView() {
  const { fundId: rawFundId } = useParams<{ fundId: string }>();
  const fundId = cleanMetaParam(rawFundId);
  const { user } = useAuth();
  const [fund, setFund] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!fundId || !user?.id) return;

    const loadFund = async () => {
      try {
        setLoading(true);
        setError(false);

        console.log("BusinessFundOrderView - IDs:", { rawFundId, fundId, userId: user?.id });

        const { data, error: rpcError } = await supabase.rpc(
          'get_business_fund_for_owner' as any,
          { p_fund_id: fundId }
        );

        if (rpcError) {
          console.error("BusinessFundOrderView - RPC error:", rpcError);
          setError(true);
          return;
        }

        if (!data) {
          console.warn("BusinessFundOrderView - No data returned from RPC");
          setError(true);
        }

        if (!data) {
          setError(true);
          return;
        }

        const result = data as any;
        const cf = result.fund;
        const product = result.product;
        const beneficiary = result.beneficiary;
        const contributors = result.contributors || [];
        const order = result.order;

        const benefName = beneficiary
          ? `${beneficiary.first_name || ""} ${beneficiary.last_name || ""}`.trim()
          : "Bénéficiaire";

        setFund({
          id: cf?.id || fundId,
          title: cf?.title || "Cagnotte",
          beneficiaryName: benefName,
          targetAmount: cf?.target_amount || 0,
          currentAmount: cf?.current_amount || 0,
          currency: cf?.currency || "XOF",
          productImage: product?.image_url,
          productName: product?.name || "Produit",
          contributors,
          status: cf?.status || "active",
          occasion: cf?.occasion || "",
          orderData: order ? {
            donor_phone: order.donor_phone,
            beneficiary_phone: order.beneficiary_phone,
            delivery_address: order.delivery_address,
            payment_method: order.payment_method,
            order_summary: order.order_summary,
          } : undefined,
        });
      } catch (err) {
        console.error("Error:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    loadFund();
  }, [fundId, user?.id]);

  if (loading) {
    return (
      <div className="p-4 space-y-4 max-w-2xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-lg" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
    );
  }

  if (error || !fund) {
    return (
      <div className="p-4 max-w-2xl mx-auto text-center space-y-4 mt-12">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
        <h2 className="text-lg font-semibold font-poppins">Cagnotte introuvable</h2>
        <p className="text-sm text-muted-foreground">
          Cette cagnotte n'existe pas ou vous n'y avez pas accès.
        </p>
        <Button asChild variant="outline">
          <Link to="/business-collective-funds">
            <Gift className="h-4 w-4 mr-2" />
            Voir toutes mes cagnottes
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link to="/business-collective-funds">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-xl font-semibold font-poppins">Commande cagnotte</h1>
      </div>

      <CollectiveFundBusinessCard fund={fund} />

      <Button asChild variant="outline" className="w-full">
        <Link to="/business-collective-funds">
          Voir toutes mes cagnottes
        </Link>
      </Button>
    </div>
  );
}
