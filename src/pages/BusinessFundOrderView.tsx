import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { cleanMetaParam } from "@/utils/cleanMetaParam";
import { useAuth } from "@/contexts/AuthContext";
import { CollectiveFundBusinessCard } from "@/components/CollectiveFundBusinessCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, AlertCircle, Gift } from "lucide-react";

async function fallbackLoadFund(fundId: string, userId: string) {
  console.log("BusinessFundOrderView - Fallback: starting direct query", { fundId, userId });

  // 1. Get user's business accounts
  const { data: bizAccounts, error: bizErr } = await supabase
    .from('business_accounts')
    .select('id')
    .eq('user_id', userId);

  if (bizErr || !bizAccounts?.length) {
    console.warn("BusinessFundOrderView - Fallback: no business accounts", bizErr);
    return null;
  }

  const bizIds = bizAccounts.map(b => b.id);

  // 2. Get BCF row for this fund
  const { data: bcfRows, error: bcfErr } = await supabase
    .from('business_collective_funds')
    .select('*, collective_funds!fund_id(id, title, description, target_amount, current_amount, currency, status, occasion), products!product_id(id, name, price, image_url)')
    .eq('fund_id', fundId);

  if (bcfErr || !bcfRows?.length) {
    console.warn("BusinessFundOrderView - Fallback: no BCF row", bcfErr);
    return null;
  }

  // 3. Verify ownership
  const bcf = bcfRows.find(r => bizIds.includes(r.business_id));
  if (!bcf) {
    console.warn("BusinessFundOrderView - Fallback: fund not owned by user");
    return null;
  }

  const cf = Array.isArray(bcf.collective_funds) ? bcf.collective_funds[0] : bcf.collective_funds;
  const product = Array.isArray(bcf.products) ? bcf.products[0] : bcf.products;

  // 4. Load beneficiary profile
  let beneficiary: any = null;
  if (bcf.beneficiary_user_id) {
    const { data: prof } = await supabase
      .from('profiles')
      .select('user_id, first_name, last_name, phone')
      .eq('user_id', bcf.beneficiary_user_id)
      .single();
    beneficiary = prof;
  }

  // 5. Load contributors
  const { data: contribs } = await supabase
    .from('fund_contributions')
    .select('id, contributor_id, amount, is_anonymous')
    .eq('fund_id', fundId);

  const contributorIds = [...new Set((contribs || []).map(c => c.contributor_id))];
  let profilesMap = new Map<string, { first_name: string | null; last_name: string | null }>();
  if (contributorIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, first_name, last_name')
      .in('user_id', contributorIds);
    profiles?.forEach(p => profilesMap.set(p.user_id, p));
  }

  const contributors = (contribs || []).map(c => {
    const p = profilesMap.get(c.contributor_id);
    return {
      id: c.contributor_id,
      name: p ? `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Utilisateur' : 'Utilisateur',
      amount: c.amount,
    };
  });

  // 6. Load order (table may not be in generated types)
  let order: any = null;
  try {
    const { data: orders } = await (supabase as any)
      .from('collective_fund_orders')
      .select('donor_phone, beneficiary_phone, delivery_address, payment_method, order_summary')
      .eq('fund_id', fundId)
      .limit(1);
    order = orders?.[0] || null;
  } catch (e) {
    console.warn("BusinessFundOrderView - Fallback: order query failed", e);
  }

  const benefName = beneficiary
    ? `${beneficiary.first_name || ''} ${beneficiary.last_name || ''}`.trim()
    : 'Bénéficiaire';

  console.log("BusinessFundOrderView - Fallback: success", { cf, product, contributors: contributors.length });

  return {
    id: cf?.id || fundId,
    title: cf?.title || 'Cagnotte',
    beneficiaryName: benefName,
    targetAmount: cf?.target_amount || 0,
    currentAmount: cf?.current_amount || 0,
    currency: cf?.currency || 'XOF',
    productImage: product?.image_url,
    productName: product?.name || 'Produit',
    contributors,
    status: cf?.status || 'active',
    occasion: cf?.occasion || '',
    orderData: order ? {
      donor_phone: order.donor_phone,
      beneficiary_phone: order.beneficiary_phone,
      delivery_address: order.delivery_address,
      payment_method: order.payment_method,
      order_summary: order.order_summary,
    } : undefined,
  };
}

export default function BusinessFundOrderView() {
  const { fundId: rawFundId } = useParams<{ fundId: string }>();
  const fundId = cleanMetaParam(rawFundId);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [fund, setFund] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (!error && fund) return;
    if (loading) return;
    if (!error) return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          navigate('/business-collective-funds');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [error, loading, fund, navigate]);

  useEffect(() => {
    if (!fundId || !user?.id) return;

    const loadFund = async () => {
      try {
        setLoading(true);
        setError(false);

        console.log("BusinessFundOrderView - IDs:", { rawFundId, fundId, userId: user?.id });

        // Step 1: Try RPC
        const { data, error: rpcError } = await supabase.rpc(
          'get_business_fund_for_owner' as any,
          { p_fund_id: fundId }
        );

        if (rpcError) {
          console.error("BusinessFundOrderView - RPC error:", rpcError);
        }

        if (data) {
          // RPC succeeded
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
          return;
        }

        // Step 2: RPC returned null — fallback to direct queries
        console.warn("BusinessFundOrderView - RPC returned null, trying fallback");
        const fallbackResult = await fallbackLoadFund(fundId, user.id);

        if (fallbackResult) {
          setFund(fallbackResult);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error("BusinessFundOrderView - Error:", err);
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
        <p className="text-xs text-muted-foreground">
          Redirection automatique dans {countdown} seconde{countdown > 1 ? 's' : ''}…
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
