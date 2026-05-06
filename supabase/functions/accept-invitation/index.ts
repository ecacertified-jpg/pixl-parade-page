import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate the invitee
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Authorization header manquant" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    const token = authHeader.replace("Bearer ", "");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) {
      console.error("[accept-invitation] Auth error:", authError?.message);
      return new Response(
        JSON.stringify({ error: "Non authentifié" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { invitation_id } = await req.json();
    if (!invitation_id) {
      return new Response(
        JSON.stringify({ error: "invitation_id requis" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`[accept-invitation] User ${user.id} accepting invitation ${invitation_id}`);

    // Use service role for cross-user operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 1. Fetch and validate the invitation
    const { data: invitation, error: invError } = await supabaseAdmin
      .from("invitations")
      .select("*")
      .eq("id", invitation_id)
      .single();

    if (invError || !invitation) {
      console.error("[accept-invitation] Invitation not found:", invError?.message);
      return new Response(
        JSON.stringify({ error: "Invitation introuvable" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (invitation.status === "accepted") {
      console.log("[accept-invitation] Already accepted");
      return new Response(
        JSON.stringify({ success: true, message: "Invitation déjà acceptée", already_accepted: true }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (invitation.inviter_id === user.id) {
      return new Response(
        JSON.stringify({ error: "Vous ne pouvez pas accepter votre propre invitation" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // 2. Mark invitation as accepted
    await supabaseAdmin
      .from("invitations")
      .update({ status: "accepted", accepted_at: new Date().toISOString() })
      .eq("id", invitation_id);

    // 3. Get both profiles
    const [inviterResult, inviteeResult] = await Promise.all([
      supabaseAdmin.from("profiles").select("first_name, last_name, phone, birthday, avatar_url").eq("user_id", invitation.inviter_id).single(),
      supabaseAdmin.from("profiles").select("first_name, last_name, phone, birthday, avatar_url").eq("user_id", user.id).single(),
    ]);

    const inviterProfile = inviterResult.data;
    const inviteeProfile = inviteeResult.data;

    if (!inviterProfile || !inviteeProfile) {
      console.error("[accept-invitation] Missing profiles:", { inviter: !!inviterProfile, invitee: !!inviteeProfile });
      return new Response(
        JSON.stringify({ success: true, message: "Invitation acceptée, profils incomplets" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // 4. Create bidirectional contacts (check for existing first)
    const inviterName = `${inviterProfile.first_name || ""} ${inviterProfile.last_name || ""}`.trim() || "Ami";
    const inviteeName = `${inviteeProfile.first_name || ""} ${inviteeProfile.last_name || ""}`.trim() || "Ami";

    // Contact for the inviter: the invitee's info
    const { data: existingContactForInviter } = await supabaseAdmin
      .from("contacts")
      .select("id")
      .eq("user_id", invitation.inviter_id)
      .eq("phone", inviteeProfile.phone || "")
      .maybeSingle();

    if (!existingContactForInviter && inviteeProfile.phone) {
      await supabaseAdmin.from("contacts").insert({
        user_id: invitation.inviter_id,
        name: inviteeName,
        phone: inviteeProfile.phone,
        birthday: inviteeProfile.birthday,
        avatar_url: inviteeProfile.avatar_url,
        relationship: "friend",
        linked_user_id: user.id,
      });
      console.log(`[accept-invitation] Created contact for inviter ${invitation.inviter_id} -> invitee ${user.id}`);
    }

    // Contact for the invitee: the inviter's info
    const { data: existingContactForInvitee } = await supabaseAdmin
      .from("contacts")
      .select("id")
      .eq("user_id", user.id)
      .eq("phone", inviterProfile.phone || "")
      .maybeSingle();

    if (!existingContactForInvitee && inviterProfile.phone) {
      await supabaseAdmin.from("contacts").insert({
        user_id: user.id,
        name: inviterName,
        phone: inviterProfile.phone,
        birthday: inviterProfile.birthday,
        avatar_url: inviterProfile.avatar_url,
        relationship: "friend",
        linked_user_id: invitation.inviter_id,
      });
      console.log(`[accept-invitation] Created contact for invitee ${user.id} -> inviter ${invitation.inviter_id}`);
    }

    // The existing triggers (trg_auto_link_contact) will create contact_relationships automatically

    console.log(`[accept-invitation] Success: ${user.id} <-> ${invitation.inviter_id}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Vous êtes maintenant connecté avec ${inviterName} !`,
        inviter_name: inviterName,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("[accept-invitation] Error:", error);
    return new Response(
      JSON.stringify({ error: "Une erreur interne est survenue" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
