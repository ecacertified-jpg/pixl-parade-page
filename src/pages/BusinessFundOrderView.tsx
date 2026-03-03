import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { CollectiveFundBusinessCard } from "@/components/CollectiveFundBusinessCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, AlertCircle, Gift } from "lucide-react";

export default function BusinessFundOrderView() {
  const { fundId } = useParams<{ fundId: string }>();
  const { user } = useAuth();
  const [fund, setFund] = useState<any>(null);
  const [contributors, setContributors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!fundId || !user?.id) return;

    const loadFund = async () => {
      try {
        setLoading(true);
        setError(false);

        // Single targeted query - RLS handles access control
        const { data, error: fetchError } = await supabase
          .from("business_collective_funds")
          .select(`
            *,
            collective_funds!fund_id (
              id, title, description, target_amount, current_amount,
              currency, status, occasion, deadline_date
            ),
            products!product_id (
              id, name, description, price, currency, image_url
            )
          `)
          .eq("fund_id", fundId)
          .maybeSingle();

        if (fetchError) {
          console.error("Error loading fund:", fetchError);
          setError(true);
          return;
        }

        if (!data) {
          setError(true);
          return;
        }

        // Get beneficiary profile
        let beneficiary = null;
        if (data.beneficiary_user_id) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("user_id, first_name, last_name, phone")
            .eq("user_id", data.beneficiary_user_id)
            .single();
          beneficiary = profile;
        }

        // Get contributors
        const { data: contribs } = await supabase
          .from("fund_contributions")
          .select("id, amount, contributor_id")
          .eq("fund_id", fundId);

        const contributorsList: any[] = [];
        if (contribs?.length) {
          const uniqueIds = [...new Set(contribs.map(c => c.contributor_id))];
          const { data: profiles } = await supabase
            .from("profiles")
            .select("user_id, first_name, last_name")
            .in("user_id", uniqueIds);

          const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

          for (const c of contribs) {
            const p = profileMap.get(c.contributor_id);
            contributorsList.push({
              id: c.id,
              name: p ? `${p.first_name || ""} ${p.last_name || ""}`.trim() || "Anonyme" : "Anonyme",
              amount: c.amount,
            });
          }
        }

        // Get order data
        let orderData = undefined;
        const fundData = Array.isArray(data.collective_funds) ? data.collective_funds[0] : data.collective_funds;
        if (fundData) {
          const { data: order } = await supabase
            .from("business_orders")
            .select("donor_phone, beneficiary_phone, delivery_address, payment_method, order_summary")
            .eq("fund_id", fundData.id)
            .maybeSingle();
          if (order) {
            orderData = order as any;
          }
        }

        const product = Array.isArray(data.products) ? data.products[0] : data.products;
        const benefName = beneficiary
          ? `${beneficiary.first_name || ""} ${beneficiary.last_name || ""}`.trim()
          : "Bénéficiaire";

        setFund({
          id: fundData?.id || fundId,
          title: fundData?.title || "Cagnotte",
          beneficiaryName: benefName,
          targetAmount: fundData?.target_amount || 0,
          currentAmount: fundData?.current_amount || 0,
          currency: fundData?.currency || "XOF",
          productImage: product?.image_url,
          productName: product?.name || "Produit",
          contributors: contributorsList,
          status: fundData?.status || "active",
          occasion: fundData?.occasion || "",
          orderData,
        });
        setContributors(contributorsList);
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
