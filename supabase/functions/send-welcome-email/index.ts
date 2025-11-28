import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  user_email: string;
  user_name: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_email, user_name }: WelcomeEmailRequest = await req.json();

    console.log("Sending welcome email to:", user_email, "Name:", user_name);

    const emailResponse = await resend.emails.send({
      from: "JOIE DE VIVRE <onboarding@resend.dev>",
      to: [user_email],
      subject: `Bienvenue ${user_name} ! 🎉`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                margin: 0;
                padding: 0;
                background-color: #f5f5f5;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              }
              .header {
                background: linear-gradient(135deg, #FF6B9D 0%, #C084FC 50%, #60A5FA 100%);
                padding: 40px 30px;
                text-align: center;
              }
              .header h1 {
                color: #ffffff;
                margin: 0;
                font-size: 32px;
                font-weight: bold;
                text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
              }
              .content {
                padding: 40px 30px;
              }
              .greeting {
                font-size: 24px;
                font-weight: 600;
                color: #1a1a1a;
                margin-bottom: 20px;
              }
              .message {
                font-size: 16px;
                color: #555;
                margin-bottom: 30px;
                line-height: 1.8;
              }
              .features {
                background-color: #f9fafb;
                border-radius: 8px;
                padding: 25px;
                margin: 30px 0;
              }
              .feature-item {
                display: flex;
                align-items: start;
                margin-bottom: 20px;
              }
              .feature-item:last-child {
                margin-bottom: 0;
              }
              .feature-icon {
                font-size: 24px;
                margin-right: 15px;
                flex-shrink: 0;
              }
              .feature-text {
                flex: 1;
              }
              .feature-title {
                font-weight: 600;
                color: #1a1a1a;
                margin-bottom: 5px;
              }
              .feature-desc {
                color: #666;
                font-size: 14px;
              }
              .cta-button {
                display: inline-block;
                background: linear-gradient(135deg, #FF6B9D 0%, #C084FC 100%);
                color: #ffffff;
                text-decoration: none;
                padding: 16px 40px;
                border-radius: 8px;
                font-weight: 600;
                font-size: 16px;
                margin: 20px 0;
                box-shadow: 0 4px 12px rgba(255, 107, 157, 0.3);
                transition: all 0.3s ease;
              }
              .cta-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 16px rgba(255, 107, 157, 0.4);
              }
              .footer {
                background-color: #f9fafb;
                padding: 30px;
                text-align: center;
                border-top: 1px solid #e5e7eb;
              }
              .footer-text {
                color: #666;
                font-size: 14px;
                margin: 5px 0;
              }
              .social-links {
                margin-top: 20px;
              }
              .social-links a {
                display: inline-block;
                margin: 0 10px;
                color: #C084FC;
                text-decoration: none;
                font-size: 14px;
              }
            </style>
          </head>
          <body>
            <div style="padding: 20px;">
              <div class="container">
                <div class="header">
                  <h1>🎉 JOIE DE VIVRE</h1>
                </div>
                
                <div class="content">
                  <div class="greeting">
                    Bonjour ${user_name} ! 👋
                  </div>
                  
                  <div class="message">
                    Nous sommes ravis de vous accueillir dans la communauté <strong>JOIE DE VIVRE</strong>, 
                    l'application qui transforme chaque moment de célébration en une expérience inoubliable.
                  </div>
                  
                  <div class="message">
                    Avec JOIE DE VIVRE, célébrez les anniversaires, promotions, mariages et tous les moments 
                    de bonheur avec vos proches de manière unique et mémorable.
                  </div>
                  
                  <div class="features">
                    <div class="feature-item">
                      <div class="feature-icon">🎁</div>
                      <div class="feature-text">
                        <div class="feature-title">Cadeaux Collectifs</div>
                        <div class="feature-desc">Créez des cagnottes pour offrir des cadeaux exceptionnels ensemble</div>
                      </div>
                    </div>
                    
                    <div class="feature-item">
                      <div class="feature-icon">🎂</div>
                      <div class="feature-text">
                        <div class="feature-title">Rappels d'Anniversaires</div>
                        <div class="feature-desc">Ne ratez plus jamais l'anniversaire de vos proches</div>
                      </div>
                    </div>
                    
                    <div class="feature-item">
                      <div class="feature-icon">🛍️</div>
                      <div class="feature-text">
                        <div class="feature-title">Boutique de Cadeaux</div>
                        <div class="feature-desc">Découvrez une sélection de produits pour toutes les occasions</div>
                      </div>
                    </div>
                    
                    <div class="feature-item">
                      <div class="feature-icon">💝</div>
                      <div class="feature-text">
                        <div class="feature-title">Liste de Favoris</div>
                        <div class="feature-desc">Partagez vos envies pour recevoir les cadeaux parfaits</div>
                      </div>
                    </div>
                  </div>
                  
                  <div style="text-align: center;">
                    <a href="https://vaimfeurvzokepqqqrsl.supabase.co" class="cta-button">
                      Commencer mon expérience
                    </a>
                  </div>
                  
                  <div class="message" style="margin-top: 30px; font-size: 14px; color: #666;">
                    <strong>Astuce :</strong> Complétez votre profil et ajoutez vos proches pour recevoir 
                    des notifications personnalisées avant leurs anniversaires.
                  </div>
                </div>
                
                <div class="footer">
                  <p class="footer-text">
                    <strong>JOIE DE VIVRE</strong>
                  </p>
                  <p class="footer-text">
                    L'application qui célèbre chaque moment de bonheur
                  </p>
                  <p class="footer-text" style="margin-top: 20px; font-size: 12px;">
                    Vous recevez cet email car vous venez de créer un compte sur JOIE DE VIVRE.
                  </p>
                  <div class="social-links">
                    <a href="#">Facebook</a>
                    <a href="#">Instagram</a>
                    <a href="#">Twitter</a>
                  </div>
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    console.log("Welcome email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-welcome-email function:", error);
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
