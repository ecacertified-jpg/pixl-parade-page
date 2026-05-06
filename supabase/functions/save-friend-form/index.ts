import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface FriendFormData {
  token: string;
  name: string;
  phone: string;
  relation: string;
  birthday: string;
  city?: string;
  neighborhood?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const body: FriendFormData = await req.json();
    const { token, name, phone, relation, birthday, city, neighborhood, location, latitude, longitude } = body;

    // Validate required fields
    if (!token || !name || !phone || !birthday) {
      return new Response(
        JSON.stringify({ error: "Champs obligatoires manquants" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate phone format
    if (!/^[0-9+\-\s()]{6,20}$/.test(phone)) {
      return new Response(
        JSON.stringify({ error: "Format de téléphone invalide" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // PARALLEL: Token lookup + profile prefetch (we'll need user_id from token first)
    const { data: tokenData, error: tokenError } = await supabaseAdmin
      .from("friend_form_tokens")
      .select("*")
      .eq("token", token)
      .single();

    if (tokenError || !tokenData) {
      return new Response(
        JSON.stringify({ error: "Lien invalide ou expiré" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (tokenData.status === "completed") {
      return new Response(
        JSON.stringify({ error: "Ce formulaire a déjà été rempli" }),
        { status: 409, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (new Date(tokenData.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: "Ce lien a expiré" }),
        { status: 410, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Ensure profile exists (upsert pattern - faster than select+insert)
    await supabaseAdmin
      .from("profiles")
      .upsert({ user_id: tokenData.user_id }, { onConflict: "user_id", ignoreDuplicates: true });

    // PARALLEL: Insert contact + mark token as completed
    const [contactResult, _tokenUpdate] = await Promise.all([
      supabaseAdmin
        .from("contacts")
        .insert({
          user_id: tokenData.user_id,
          name: name.trim().substring(0, 100),
          phone: phone.trim().substring(0, 20),
          relationship: relation || tokenData.prefilled_relation || "ami",
          birthday,
          city: city?.trim(),
          neighborhood: neighborhood?.trim(),
          location: location?.trim(),
          latitude,
          longitude,
        }),
      supabaseAdmin
        .from("friend_form_tokens")
        .update({ status: "completed" })
        .eq("id", tokenData.id),
    ]);

    if (contactResult.error) {
      console.error("Error inserting contact:", contactResult.error);
      return new Response(
        JSON.stringify({ error: "Erreur lors de l'enregistrement" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Contact ajouté avec succès !" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in save-friend-form:", error);
    return new Response(
      JSON.stringify({ error: "Une erreur interne est survenue" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
