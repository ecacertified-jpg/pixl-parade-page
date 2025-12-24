import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ApprovalEmailRequest {
  business_email: string;
  business_name: string;
  business_type: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { business_email, business_name, business_type }: ApprovalEmailRequest = await req.json();

    console.log(`Sending approval email to ${business_email} for ${business_name}`);

    const emailResponse = await resend.emails.send({
      from: "JOIE DE VIVRE <noreply@joiedevivre-africa.com>",
      to: [business_email],
      subject: `✨ Félicitations ${business_name} ! Votre compte est approuvé`,
      html: `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f8f9fa;
            }
            .container {
              background-color: #ffffff;
              border-radius: 12px;
              padding: 40px;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .logo {
              font-size: 32px;
              font-weight: bold;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
              margin-bottom: 10px;
            }
            .title {
              font-size: 24px;
              font-weight: 600;
              color: #1a1a1a;
              margin: 20px 0;
            }
            .content {
              font-size: 16px;
              color: #555;
              margin-bottom: 30px;
            }
            .features {
              background-color: #f8f9fa;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
            }
            .feature-item {
              display: flex;
              align-items: start;
              margin: 15px 0;
            }
            .feature-icon {
              font-size: 24px;
              margin-right: 12px;
            }
            .feature-text {
              flex: 1;
            }
            .feature-title {
              font-weight: 600;
              color: #1a1a1a;
              margin-bottom: 4px;
            }
            .cta-button {
              display: inline-block;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: #ffffff !important;
              text-decoration: none;
              padding: 14px 32px;
              border-radius: 8px;
              font-weight: 600;
              font-size: 16px;
              text-align: center;
              margin: 20px 0;
            }
            .cta-button:hover {
              opacity: 0.9;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #e0e0e0;
              text-align: center;
              font-size: 14px;
              color: #888;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🎉 JOIE DE VIVRE</div>
              <h1 class="title">Félicitations ${business_name} ! 🎊</h1>
            </div>
            
            <div class="content">
              <p>Nous sommes ravis de vous annoncer que votre compte prestataire <strong>${business_name}</strong> (${business_type}) a été officiellement approuvé !</p>
              
              <p>Vous faites maintenant partie de la famille JOIE DE VIVRE, la plateforme qui célèbre les moments de bonheur.</p>
            </div>

            <div class="features">
              <p style="font-weight: 600; margin-bottom: 15px;">Vous pouvez maintenant :</p>
              
              <div class="feature-item">
                <div class="feature-icon">📦</div>
                <div class="feature-text">
                  <div class="feature-title">Gérer vos produits</div>
                  <div>Ajoutez, modifiez et organisez votre catalogue</div>
                </div>
              </div>
              
              <div class="feature-item">
                <div class="feature-icon">🎁</div>
                <div class="feature-text">
                  <div class="feature-title">Recevoir des commandes</div>
                  <div>Recevez des notifications pour chaque nouvelle commande</div>
                </div>
              </div>
              
              <div class="feature-item">
                <div class="feature-icon">💰</div>
                <div class="feature-text">
                  <div class="feature-title">Suivre vos ventes</div>
                  <div>Accédez à votre tableau de bord avec statistiques détaillées</div>
                </div>
              </div>
              
              <div class="feature-item">
                <div class="feature-icon">🤝</div>
                <div class="feature-text">
                  <div class="feature-title">Créer des cagnottes collectives</div>
                  <div>Proposez des cadeaux groupés pour vos clients</div>
                </div>
              </div>
            </div>

            <div style="text-align: center;">
              <a href="https://your-app-url.com/business-account" class="cta-button">
                🚀 Accéder à Mon Espace Business
              </a>
            </div>

            <div class="content">
              <p>Notre équipe est là pour vous accompagner. N'hésitez pas à nous contacter si vous avez des questions.</p>
              <p><strong>Bienvenue chez JOIE DE VIVRE ! 🎉</strong></p>
            </div>

            <div class="footer">
              <p>
                Cet email a été envoyé par <strong>JOIE DE VIVRE</strong><br>
                La plateforme qui célèbre vos moments de bonheur
              </p>
              <p style="margin-top: 10px;">
                📧 support@joiedevivre.com | 📱 +225 XX XX XX XX XX
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Approval email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-business-approval-email function:", error);
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
