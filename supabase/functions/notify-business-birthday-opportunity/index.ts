import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
          expires_at: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000).toISOString() // Expire le jour de l'anniversaire
        });
      }
    }

    // 5. Insérer les alertes
    if (alertsToCreate.length > 0) {
      const { error: insertError } = await supabase
        .from('business_birthday_alerts')
        .insert(alertsToCreate);

      if (insertError) {
        console.error('Error inserting alerts:', insertError);
        throw insertError;
      }

      console.log(`📬 Created ${alertsToCreate.length} birthday alerts`);
    }

    // 6. Envoyer des notifications aux commerçants
    for (const alert of alertsToCreate) {
      // Récupérer l'email du commerçant
      const { data: business } = await supabase
        .from('business_accounts')
        .select('user_id, business_name, email')
        .eq('id', alert.business_id)
        .single();

      if (!business) continue;

      // Créer une notification in-app
      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: business.user_id,
          title: '🎂 Opportunité cadeau !',
          message: `L'anniversaire de ${alert.target_user_name} est dans ${alert.days_until_birthday} jours. Un de vos produits est dans sa wishlist !`,
          type: 'birthday_opportunity',
          action_url: '/business-dashboard?tab=products',
          metadata: {
            alert_id: alert.id,
            target_user: alert.target_user_name,
            product_id: alert.product_id,
            days_until: alert.days_until_birthday,
            priority: alert.priority
          }
        });

      if (notifError) {
        console.error(`Error creating notification for business ${business.business_name}:`, notifError);
      }

      // Envoyer un email si disponible
      if (business.email) {
        const resendApiKey = Deno.env.get('RESEND_API_KEY');
        if (resendApiKey) {
          try {
            const emailResponse = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${resendApiKey}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                from: 'JOIE DE VIVRE <noreply@joiedevivre-africa.com>',
                to: [business.email],
                subject: `🎂 Opportunité cadeau - Anniversaire de ${alert.target_user_name} dans 15 jours !`,
                html: `
                  <div style="font-family: 'Poppins', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h1 style="color: #7A5DC7; text-align: center;">🎂 Opportunité Cadeau !</h1>
                    <p>Bonjour <strong>${business.business_name}</strong>,</p>
                    <p>Bonne nouvelle ! <strong>${alert.target_user_name}</strong> a ajouté un de vos produits à sa liste de souhaits, et son anniversaire est <strong>dans 15 jours</strong> !</p>
                    <div style="background: linear-gradient(135deg, #7A5DC7, #C084FC); color: white; padding: 20px; border-radius: 12px; text-align: center; margin: 20px 0;">
                      <h2 style="margin: 0;">Créez une cagnotte maintenant</h2>
                      <p style="margin: 10px 0 0 0;">et notifiez tous ses amis pour qu'ils participent !</p>
                    </div>
                    <p>En créant une cagnotte, vous :</p>
                    <ul>
                      <li>Facilitez l'achat groupé pour les proches de ${alert.target_user_name}</li>
                      <li>Augmentez vos chances de vente</li>
                      <li>Créez une expérience de don mémorable</li>
                    </ul>
                    <div style="text-align: center; margin-top: 30px;">
                      <a href="https://joiedevivre.lovable.app/business-dashboard?tab=products" style="background: #7A5DC7; color: white; padding: 15px 30px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                        Voir l'opportunité
                      </a>
                    </div>
                    <p style="color: #666; font-size: 12px; margin-top: 30px; text-align: center;">
                      Cet email a été envoyé par JOIE DE VIVRE. © 2024
                    </p>
                  </div>
                `
              })
            });

            if (!emailResponse.ok) {
              console.error('Error sending email:', await emailResponse.text());
            } else {
              console.log(`📧 Email sent to ${business.email}`);
            }
          } catch (emailError) {
            console.error('Email sending error:', emailError);
          }
        }
      }
    }

    console.log(`🎉 Birthday opportunity detection complete. ${opportunities.length} opportunities found, ${alertsToCreate.length} alerts created.`);

    return new Response(
      JSON.stringify({
        success: true,
        opportunities: opportunities.length,
        alertsCreated: alertsToCreate.length,
        message: `Found ${opportunities.length} birthday opportunities, created ${alertsToCreate.length} alerts`
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
