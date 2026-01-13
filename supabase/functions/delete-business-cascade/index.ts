import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DeleteRequest {
  business_id: string;
  business_user_id: string;
  business_name: string;
  admin_user_id?: string | null;
  action_type?: 'hard_delete' | 'auto_purge';
}

interface DeleteStats {
  products: number;
  product_ratings: number;
  categories: number;
  orders: number;
  funds_deleted: number;
  funds_disassociated: number;
  birthday_alerts: number;
  business_collective_funds: number;
  favorites: number;
}

interface DeleteResult {
  success: boolean;
  deleted: DeleteStats;
  error?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const body: DeleteRequest = await req.json();
    const { 
      business_id, 
      business_user_id, 
      business_name, 
      admin_user_id, 
      action_type = 'hard_delete' 
    } = body;

    // Validation
    if (!business_id || !business_user_id || !business_name) {
      throw new Error("Missing required fields: business_id, business_user_id, business_name");
    }

    console.log(`[delete-business-cascade] Starting deletion for: ${business_name} (${business_id})`);

    const stats: DeleteStats = {
      products: 0,
      product_ratings: 0,
      categories: 0,
      orders: 0,
      funds_deleted: 0,
      funds_disassociated: 0,
      birthday_alerts: 0,
      business_collective_funds: 0,
      favorites: 0,
    };

    // =====================================================
    // STEP 1: Get all products for this business
    // =====================================================
    const { data: products, error: productsError } = await supabaseAdmin
      .from("products")
      .select("id")
      .eq("business_account_id", business_id);

    if (productsError) {
      console.error("Error fetching products:", productsError);
      throw new Error(`Failed to fetch products: ${productsError.message}`);
    }

    if (products && products.length > 0) {
      const productIds = products.map((p) => p.id);
      stats.products = productIds.length;
      console.log(`[delete-business-cascade] Found ${productIds.length} products to process`);

      // =====================================================
      // STEP 2: Delete all product dependencies
      // =====================================================

      // 2a. Delete product_ratings
      const { count: ratingsCount } = await supabaseAdmin
        .from("product_ratings")
        .delete()
        .in("product_id", productIds)
        .select("*", { count: "exact", head: true });
      stats.product_ratings = ratingsCount || 0;

      // 2b. Delete business_birthday_alerts referencing products
      const { count: alertsCount } = await supabaseAdmin
        .from("business_birthday_alerts")
        .delete()
        .in("product_id", productIds)
        .select("*", { count: "exact", head: true });
      stats.birthday_alerts = alertsCount || 0;

      // 2c. Delete business_collective_funds referencing products
      const { count: bcfCount } = await supabaseAdmin
        .from("business_collective_funds")
        .delete()
        .in("product_id", productIds)
        .select("*", { count: "exact", head: true });
      stats.business_collective_funds = bcfCount || 0;

      // 2d. Set business_product_id to NULL in collective_funds
      await supabaseAdmin
        .from("collective_funds")
        .update({ business_product_id: null })
        .in("business_product_id", productIds);

      // 2e. Delete favorites referencing products
      const { count: favCount } = await supabaseAdmin
        .from("favorites")
        .delete()
        .in("product_id", productIds)
        .select("*", { count: "exact", head: true });
      stats.favorites = favCount || 0;

      console.log(`[delete-business-cascade] Deleted product dependencies:`, {
        ratings: stats.product_ratings,
        alerts: stats.birthday_alerts,
        bcf: stats.business_collective_funds,
        favorites: stats.favorites,
      });
    }

    // =====================================================
    // STEP 3: Delete products
    // =====================================================
    const { error: deleteProductsError } = await supabaseAdmin
      .from("products")
      .delete()
      .eq("business_account_id", business_id);

    if (deleteProductsError) {
      console.error("Error deleting products:", deleteProductsError);
      throw new Error(`Failed to delete products: ${deleteProductsError.message}`);
    }
    console.log(`[delete-business-cascade] Deleted ${stats.products} products`);

