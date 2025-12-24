import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RejectionEmailRequest {
  business_email: string;
  business_name: string;
  rejection_reason: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { business_email, business_name, rejection_reason }: RejectionEmailRequest = await req.json();

    console.log("Sending rejection email to:", business_email);

    const emailResponse = await resend.emails.send({
      from: "JOIE DE VIVRE <noreply@joiedevivre-africa.com>",
      to: [business_email],
      subject: "Concernant votre demande d'inscription business",
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
                background: linear-gradient(135deg, #64748b 0%, #475569 100%);
                padding: 40px 30px;
                text-align: center;
              }
              .header h1 {
                color: #ffffff;
                margin: 0;
                font-size: 28px;
                font-weight: bold;
                text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
              }
              .content {
                padding: 40px 30px;
              }
              .greeting {
                font-size: 20px;
                font-weight: 600;
                color: #1a1a1a;
                margin-bottom: 20px;
              }
              .message {
                font-size: 16px;
                color: #555;
                margin-bottom: 20px;
                line-height: 1.8;
              }
              .reason-box {
                background-color: #fef2f2;
                border-left: 4px solid #ef4444;
                padding: 20px;
                margin: 25px 0;
                border-radius: 4px;
              }
              .reason-title {
                font-weight: 600;
                color: #dc2626;
                margin-bottom: 10px;
                font-size: 15px;
              }
              .reason-text {
                color: #7f1d1d;
                font-size: 15px;
                line-height: 1.6;
              }
              .next-steps {
                background-color: #f0f9ff;
                border-left: 4px solid #3b82f6;
                padding: 20px;
                margin: 25px 0;
                border-radius: 4px;
              }
              .next-steps-title {
                font-weight: 600;
                color: #1e40af;
                margin-bottom: 10px;
                font-size: 15px;
              }
              .next-steps-text {
                color: #1e3a8a;
                font-size: 14px;
                line-height: 1.6;
              }
              .cta-button {
                display: inline-block;
                background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                color: #ffffff;
                text-decoration: none;
                padding: 14px 32px;
                border-radius: 8px;
                font-weight: 600;
                font-size: 15px;
                margin: 20px 0;
                box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
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
            </style>
          </head>
          <body>
            <div style="padding: 20px;">
              <div class="container">
                <div class="header">
                  <h1>JOIE DE VIVRE</h1>
                </div>
                
                <div class="content">
                  <div class="greeting">
                    Bonjour ${business_name},
                  </div>
                  
                  <div class="message">
                    Nous vous remercions de l'intérêt que vous portez à <strong>JOIE DE VIVRE</strong> 
                    et d'avoir soumis votre demande d'inscription en tant que prestataire business.
                  </div>
                  
                  <div class="message">
                    Après examen attentif de votre dossier, nous sommes au regret de vous informer que 
                    nous ne pouvons pas donner suite favorable à votre demande pour le moment.
                  </div>
                  
                  <div class="reason-box">
                    <div class="reason-title">📋 Motif du refus :</div>
                    <div class="reason-text">${rejection_reason}</div>
                  </div>
                  
                  <div class="next-steps">
                    <div class="next-steps-title">💡 Prochaines étapes :</div>
                    <div class="next-steps-text">
                      • Vous pouvez corriger les points mentionnés ci-dessus<br>
                      • Une nouvelle demande peut être soumise après avoir apporté les modifications nécessaires<br>
                      • Notre équipe reste à votre disposition pour toute question
                    </div>
                  </div>
                  
                  <div class="message">
                    Si vous avez des questions concernant cette décision ou si vous souhaitez obtenir 
                    plus d'informations, n'hésitez pas à nous contacter. Nous serons ravis de vous accompagner 
                    dans l'amélioration de votre dossier.
                  </div>
                  
                  <div style="text-align: center;">
                    <a href="https://vaimfeurvzokepqqqrsl.supabase.co/business-auth" class="cta-button">
                      Soumettre une nouvelle demande
                    </a>
                  </div>
                  
                  <div class="message" style="margin-top: 30px; font-size: 14px; color: #666;">
                    Nous vous remercions de votre compréhension et espérons avoir l'opportunité 
                    de collaborer avec vous prochainement.
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
                    Pour toute question, contactez-nous à support@joiedevivre.com
                  </p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    console.log("Rejection email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-business-rejection-email function:", error);
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
