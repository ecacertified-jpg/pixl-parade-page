import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InvitationRequest {
  invitee_email: string;
  invitee_phone?: string;
  message?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // Get the authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      console.error("Authentication error:", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const { invitee_email, invitee_phone, message }: InvitationRequest =
      await req.json();

    // Validate email
    if (!invitee_email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(invitee_email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email address" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Get inviter profile
    const { data: inviterProfile } = await supabaseClient
      .from("profiles")
      .select("first_name, last_name, avatar_url")
      .eq("user_id", user.id)
      .single();

    const inviterName = inviterProfile
      ? `${inviterProfile.first_name || ""} ${inviterProfile.last_name || ""}`.trim() || "Un ami"
      : "Un ami";

    // Generate unique invitation token
    const invitationToken = crypto.randomUUID();

    // Create invitation record
    const { data: invitation, error: invitationError } = await supabaseClient
      .from("invitations")
      .insert({
        inviter_id: user.id,
        invitee_email,
        invitee_phone,
        invitation_token: invitationToken,
        message,
      })
      .select()
      .single();

    if (invitationError) {
      console.error("Error creating invitation:", invitationError);
      
      // Check if it's a duplicate invitation
      if (invitationError.code === '23505') {
        return new Response(
          JSON.stringify({ error: "Vous avez déjà invité cette personne" }),
          {
            status: 409,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }
      
      throw invitationError;
    }

    // Create invitation link
    const invitationLink = `https://vaimfeurvzokepqqqrsl.supabase.co/auth?token=${invitationToken}&redirect_to=${encodeURIComponent('https://lovable.dev/projects/your-project')}`;

    // Send invitation email
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: white;
              padding: 30px;
              border: 1px solid #e0e0e0;
              border-top: none;
            }
            .button {
              display: inline-block;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white !important;
              padding: 15px 30px;
              text-decoration: none;
              border-radius: 8px;
              margin: 20px 0;
              font-weight: bold;
            }
            .message-box {
              background: #f8f9fa;
              border-left: 4px solid #667eea;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .footer {
              text-align: center;
              color: #666;
              font-size: 12px;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e0e0e0;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🎉 Invitation à Joie de Vivre</h1>
          </div>
          <div class="content">
            <p>Bonjour !</p>
            <p><strong>${inviterName}</strong> vous invite à rejoindre <strong>Joie de Vivre</strong>, l'application qui célèbre les moments heureux de la vie !</p>
            
            ${message ? `
              <div class="message-box">
                <p><strong>Message personnel :</strong></p>
                <p><em>${message}</em></p>
              </div>
            ` : ''}
            
            <p><strong>Joie de Vivre</strong> vous permet de :</p>
            <ul>
              <li>🎂 Célébrer les anniversaires de vos proches</li>
              <li>🎓 Marquer les réussites académiques</li>
              <li>💼 Fêter les promotions professionnelles</li>
              <li>💑 Commémorer les anniversaires de mariage</li>
              <li>🎁 Participer à des cagnottes collectives</li>
              <li>❤️ Exprimer votre gratitude envers vos proches</li>
            </ul>
            
            <div style="text-align: center;">
              <a href="${invitationLink}" class="button">
                Accepter l'invitation
              </a>
            </div>
            
            <p style="margin-top: 30px; font-size: 14px; color: #666;">
              Ce lien d'invitation est valable pendant 30 jours.
            </p>
          </div>
          <div class="footer">
            <p>Joie de Vivre - Célébrez chaque moment de bonheur</p>
            <p>Si vous n'avez pas demandé cette invitation, vous pouvez ignorer cet email.</p>
          </div>
        </body>
      </html>
    `;

    const { error: emailError } = await resend.emails.send({
      from: "Joie de Vivre <onboarding@resend.dev>",
      to: [invitee_email],
      subject: `${inviterName} vous invite à rejoindre Joie de Vivre 🎉`,
      html: emailHtml,
    });

    if (emailError) {
      console.error("Error sending email:", emailError);
      
      // Delete the invitation if email fails
      await supabaseClient
        .from("invitations")
        .delete()
        .eq("id", invitation.id);
      
      throw emailError;
    }

    console.log("Invitation sent successfully:", {
      invitationId: invitation.id,
      inviteeEmail: invitee_email,
    });

    return new Response(
      JSON.stringify({
        success: true,
        invitation_id: invitation.id,
        message: "Invitation envoyée avec succès",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-invitation function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