    // =====================================================
    // STEP 4: Delete business categories
    // =====================================================
    const { count: categoriesCount } = await supabaseAdmin
      .from("business_categories")
      .delete()
      .eq("business_owner_id", business_user_id)
      .select("*", { count: "exact", head: true });
    stats.categories = categoriesCount || 0;
    console.log(`[delete-business-cascade] Deleted ${stats.categories} categories`);

    // =====================================================
    // STEP 5: Handle collective funds
    // =====================================================
    const { data: funds } = await supabaseAdmin
      .from("collective_funds")
      .select("id, fund_contributions(id)")
      .eq("created_by_business_id", business_id);

    if (funds && funds.length > 0) {
      for (const fund of funds) {
        const hasContributions = fund.fund_contributions && fund.fund_contributions.length > 0;

        if (hasContributions) {
          // Disassociate fund from business (keep for contributors)
          await supabaseAdmin
            .from("collective_funds")
            .update({ created_by_business_id: null })
            .eq("id", fund.id);
          stats.funds_disassociated++;
        } else {
          // Delete fund comments first
          await supabaseAdmin
            .from("fund_comments")
            .delete()
            .eq("fund_id", fund.id);

          // Delete fund activities
          await supabaseAdmin
            .from("fund_activities")
            .delete()
            .eq("fund_id", fund.id);

          // Delete the empty fund
          await supabaseAdmin
            .from("collective_funds")
            .delete()
            .eq("id", fund.id);
          stats.funds_deleted++;
        }
      }
    }
    console.log(`[delete-business-cascade] Funds: ${stats.funds_deleted} deleted, ${stats.funds_disassociated} disassociated`);

    // =====================================================
    // STEP 6: Delete business orders
    // =====================================================
    const { count: ordersCount } = await supabaseAdmin
      .from("business_orders")
      .delete()
      .eq("business_account_id", business_id)
      .select("*", { count: "exact", head: true });
    stats.orders = ordersCount || 0;
    console.log(`[delete-business-cascade] Deleted ${stats.orders} orders`);

    // =====================================================
    // STEP 7: Delete business archive
    // =====================================================
    await supabaseAdmin
      .from("deleted_business_archives")
      .delete()
      .eq("business_id", business_id);
    console.log(`[delete-business-cascade] Deleted archive`);

    // =====================================================
    // STEP 8: Delete business account
    // =====================================================
    const { error: deleteBusinessError } = await supabaseAdmin
      .from("business_accounts")
      .delete()
      .eq("id", business_id);

    if (deleteBusinessError) {
      console.error("Error deleting business account:", deleteBusinessError);
      throw new Error(`Failed to delete business account: ${deleteBusinessError.message}`);
    }
    console.log(`[delete-business-cascade] Deleted business account`);

    // =====================================================
    // STEP 9: Log audit action
    // =====================================================
    const auditDescription = action_type === 'auto_purge'
      ? `Business "${business_name}" purgé automatiquement (30+ jours)`
      : `Business "${business_name}" supprimé définitivement par un admin`;

    await supabaseAdmin.from("admin_audit_logs").insert({
      admin_user_id: admin_user_id || "00000000-0000-0000-0000-000000000000",
      action_type: action_type === 'auto_purge' ? 'auto_purge_business' : 'hard_delete_business',
      target_type: "business",
      target_id: business_id,
      description: auditDescription,
      metadata: { 
        business_name, 
        business_user_id,
        deleted_stats: stats 
      },
    });

    console.log(`[delete-business-cascade] Completed successfully for: ${business_name}`);

    const result: DeleteResult = { success: true, deleted: stats };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[delete-business-cascade] Error:", error);
    
    const result: DeleteResult = { 
      success: false, 
      deleted: {
        products: 0,
        product_ratings: 0,
        categories: 0,
        orders: 0,
        funds_deleted: 0,
        funds_disassociated: 0,
        birthday_alerts: 0,
        business_collective_funds: 0,
        favorites: 0,
      },
      error: error.message 
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
