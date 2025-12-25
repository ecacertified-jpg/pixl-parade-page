import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InviteRequest {
  waitlist_id: string;
  email: string;
  business_name: string;
  contact_name: string;
  invitation_token: string;
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

    const { waitlist_id, email, business_name, contact_name, invitation_token }: InviteRequest = await req.json();

    if (!email || !invitation_token) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate the invitation URL
    const baseUrl = Deno.env.get("SITE_URL") || "https://joie-de-vivre.lovable.app";
    const invitationUrl = `${baseUrl}/business-auth?invitation=${invitation_token}`;

    // Send email via Resend
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invitation JOIE DE VIVRE</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f0fa;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(122, 93, 199, 0.1);">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #7A5DC7 0%, #C084FC 100%); padding: 40px 30px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">
          🎉 Bienvenue chez JOIE DE VIVRE !
        </h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">
          Votre demande a été approuvée
        </p>
      </div>
      
      <!-- Content -->
      <div style="padding: 40px 30px;">
        <p style="color: #2E2E2E; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
          Bonjour <strong>${contact_name}</strong>,
        </p>
        
        <p style="color: #2E2E2E; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
          Excellente nouvelle ! Votre demande d'inscription pour <strong>${business_name}</strong> 
          sur JOIE DE VIVRE a été approuvée par notre équipe.
        </p>
        
        <p style="color: #2E2E2E; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
          Cliquez sur le bouton ci-dessous pour créer votre compte et accéder à votre 
          <strong>Espace Business</strong> :
        </p>
        
        <!-- CTA Button -->
        <div style="text-align: center; margin: 30px 0;">
          <a href="${invitationUrl}" 
             style="display: inline-block; background: linear-gradient(135deg, #7A5DC7 0%, #9B7BCF 100%); 
                    color: white; text-decoration: none; padding: 16px 40px; border-radius: 12px; 
                    font-size: 16px; font-weight: 600; box-shadow: 0 4px 15px rgba(122, 93, 199, 0.3);">
            Créer mon compte Business
          </a>
        </div>
        
        <div style="background: #f8f5ff; border-radius: 12px; padding: 20px; margin: 30px 0;">
          <h3 style="color: #7A5DC7; margin: 0 0 15px 0; font-size: 16px;">
            ✨ Ce qui vous attend :
          </h3>
          <ul style="color: #2E2E2E; margin: 0; padding-left: 20px; line-height: 1.8;">
            <li>Ajoutez vos produits et gérez votre catalogue</li>
            <li>Recevez des alertes pour les anniversaires de vos clients potentiels</li>
            <li>Bénéficiez des cagnottes collectives créées pour vos produits</li>
            <li>Suivez vos commandes et statistiques en temps réel</li>
          </ul>
        </div>
        
        <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
          Ce lien d'invitation est valable pendant <strong>7 jours</strong>.
        </p>
        
        <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 10px 0 0 0;">
          Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>
          <a href="${invitationUrl}" style="color: #7A5DC7; word-break: break-all;">${invitationUrl}</a>
        </p>
      </div>
      
      <!-- Footer -->
      <div style="background: #f8f5ff; padding: 25px 30px; text-align: center; border-top: 1px solid #e8e2f5;">
        <p style="color: #666; font-size: 14px; margin: 0;">
          L'équipe JOIE DE VIVRE
        </p>
        <p style="color: #999; font-size: 12px; margin: 10px 0 0 0;">
          © ${new Date().getFullYear()} JOIE DE VIVRE - Célébrons ensemble les moments de bonheur
        </p>
      </div>
    </div>
  </div>
</body>
</html>
    `;

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "JOIE DE VIVRE <noreply@joiedevivre.app>",
        to: [email],
        subject: `🎉 ${contact_name}, votre compte Business est prêt !`,
        html: emailHtml,
      }),
    });

    if (!emailRes.ok) {
      const errorText = await emailRes.text();
      console.error("Resend error:", errorText);
      throw new Error(`Failed to send email: ${errorText}`);
    }

    console.log(`Invitation email sent to ${email} for ${business_name}`);

    return new Response(
      JSON.stringify({ success: true, message: "Invitation sent successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in invite-waitlist-business:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
