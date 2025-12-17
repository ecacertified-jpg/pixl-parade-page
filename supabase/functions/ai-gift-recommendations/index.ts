import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UserContext {
  preferences: any;
  favorites: any[];
  purchaseHistory: any[];
  contactInfo?: any;
  occasion?: string;
  budget?: { min: number; max: number };
  feedbackHistory?: {
    acceptedProducts: string[];
    rejectedProducts: string[];
    preferredCategories: string[];
    topRejectionReasons: string[];
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { contactId, occasion, budgetMin, budgetMax } = await req.json();

    console.log(`[AI Recommendations] User: ${user.id}, Contact: ${contactId}, Occasion: ${occasion}`);

    // Fetch user preferences
    const { data: preferences } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    // Fetch user favorites
    const { data: favorites } = await supabase
      .from("user_favorites")
      .select("*, products(*)")
      .eq("user_id", user.id);

    // Fetch purchase history (gifts given)
    const { data: giftHistory } = await supabase
      .from("gifts")
      .select("*, products(*)")
      .eq("giver_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    // Fetch contact info if provided
    let contactInfo = null;
    if (contactId) {
      const { data: contact } = await supabase
        .from("contacts")
        .select("*")
        .eq("id", contactId)
        .maybeSingle();
      contactInfo = contact;
    }

    // Fetch suggestion feedback history for AI learning
    const { data: feedbackData } = await supabase
      .from("suggestion_feedback")
      .select("product_id, feedback_type, feedback_reason, occasion")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);

    // Process feedback history
    const acceptedProducts: string[] = [];
    const rejectedProducts: string[] = [];
    const rejectionReasons: Record<string, number> = {};

    feedbackData?.forEach((f: any) => {
      if (f.feedback_type === "accepted" || f.feedback_type === "purchased") {
        if (f.product_id) acceptedProducts.push(f.product_id);
      } else if (f.feedback_type === "rejected") {
        if (f.product_id) rejectedProducts.push(f.product_id);
        if (f.feedback_reason) {
          rejectionReasons[f.feedback_reason] = (rejectionReasons[f.feedback_reason] || 0) + 1;
        }
      }
    });

    const topRejectionReasons = Object.entries(rejectionReasons)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([reason]) => reason);

    // Get preferred categories from accepted products
    const preferredCategories: string[] = [];
    if (acceptedProducts.length > 0) {
      const { data: acceptedProductsData } = await supabase
        .from("products")
        .select("category_id, categories(name)")
        .in("id", acceptedProducts.slice(0, 20));

      const categoryCount: Record<string, number> = {};
      acceptedProductsData?.forEach((p: any) => {
        if (p.categories?.name) {
          categoryCount[p.categories.name] = (categoryCount[p.categories.name] || 0) + 1;
        }
      });

      Object.entries(categoryCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .forEach(([cat]) => preferredCategories.push(cat));
    }

    console.log(`[AI Recommendations] Feedback history: ${acceptedProducts.length} accepted, ${rejectedProducts.length} rejected`);

    // Fetch available products within budget, excluding rejected ones
    let productsQuery = supabase
      .from("products")
      .select("id, name, description, price, currency, category_id, image_url, location_name, business_owner_id, categories(name, name_fr), business_accounts!products_business_owner_id_fkey(business_name)")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(50);

    if (budgetMin) {
      productsQuery = productsQuery.gte("price", budgetMin);
    }
    if (budgetMax) {
      productsQuery = productsQuery.lte("price", budgetMax);
    }

    // Exclude rejected products
    if (rejectedProducts.length > 0) {
      productsQuery = productsQuery.not("id", "in", `(${rejectedProducts.join(",")})`);
    }

    const { data: availableProducts } = await productsQuery;

    // Build context for AI
    const userContext: UserContext = {
      preferences: preferences || {},
      favorites: favorites?.map(f => ({
        name: f.products?.name,
        category: f.products?.category_id,
        price: f.products?.price
      })) || [],
      purchaseHistory: giftHistory?.map(g => ({
        name: g.products?.name || g.gift_name,
        occasion: g.occasion,
        receiverName: g.receiver_name,
        date: g.gift_date
      })) || [],
      contactInfo: contactInfo ? {
        name: contactInfo.name,
        relationship: contactInfo.relationship,
        birthday: contactInfo.birthday
      } : null,
      occasion,
      budget: budgetMin || budgetMax ? { min: budgetMin || 0, max: budgetMax || 1000000 } : undefined,
      feedbackHistory: {
        acceptedProducts: acceptedProducts.slice(0, 10),
        rejectedProducts: rejectedProducts.slice(0, 10),
        preferredCategories,
        topRejectionReasons,
      }
    };

    // Create AI prompt with feedback learning
    const feedbackInstructions = userContext.feedbackHistory ? `
IMPORTANT - Apprentissage basé sur les préférences utilisateur:
${preferredCategories.length > 0 ? `- Catégories préférées (à privilégier): ${preferredCategories.join(", ")}` : ""}
${topRejectionReasons.length > 0 ? `- Raisons de refus fréquentes (à éviter): ${topRejectionReasons.map(r => {
  if (r === "too_expensive") return "prix trop élevé";
  if (r === "not_their_style") return "pas leur style";
  if (r === "already_gifted") return "déjà offert";
  return r;
}).join(", ")}` : ""}
${rejectedProducts.length > 0 ? `- ${rejectedProducts.length} produits ont été rejetés par l'utilisateur et sont exclus` : ""}
${acceptedProducts.length > 0 ? `- ${acceptedProducts.length} produits ont été appréciés, utilise des produits similaires` : ""}

Adapte tes suggestions en tenant compte de ces préférences pour améliorer la pertinence.` : "";

    const systemPrompt = `Tu es un expert en recommandations de cadeaux pour l'application Joie de Vivre en Côte d'Ivoire.
Tu dois suggérer des cadeaux personnalisés basés sur les préférences de l'utilisateur, son historique d'achats, et les informations sur le destinataire.

Contexte utilisateur:
- Préférences: ${JSON.stringify(userContext.preferences)}
- Favoris: ${JSON.stringify(userContext.favorites)}
- Historique de cadeaux: ${JSON.stringify(userContext.purchaseHistory)}
${userContext.contactInfo ? `- Destinataire: ${JSON.stringify(userContext.contactInfo)}` : ''}
${userContext.occasion ? `- Occasion: ${userContext.occasion}` : ''}
${userContext.budget ? `- Budget: ${userContext.budget.min} - ${userContext.budget.max} XOF` : ''}
${feedbackInstructions}

Produits disponibles:
${JSON.stringify(availableProducts?.slice(0, 30) || [])}

Réponds en JSON avec exactement cette structure, sans texte supplémentaire.`;

    const userPrompt = `Suggère 5 cadeaux personnalisés pour ${userContext.contactInfo?.name || "cette personne"}${userContext.occasion ? ` pour ${userContext.occasion}` : ""}. 
Pour chaque suggestion, explique pourquoi ce cadeau est adapté en tenant compte des préférences de l'utilisateur.`;

    console.log("[AI Recommendations] Calling Lovable AI...");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_gifts",
              description: "Return personalized gift suggestions",
              parameters: {
                type: "object",
                properties: {
                  recommendations: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        productId: { type: "string", description: "ID of the recommended product" },
                        productName: { type: "string", description: "Name of the product" },
                        reason: { type: "string", description: "Why this gift is suitable" },
                        matchScore: { type: "number", description: "Confidence score 0-100" },
                        priceRange: { type: "string", description: "Price category: budget, mid, premium" }
                      },
                      required: ["productName", "reason", "matchScore"]
                    }
                  },
                  generalAdvice: {
                    type: "string",
                    description: "General advice for choosing gifts for this occasion"
                  }
                },
                required: ["recommendations"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "suggest_gifts" } }
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Service temporairement surchargé. Réessayez dans quelques instants." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Crédits IA épuisés. Veuillez recharger votre compte." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await aiResponse.text();
      console.error("[AI Recommendations] AI gateway error:", aiResponse.status, errorText);
      throw new Error("Erreur du service de recommandation");
    }

    const aiResult = await aiResponse.json();
    console.log("[AI Recommendations] AI response received");

    // Extract recommendations from tool call
    let recommendations = { recommendations: [], generalAdvice: "" };
    
    if (aiResult.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments) {
      try {
        recommendations = JSON.parse(aiResult.choices[0].message.tool_calls[0].function.arguments);
      } catch (e) {
        console.error("[AI Recommendations] Error parsing AI response:", e);
      }
    }

    // Enrich recommendations with full product data
    const enrichedRecommendations = await Promise.all(
      (recommendations.recommendations || []).map(async (rec: any) => {
        if (rec.productId) {
          const { data: product } = await supabase
            .from("products")
            .select("*, categories(name, name_fr), business_accounts!products_business_owner_id_fkey(business_name)")
            .eq("id", rec.productId)
            .maybeSingle();
          
          // Add vendor from business_accounts
          const enrichedProduct = product ? {
            ...product,
            vendor: product.business_accounts?.business_name || "Boutique"
          } : null;
          
          return { ...rec, product: enrichedProduct };
        }
        
        // Try to match by name if no ID
        const matchedProduct = availableProducts?.find(
          p => p.name.toLowerCase().includes(rec.productName?.toLowerCase() || "")
        );
        
        // Add vendor from business_accounts
        const enrichedMatchedProduct = matchedProduct ? {
          ...matchedProduct,
          vendor: (matchedProduct as any).business_accounts?.business_name || "Boutique"
        } : null;
        
        return { ...rec, product: enrichedMatchedProduct };
      })
    );

    // Save recommendation to database for analytics
    await supabase.from("gift_recommendations").insert({
      user_id: user.id,
      target_contact_id: contactId || null,
      occasion: occasion || null,
      recommendation_type: "ai_personalized",
      recommended_products: enrichedRecommendations,
      confidence_score: enrichedRecommendations.reduce((acc: number, r: any) => acc + (r.matchScore || 0), 0) / Math.max(enrichedRecommendations.length, 1),
      ai_analysis_summary: { 
        generalAdvice: recommendations.generalAdvice,
        feedbackUsed: {
          acceptedCount: acceptedProducts.length,
          rejectedCount: rejectedProducts.length,
          preferredCategories,
        }
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        recommendations: enrichedRecommendations,
        generalAdvice: recommendations.generalAdvice,
        context: {
          occasion,
          contactName: userContext.contactInfo?.name,
          budget: userContext.budget,
          learningStats: {
            acceptedCount: acceptedProducts.length,
            rejectedCount: rejectedProducts.length,
          }
        }
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[AI Recommendations] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erreur inconnue" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
