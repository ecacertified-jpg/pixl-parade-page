import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { sendWhatsAppTemplate } from '../_shared/sms-sender.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const COUNTRY_LABELS: Record<string, string> = {
  CI: "Côte d'Ivoire 🇨🇮",
  BJ: "Bénin 🇧🇯",
  SN: "Sénégal 🇸🇳",
  TG: "Togo 🇹🇬",
  ML: "Mali 🇲🇱",
  BF: "Burkina Faso 🇧🇫",
  NE: "Niger 🇳🇪",
  GN: "Guinée 🇬🇳",
  CM: "Cameroun 🇨🇲",
  GA: "Gabon 🇬🇦",
};

const OCCASION_LABELS: Record<string, string> = {
  birthday: 'Anniversaire',
  wedding: 'Mariage',
  baptism: 'Baptême',
  graduation: 'Diplôme',
  promotion: 'Promotion',
  engagement: 'Fiançailles',
  cadeau: 'Cadeau',
  other: 'Autre occasion',
};

function getCountryLabel(code: string | null): string {
  if (!code) return 'International 🌍';
  return COUNTRY_LABELS[code.toUpperCase()] || code.toUpperCase();
}

function getOccasionLabel(occasion: string | null): string {
  if (!occasion) return 'Cadeau';
  return OCCASION_LABELS[occasion.toLowerCase()] || occasion;
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('fr-FR').format(Math.round(amount));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { fund_id } = await req.json();

    if (!fund_id || typeof fund_id !== 'string') {
      return new Response(
        JSON.stringify({ error: 'fund_id required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 1. Charger la cagnotte
    const { data: fund, error: fundError } = await supabaseAdmin
      .from('collective_funds')
      .select('id, creator_id, beneficiary_contact_id, title, target_amount, occasion, currency')
      .eq('id', fund_id)
      .single();

    if (fundError || !fund) {
      console.error('❌ Fund not found:', fundError);
      return new Response(
        JSON.stringify({ error: 'Fund not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Charger le créateur
    const { data: creator } = await supabaseAdmin
      .from('profiles')
      .select('first_name, last_name, country_code')
      .eq('user_id', fund.creator_id)
      .maybeSingle();

    const creatorName = `${creator?.first_name || ''} ${creator?.last_name || ''}`.trim() || 'Utilisateur';
    const creatorCountry = creator?.country_code || null;
    const countryLabel = getCountryLabel(creatorCountry);

    // 3. Charger le bénéficiaire
    let beneficiaryName = 'Bénéficiaire';
    if (fund.beneficiary_contact_id) {
      const { data: contact } = await supabaseAdmin
        .from('contacts')
        .select('name, linked_user_id')
        .eq('id', fund.beneficiary_contact_id)
        .maybeSingle();

      if (contact?.linked_user_id) {
        const { data: bProfile } = await supabaseAdmin
          .from('profiles')
          .select('first_name, last_name')
          .eq('user_id', contact.linked_user_id)
          .maybeSingle();
        beneficiaryName = `${bProfile?.first_name || ''} ${bProfile?.last_name || ''}`.trim() || contact.name || 'Bénéficiaire';
      } else if (contact?.name) {
        beneficiaryName = contact.name;
      }
    } else {
      // Auto-financement
      beneficiaryName = creatorName;
    }

    const formattedAmount = formatAmount(Number(fund.target_amount) || 0);
    const occasionLabel = getOccasionLabel(fund.occasion);

    console.log(`📢 [admin-fund-created] Fund ${fund_id} | country=${creatorCountry} | creator=${creatorName} | beneficiary=${beneficiaryName}`);

    // 4. Sélection des admins ciblés
    const { data: admins, error: adminsError } = await supabaseAdmin
      .from('admin_users')
      .select('user_id, role, assigned_countries, is_active')
      .eq('is_active', true);

    if (adminsError || !admins || admins.length === 0) {
      console.warn('⚠️ No active admins found');
      return new Response(
        JSON.stringify({ success: true, notified: 0, message: 'No admins to notify' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Filtrer par pays
    const targetedAdmins = admins.filter((a: any) => {
      if (a.role === 'super_admin') return true;
      if (!a.assigned_countries || a.assigned_countries.length === 0) return true;
      if (!creatorCountry) return false;
      return a.assigned_countries.includes(creatorCountry);
    });

    console.log(`👥 ${targetedAdmins.length}/${admins.length} admins targeted`);

    let sentCount = 0;
    let failedCount = 0;
    let dedupCount = 0;

    for (const admin of targetedAdmins) {
      // Anti-spam : vérif log
      const { data: existingLog } = await supabaseAdmin
        .from('admin_fund_notif_log')
        .select('id')
        .eq('fund_id', fund_id)
        .eq('admin_user_id', admin.user_id)
        .eq('channel', 'whatsapp')
        .maybeSingle();

      if (existingLog) {
        dedupCount++;
        continue;
      }

      // Charger profil admin pour téléphone + prénom
      const { data: adminProfile } = await supabaseAdmin
        .from('profiles')
        .select('first_name, phone')
        .eq('user_id', admin.user_id)
        .maybeSingle();

      // Notification in-app (toujours)
      try {
        await supabaseAdmin.from('admin_notifications').insert({
          admin_user_id: admin.user_id,
          type: 'fund_created',
          title: '🚨 Nouvelle cagnotte',
          message: `${creatorName} a créé une cagnotte de ${formattedAmount} XOF pour ${beneficiaryName} (${occasionLabel}) — ${countryLabel}`,
          severity: 'info',
          country_code: creatorCountry,
          entity_type: 'collective_fund',
          entity_id: fund_id,
          action_url: `/admin/funds/${fund_id}`,
          metadata: {
            fund_id,
            creator_id: fund.creator_id,
            beneficiary_name: beneficiaryName,
            target_amount: fund.target_amount,
            occasion: fund.occasion,
          },
        });
      } catch (notifErr) {
        console.warn('⚠️ in-app notification failed:', notifErr);
      }

      // WhatsApp si téléphone disponible
      if (adminProfile?.phone) {
        const result = await sendWhatsAppTemplate(
          adminProfile.phone,
          'joiedevivre_admin_fund_created',
          'fr',
          [countryLabel, creatorName, beneficiaryName, formattedAmount, occasionLabel],
          [fund_id]
        );

        if (result.success) {
          sentCount++;
        } else {
          failedCount++;
          console.warn(`❌ WhatsApp failed for admin ${admin.user_id}: ${result.error}`);
        }
      } else {
        console.log(`ℹ️ Admin ${admin.user_id} has no phone — in-app only`);
      }

      // Logger l'envoi (anti-doublon)
      try {
        await supabaseAdmin.from('admin_fund_notif_log').insert({
          fund_id,
          admin_user_id: admin.user_id,
          channel: 'whatsapp',
        });
      } catch (logErr) {
        console.warn('⚠️ log insert failed:', logErr);
      }
    }

    console.log(`✅ [admin-fund-created] sent=${sentCount} failed=${failedCount} deduped=${dedupCount}`);

    return new Response(
      JSON.stringify({
        success: true,
        targeted: targetedAdmins.length,
        sent: sentCount,
        failed: failedCount,
        deduped: dedupCount,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('❌ [admin-fund-created] Fatal error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
