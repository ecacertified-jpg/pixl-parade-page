import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendWebPushNotification } from "../_shared/web-push.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BirthdayOpportunity {
  userId: string;
  userName: string;
  userAvatar: string | null;
  birthday: string;
  daysUntil: number;
  wishlistProducts: Array<{
    productId: string;
    productName: string;
    businessId: string;
    businessName: string;
    price: number;
  }>;
}

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

// Helper function to send push notification
async function sendPushNotificationDirect(
  subscription: PushSubscription,
  payload: {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    tag?: string;
    requireInteraction?: boolean;
    data?: Record<string, any>;
  }
): Promise<boolean> {
  const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY') || '';
  const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY') || '';
  const vapidEmail = Deno.env.get('VAPID_EMAIL') || 'contact@joiedevivre.app';

  if (!vapidPublicKey || !vapidPrivateKey) {
    console.error('❌ VAPID keys not configured');
    return false;
  }

  const result = await sendWebPushNotification(
    {
      endpoint: subscription.endpoint,
      keys: subscription.keys,
    },
    JSON.stringify(payload),
    vapidPublicKey,
    vapidPrivateKey,
    `mailto:${vapidEmail}`
  );

  return result.success;
}

// Get email template based on priority
function getEmailTemplate(
  priority: string,
  businessName: string,
  userName: string,
  daysUntil: number,
  productCount: number
): { subject: string; html: string } {
  const priorityStyles = {
    critical: {
      emoji: '🚨',
      headerBg: 'linear-gradient(135deg, #DC2626, #EF4444)',
      urgencyText: 'CRITIQUE',
      urgencyColor: '#DC2626',
      animation: 'animation: pulse 2s infinite;',
      pulseStyle: `
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
      `
    },
    urgent: {
      emoji: '⚡',
      headerBg: 'linear-gradient(135deg, #EA580C, #F97316)',
      urgencyText: 'URGENT',
      urgencyColor: '#EA580C',
      animation: '',
      pulseStyle: ''
    },
    high: {
      emoji: '🎂',
      headerBg: 'linear-gradient(135deg, #7A5DC7, #C084FC)',
      urgencyText: '',
      urgencyColor: '#7A5DC7',
      animation: '',
      pulseStyle: ''
    }
  };

  const style = priorityStyles[priority as keyof typeof priorityStyles] || priorityStyles.high;
  
  const urgencyBadge = style.urgencyText ? `
    <span style="background: ${style.urgencyColor}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; margin-left: 10px;">
      ${style.urgencyText}
    </span>
  ` : '';

  const productText = productCount > 1 
    ? `${productCount} de vos produits sont dans sa liste de souhaits` 
    : `Un de vos produits est dans sa liste de souhaits`;

  const subject = priority === 'critical'
    ? `🚨 URGENT: Anniversaire de ${userName} dans ${daysUntil} jours - ${productCount} produit(s) en wishlist !`
    : priority === 'urgent'
    ? `⚡ Opportunité urgente - Anniversaire de ${userName} dans ${daysUntil} jours !`
    : `🎂 Opportunité cadeau - Anniversaire de ${userName} dans ${daysUntil} jours !`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        ${style.pulseStyle}
      </style>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f4f5;">
      <div style="font-family: 'Poppins', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); ${style.animation}">
          <!-- Header -->
          <div style="background: ${style.headerBg}; color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">
              ${style.emoji} Opportunité Cadeau ! ${urgencyBadge}
            </h1>
            ${priority === 'critical' ? `
              <p style="margin: 15px 0 0 0; font-size: 14px; opacity: 0.9;">
                Action recommandée immédiatement !
              </p>
            ` : ''}
          </div>
          
          <!-- Content -->
          <div style="padding: 30px;">
            <p style="font-size: 16px; color: #333;">Bonjour <strong>${businessName}</strong>,</p>
            
            <p style="font-size: 16px; color: #333; line-height: 1.6;">
              ${priority === 'critical' ? '🔥 Excellente nouvelle !' : 'Bonne nouvelle !'} 
              <strong>${userName}</strong> a ajouté ${productText}, et son anniversaire est 
              <strong style="color: ${style.urgencyColor};">dans ${daysUntil} jours</strong> !
            </p>
            
            ${priority === 'critical' || priority === 'urgent' ? `
              <div style="background: #FEF3C7; border-left: 4px solid ${style.urgencyColor}; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                <p style="margin: 0; color: #92400E; font-weight: 500;">
                  ${priority === 'critical' 
                    ? `⚡ Avec ${productCount} produits en wishlist, c'est une opportunité rare ! Agissez vite.`
                    : '💡 Cette personne a plusieurs de vos produits en favoris. Une cagnotte augmenterait vos chances de vente.'}
                </p>
              </div>
            ` : ''}
            
            <div style="background: ${style.headerBg}; color: white; padding: 25px; border-radius: 12px; text-align: center; margin: 25px 0;">
              <h2 style="margin: 0; font-size: 22px;">Créez une cagnotte maintenant</h2>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">et notifiez tous ses amis pour qu'ils participent !</p>
            </div>
            
            <p style="font-size: 15px; color: #555;">En créant une cagnotte, vous :</p>
            <ul style="color: #555; line-height: 1.8;">
              <li>✅ Facilitez l'achat groupé pour les proches de ${userName}</li>
              <li>✅ Augmentez vos chances de vente</li>
              <li>✅ Créez une expérience de don mémorable</li>
              ${priority === 'critical' ? '<li>✅ Profitez d\'une opportunité rare avec plusieurs produits en wishlist</li>' : ''}
            </ul>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="https://joiedevivre.lovable.app/business-dashboard?tab=products" 
                 style="display: inline-block; background: ${style.urgencyColor}; color: white; padding: 16px 40px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; ${style.animation}">
                ${priority === 'critical' ? '🚀 Agir maintenant' : 'Voir l\'opportunité'}
              </a>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              Cet email a été envoyé par JOIE DE VIVRE. © ${new Date().getFullYear()}
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return { subject, html };
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🎂 Starting birthday opportunity detection...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Trouver les utilisateurs dont l'anniversaire est dans 15 jours
    const today = new Date();
    const targetDate = new Date(today);
    targetDate.setDate(targetDate.getDate() + 15);
    
    const targetMonth = targetDate.getMonth() + 1;
    const targetDay = targetDate.getDate();
    
    console.log(`📅 Looking for birthdays on ${targetMonth}/${targetDay}`);
    
    // Récupérer les profils avec anniversaire ce jour-là
    const { data: birthdayProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, first_name, last_name, avatar_url, birthday')
      .not('birthday', 'is', null);
    
    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      throw profilesError;
    }

    // Filtrer les profils dont l'anniversaire tombe le bon jour
    const matchingProfiles = (birthdayProfiles || []).filter(profile => {
      if (!profile.birthday) return false;
      const bday = new Date(profile.birthday);
      return bday.getMonth() + 1 === targetMonth && bday.getDate() === targetDay;
    });

    console.log(`👥 Found ${matchingProfiles.length} profiles with birthdays in 15 days`);

    const opportunities: BirthdayOpportunity[] = [];
    const alertsToCreate: any[] = [];

    for (const profile of matchingProfiles) {
      const userName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Utilisateur';
      
      // 2. Vérifier qu'aucune cagnotte active n'existe pour cet utilisateur
      const { data: existingFunds, error: fundsError } = await supabase
        .from('collective_funds')
        .select('id')
        .or(`creator_id.eq.${profile.user_id}`)
        .in('status', ['active', 'pending'])
        .gte('deadline_date', today.toISOString());

      if (fundsError) {
        console.error(`Error checking funds for ${profile.user_id}:`, fundsError);
        continue;
      }

      // Vérifier aussi les cagnottes où l'utilisateur est bénéficiaire via business_collective_funds
      const { data: beneficiaryFunds } = await supabase
        .from('business_collective_funds')
        .select('fund_id, collective_funds!inner(status)')
        .eq('beneficiary_user_id', profile.user_id);

      const hasActiveFund = (existingFunds && existingFunds.length > 0) || 
                            (beneficiaryFunds && beneficiaryFunds.some(f => 
                              (f.collective_funds as any)?.status === 'active'));

      if (hasActiveFund) {
        console.log(`⏭️ Skipping ${userName}: already has an active fund`);
        continue;
      }

      // 3. Récupérer la wishlist de l'utilisateur
      const { data: favorites, error: favError } = await supabase
        .from('favorites')
        .select(`
          product_id,
          products:product_id (
            id,
            name,
            price,
            business_owner_id,
            business_account_id
          )
        `)
        .eq('user_id', profile.user_id);

      if (favError) {
        console.error(`Error fetching favorites for ${profile.user_id}:`, favError);
        continue;
      }

      if (!favorites || favorites.length === 0) {
        console.log(`⏭️ Skipping ${userName}: no wishlist products`);
        continue;
      }

      // Construire la liste des produits avec infos business
      const wishlistProducts: BirthdayOpportunity['wishlistProducts'] = [];
      
      for (const fav of favorites) {
        const product = fav.products as any;
        if (!product || !product.business_account_id) continue;

        // Récupérer les infos du business
        const { data: business } = await supabase
          .from('business_accounts')
          .select('id, business_name, is_active, is_verified')
          .eq('id', product.business_account_id)
          .eq('is_active', true)
          .single();

        if (business) {
          wishlistProducts.push({
            productId: product.id,
            productName: product.name,
            businessId: business.id,
            businessName: business.business_name,
            price: product.price
          });
        }
      }

      if (wishlistProducts.length === 0) {
        console.log(`⏭️ Skipping ${userName}: no valid business products in wishlist`);
        continue;
      }

      console.log(`✅ Found opportunity for ${userName} with ${wishlistProducts.length} products`);

      opportunities.push({
        userId: profile.user_id,
        userName,
        userAvatar: profile.avatar_url,
        birthday: profile.birthday,
        daysUntil: 15,
        wishlistProducts
      });

      // 4. Créer des alertes pour chaque commerçant concerné
      const businessIds = [...new Set(wishlistProducts.map(p => p.businessId))];
      
      for (const businessId of businessIds) {
        const productsForBusiness = wishlistProducts.filter(p => p.businessId === businessId);
        const primaryProduct = productsForBusiness[0];

        // Vérifier si une alerte existe déjà
        const birthdayDateStr = targetDate.toISOString().split('T')[0];
        
        const { data: existingAlert } = await supabase
          .from('business_birthday_alerts')
          .select('id')
          .eq('business_id', businessId)
          .eq('target_user_id', profile.user_id)
          .eq('birthday_date', birthdayDateStr)
          .single();

        if (existingAlert) {
          console.log(`⏭️ Alert already exists for business ${businessId} and user ${profile.user_id}`);
          continue;
        }

        // Déterminer la priorité
        let priority = 'high';
        if (productsForBusiness.length >= 3) priority = 'urgent';
        if (productsForBusiness.length >= 5) priority = 'critical';

        alertsToCreate.push({
          business_id: businessId,
          target_user_id: profile.user_id,
          product_id: primaryProduct.productId,
          target_user_name: userName,
          target_user_avatar: profile.avatar_url,
          days_until_birthday: 15,
          birthday_date: birthdayDateStr,
          status: 'pending',
          priority,
          expires_at: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000).toISOString(),
          _productsCount: productsForBusiness.length // Temporary field for notification
        });
      }
    }

    // 5. Insérer les alertes
    if (alertsToCreate.length > 0) {
      // Remove temporary fields before insert
      const alertsForDb = alertsToCreate.map(({ _productsCount, ...alert }) => alert);
      
      const { error: insertError } = await supabase
        .from('business_birthday_alerts')
        .insert(alertsForDb);

      if (insertError) {
        console.error('Error inserting alerts:', insertError);
        throw insertError;
      }

      console.log(`📬 Created ${alertsToCreate.length} birthday alerts`);
    }

    // 6. Envoyer des notifications aux commerçants
    let pushNotificationsSent = 0;
    let emailsSent = 0;

    for (const alert of alertsToCreate) {
      // Récupérer l'email et user_id du commerçant
      const { data: business } = await supabase
        .from('business_accounts')
        .select('user_id, business_name, email')
        .eq('id', alert.business_id)
        .single();

      if (!business) continue;

      // Notification title/message based on priority
      const notifTitle = alert.priority === 'critical'
        ? '🚨 Opportunité CRITIQUE !'
        : alert.priority === 'urgent'
        ? '⚡ Opportunité urgente !'
        : '🎂 Opportunité cadeau !';

      const notifMessage = alert.priority === 'critical'
        ? `L'anniversaire de ${alert.target_user_name} est dans ${alert.days_until_birthday} jours. ${alert._productsCount} de vos produits sont dans sa wishlist ! Agissez maintenant !`
        : alert.priority === 'urgent'
        ? `L'anniversaire de ${alert.target_user_name} est dans ${alert.days_until_birthday} jours. ${alert._productsCount} produits en wishlist !`
        : `L'anniversaire de ${alert.target_user_name} est dans ${alert.days_until_birthday} jours. Un de vos produits est dans sa wishlist !`;

      // Créer une notification in-app
      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: business.user_id,
          title: notifTitle,
          message: notifMessage,
          type: 'birthday_opportunity',
          action_url: '/business-dashboard?tab=products',
          metadata: {
            alert_id: alert.id,
            target_user: alert.target_user_name,
            product_id: alert.product_id,
            days_until: alert.days_until_birthday,
            priority: alert.priority,
            products_count: alert._productsCount
          }
        });

      if (notifError) {
        console.error(`Error creating notification for business ${business.business_name}:`, notifError);
      }

      // 6.1 Envoyer une push notification pour les alertes critiques/urgentes
      if (alert.priority === 'critical' || alert.priority === 'urgent') {
        console.log(`📱 Sending push notification for ${alert.priority} alert to business ${business.business_name}`);
        
        // Récupérer les push subscriptions du business owner
        const { data: pushSubs, error: pushSubsError } = await supabase
          .from('push_subscriptions')
          .select('*')
          .eq('user_id', business.user_id)
          .eq('is_active', true);

        if (pushSubsError) {
          console.error(`Error fetching push subscriptions for ${business.user_id}:`, pushSubsError);
        } else if (pushSubs && pushSubs.length > 0) {
          for (const sub of pushSubs) {
            try {
              const pushPayload = {
                title: notifTitle,
                body: notifMessage,
                icon: '/pwa-192x192.png',
                badge: '/pwa-192x192.png',
                tag: `birthday-opportunity-${alert.target_user_id}`,
                requireInteraction: true,
                data: {
                  type: 'birthday_opportunity',
                  priority: alert.priority,
                  url: '/business-dashboard?tab=products',
                  alert_id: alert.id
                }
              };

              const subscription: PushSubscription = {
                endpoint: sub.endpoint,
                keys: {
                  p256dh: sub.p256dh,
                  auth: sub.auth
                }
              };

              const success = await sendPushNotificationDirect(subscription, pushPayload);
              if (success) {
                pushNotificationsSent++;
                console.log(`✅ Push notification sent to ${business.business_name}`);
              }
            } catch (pushError) {
              console.error(`Error sending push to ${business.business_name}:`, pushError);
            }
          }
        } else {
          console.log(`⏭️ No active push subscriptions for business ${business.business_name}`);
        }
      }

      // 6.2 Envoyer un email avec template différencié par priorité
      if (business.email) {
        const resendApiKey = Deno.env.get('RESEND_API_KEY');
        if (resendApiKey) {
          try {
            const { subject, html } = getEmailTemplate(
              alert.priority,
              business.business_name,
              alert.target_user_name,
              alert.days_until_birthday,
              alert._productsCount
            );

            const emailResponse = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${resendApiKey}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                from: 'JOIE DE VIVRE <noreply@joiedevivre-africa.com>',
                to: [business.email],
                subject,
                html
              })
            });

            if (!emailResponse.ok) {
              console.error('Error sending email:', await emailResponse.text());
            } else {
              emailsSent++;
              console.log(`📧 ${alert.priority.toUpperCase()} email sent to ${business.email}`);
            }
          } catch (emailError) {
            console.error('Email sending error:', emailError);
          }
        }
      }
    }

    console.log(`🎉 Birthday opportunity detection complete.`);
    console.log(`   📊 ${opportunities.length} opportunities found`);
    console.log(`   📬 ${alertsToCreate.length} alerts created`);
    console.log(`   📱 ${pushNotificationsSent} push notifications sent`);
    console.log(`   📧 ${emailsSent} emails sent`);

    return new Response(
      JSON.stringify({
        success: true,
        opportunities: opportunities.length,
        alertsCreated: alertsToCreate.length,
        pushNotificationsSent,
        emailsSent,
        message: `Found ${opportunities.length} birthday opportunities, created ${alertsToCreate.length} alerts, sent ${pushNotificationsSent} push notifications and ${emailsSent} emails`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in notify-business-birthday-opportunity:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
