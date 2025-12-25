import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WaitlistEntry {
  email: string;
  business_name: string;
  business_type?: string;
  contact_first_name: string;
  contact_last_name: string;
  city?: string;
  motivation?: string;
  phone?: string;
  position: number;
}

const businessTypeLabels: Record<string, string> = {
  bakery: 'Pâtisserie / Boulangerie',
  florist: 'Fleuriste',
  jewelry: 'Bijouterie',
  fashion: 'Mode / Vêtements',
  beauty: 'Beauté / Spa',
  restaurant: 'Restaurant / Traiteur',
  electronics: 'Électronique',
  home_decor: 'Décoration / Maison',
  toys: 'Jouets / Enfants',
  experiences: 'Expériences / Activités',
  other: 'Autre',
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { waitlist_entry } = await req.json() as { waitlist_entry: WaitlistEntry };
    
    console.log("Received waitlist registration notification request:", waitlist_entry);

    if (!waitlist_entry || !waitlist_entry.email || !waitlist_entry.business_name) {
      throw new Error("Missing required waitlist entry data");
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch all active super admins with their emails
    const { data: superAdmins, error: adminsError } = await supabaseAdmin
      .from("admin_users")
      .select(`
        user_id,
        role
      `)
      .eq("role", "super_admin")
      .eq("is_active", true);

    if (adminsError) {
      console.error("Error fetching super admins:", adminsError);
      throw adminsError;
    }

    if (!superAdmins || superAdmins.length === 0) {
      console.log("No active super admins found");
      return new Response(
        JSON.stringify({ success: true, message: "No super admins to notify" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get emails from auth.users for each super admin
    const adminEmails: string[] = [];
    for (const admin of superAdmins) {
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(admin.user_id);
      if (!userError && userData?.user?.email) {
        adminEmails.push(userData.user.email);
      }
    }

    if (adminEmails.length === 0) {
      console.log("No super admin emails found");
      return new Response(
        JSON.stringify({ success: true, message: "No super admin emails found" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Found ${adminEmails.length} super admin(s) to notify:`, adminEmails);

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      throw new Error("Email service not configured");
    }

    const resend = new Resend(resendApiKey);
    const businessTypeLabel = waitlist_entry.business_type 
      ? businessTypeLabels[waitlist_entry.business_type] || waitlist_entry.business_type 
      : 'Non spécifié';

    const adminDashboardUrl = `${Deno.env.get("SITE_URL") || "https://joiedevivre-africa.com"}/admin/waitlist`;

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f3ff;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #7A5DC7 0%, #C084FC 100%); padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px;">🏪 Nouvelle inscription</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Liste d'attente prestataires</p>
    </div>
    
    <!-- Content -->
    <div style="background: white; padding: 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 20px rgba(122, 93, 199, 0.1);">
      <p style="color: #374151; font-size: 16px; margin-bottom: 20px;">
        Un nouveau prestataire vient de s'inscrire sur la liste d'attente de JOIE DE VIVRE :
      </p>
      
      <!-- Business Info Card -->
      <div style="background: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
        <h2 style="color: #7A5DC7; margin: 0 0 15px 0; font-size: 20px;">${waitlist_entry.business_name}</h2>
        
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Contact</td>
            <td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right; font-weight: 500;">
              ${waitlist_entry.contact_first_name} ${waitlist_entry.contact_last_name}
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Email</td>
            <td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right;">
              <a href="mailto:${waitlist_entry.email}" style="color: #7A5DC7; text-decoration: none;">${waitlist_entry.email}</a>
            </td>
          </tr>
          ${waitlist_entry.phone ? `
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Téléphone</td>
            <td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right;">${waitlist_entry.phone}</td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Type d'activité</td>
            <td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right;">${businessTypeLabel}</td>
          </tr>
          ${waitlist_entry.city ? `
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Ville</td>
            <td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right;">${waitlist_entry.city}</td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Position</td>
            <td style="padding: 8px 0; color: #7A5DC7; font-size: 14px; text-align: right; font-weight: 600;">#${waitlist_entry.position}</td>
          </tr>
        </table>
      </div>
      
      ${waitlist_entry.motivation ? `
      <!-- Motivation -->
      <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin-bottom: 20px; border-radius: 0 8px 8px 0;">
        <p style="color: #92400e; font-size: 12px; margin: 0 0 5px 0; text-transform: uppercase; font-weight: 600;">Motivation</p>
        <p style="color: #451a03; font-size: 14px; margin: 0; line-height: 1.5;">${waitlist_entry.motivation}</p>
      </div>
      ` : ''}
      
      <!-- CTA Button -->
      <div style="text-align: center; margin-top: 25px;">
        <a href="${adminDashboardUrl}" style="display: inline-block; background: linear-gradient(135deg, #7A5DC7 0%, #9333ea 100%); color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
          Voir la liste d'attente
        </a>
      </div>
    </div>
    
    <!-- Footer -->
    <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
      <p style="margin: 0;">JOIE DE VIVRE - Plateforme de cadeaux collaboratifs</p>
      <p style="margin: 5px 0 0 0;">Cet email a été envoyé automatiquement suite à une inscription.</p>
    </div>
  </div>
</body>
</html>
    `;

    // Send email to all super admins
    const emailResponse = await resend.emails.send({
      from: "JOIE DE VIVRE <noreply@joiedevivre-africa.com>",
      to: adminEmails,
      subject: `🏪 Nouvelle inscription - ${waitlist_entry.business_name}`,
      html: emailHtml,
    });

    console.log("Email sent successfully to super admins:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Notification sent to ${adminEmails.length} super admin(s)`,
        emailId: emailResponse.id 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error in notify-waitlist-registration:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
