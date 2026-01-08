import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CONTACT_EMAIL = "contact@joiedevivre-africa.com";

const subjectLabels: Record<string, string> = {
  general: "Question générale",
  technical: "Problème technique",
  suggestion: "Suggestion d'amélioration",
  partnership: "Partenariat / Collaboration",
  other: "Autre",
};

interface ContactRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, subject, message }: ContactRequest = await req.json();

    // Validation
    if (!name || name.trim().length < 2) {
      return new Response(
        JSON.stringify({ error: "Le nom doit contenir au moins 2 caractères" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!email || !email.includes("@")) {
      return new Response(
        JSON.stringify({ error: "Adresse email invalide" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!subject) {
      return new Response(
        JSON.stringify({ error: "Sujet requis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!message || message.trim().length < 10) {
      return new Response(
        JSON.stringify({ error: "Le message doit contenir au moins 10 caractères" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const subjectLabel = subjectLabels[subject] || subject;

    // Send email to team
    console.log("Sending contact email to team...");
    const teamEmailResponse = await resend.emails.send({
      from: "JOIE DE VIVRE <onboarding@resend.dev>",
      to: [CONTACT_EMAIL],
      replyTo: email,
      subject: `[Contact] ${subjectLabel} - ${name}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #7A5DC7, #C084FC); color: white; padding: 30px; border-radius: 12px 12px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border: 1px solid #eee; }
            .field { margin-bottom: 20px; }
            .label { font-weight: bold; color: #7A5DC7; margin-bottom: 5px; }
            .value { background: white; padding: 12px; border-radius: 8px; border-left: 4px solid #7A5DC7; }
            .message-box { background: white; padding: 20px; border-radius: 8px; border: 1px solid #ddd; white-space: pre-wrap; }
            .footer { text-align: center; padding: 20px; color: #888; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">📬 Nouveau message de contact</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">JOIE DE VIVRE</p>
            </div>
            <div class="content">
              <div class="field">
                <div class="label">De</div>
                <div class="value">${name} &lt;${email}&gt;</div>
              </div>
              <div class="field">
                <div class="label">Sujet</div>
                <div class="value">${subjectLabel}</div>
              </div>
              <div class="field">
                <div class="label">Message</div>
                <div class="message-box">${message.replace(/\n/g, "<br>")}</div>
              </div>
            </div>
            <div class="footer">
              <p>Répondre directement à : <a href="mailto:${email}">${email}</a></p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Team email sent:", teamEmailResponse);

    // Send confirmation email to user
    console.log("Sending confirmation email to user...");
    const userEmailResponse = await resend.emails.send({
      from: "JOIE DE VIVRE <onboarding@resend.dev>",
      to: [email],
      subject: "Nous avons bien reçu votre message !",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #7A5DC7, #C084FC); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
            .content { background: #f9f9f9; padding: 30px; border: 1px solid #eee; }
            .summary { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #7A5DC7; }
            .footer { text-align: center; padding: 20px; color: #888; font-size: 12px; }
            .btn { display: inline-block; background: #7A5DC7; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 15px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">✨ Merci pour votre message !</h1>
            </div>
            <div class="content">
              <p>Bonjour <strong>${name}</strong>,</p>
              <p>Nous avons bien reçu votre message concernant "<strong>${subjectLabel}</strong>".</p>
              
              <div class="summary">
                <p style="margin: 0;"><strong>Votre message :</strong></p>
                <p style="margin: 10px 0 0 0; color: #666;">${message.replace(/\n/g, "<br>")}</p>
              </div>
              
              <p>Notre équipe vous répondra dans les plus brefs délais, généralement sous 24 à 48 heures.</p>
              
              <p>Cordialement,<br><strong>L'équipe JOIE DE VIVRE</strong></p>
            </div>
            <div class="footer">
              <p>© 2026 JOIE DE VIVRE - Célébrez les moments de bonheur</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("User confirmation email sent:", userEmailResponse);

    return new Response(
      JSON.stringify({ success: true, message: "Emails envoyés avec succès" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-contact-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
