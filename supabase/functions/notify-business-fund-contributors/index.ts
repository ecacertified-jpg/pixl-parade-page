import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const NotificationRequestSchema = z.object({
  fund_id: z.string().uuid({ message: "Invalid fund ID format" }),
  notification_type: z.enum(['created', 'reminder', 'progress', 'completed']),
  custom_message: z.string().max(500).optional()
});

interface NotificationRequest {
  fund_id: string;
  notification_type: 'created' | 'reminder' | 'progress' | 'completed';
  custom_message?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body = await req.json();
    
    // Validate input
    const validationResult = NotificationRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ 
          error: 'Données invalides',
          details: validationResult.error.errors
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { fund_id, notification_type, custom_message } = validationResult.data;

    console.log(`Processing notification for fund ${fund_id}, type: ${notification_type}`);

    // Get business collective fund info
    const { data: businessFund, error: fundError } = await supabaseClient
      .from('business_collective_funds')
      .select(`
        *,
        collective_funds!fund_id (
          id,
          title,
          description,
          target_amount,
          current_amount,
          currency,
          status
        ),
        business_accounts!business_id (
          business_name,
          user_id
        ),
        products!product_id (
          name,
          price,
          currency
        ),
        profiles!beneficiary_user_id (
          user_id,
          first_name,
          last_name
        )
      `)
      .eq('fund_id', fund_id)
      .single();

    if (fundError || !businessFund) {
      console.error('Error getting business fund:', fundError);
      throw new Error('Fund not found');
    }

    // Get beneficiary's friends who can see funds
    const { data: friendRelations, error: friendsError } = await supabaseClient
      .from('contact_relationships')
      .select(`
        user_a,
        user_b,
        profiles_a:profiles!contact_relationships_user_a_fkey(user_id, first_name, last_name),
        profiles_b:profiles!contact_relationships_user_b_fkey(user_id, first_name, last_name)
      `)
      .or(`user_a.eq.${businessFund.beneficiary_user_id},user_b.eq.${businessFund.beneficiary_user_id}`)
      .eq('can_see_funds', true);

    if (friendsError) {
      console.error('Error getting friends:', friendsError);
      throw new Error('Error getting beneficiary friends');
    }

    // Extract friend user IDs
    const friendIds: string[] = [];
    friendRelations?.forEach(relation => {
      if (relation.user_a === businessFund.beneficiary_user_id) {
        friendIds.push(relation.user_b);
      } else {
        friendIds.push(relation.user_a);
      }
    });

    console.log(`Found ${friendIds.length} friends to notify`);

    if (friendIds.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No friends to notify' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create notification messages based on type
    const businessName = businessFund.business_accounts?.business_name || 'Un commerce';
    const beneficiaryName = `${businessFund.profiles?.first_name || ''} ${businessFund.profiles?.last_name || ''}`.trim() || 'votre proche';
    const productName = businessFund.products?.name || 'un produit';
    const fund = businessFund.collective_funds;

    let title = '';
    let message = '';

    switch (notification_type) {
      case 'created':
        title = '🎁 Nouvelle cotisation !';
        message = `${businessName} organise une cotisation pour offrir ${productName} à ${beneficiaryName}. Participez pour lui faire plaisir !`;
        break;
      case 'reminder':
        title = '⏰ Rappel cotisation';
        message = custom_message || `N'oubliez pas de participer à la cotisation pour ${beneficiaryName} chez ${businessName} !`;
        break;
      case 'progress':
        const progress = fund ? Math.round((fund.current_amount / fund.target_amount) * 100) : 0;
        title = `📊 Progression: ${progress}%`;
        message = `La cotisation pour ${beneficiaryName} progresse bien ! ${progress}% de l'objectif atteint. Continuez à contribuer !`;
        break;
      case 'completed':
        title = '🎉 Objectif atteint !';
        message = `Félicitations ! L'objectif de la cotisation pour ${beneficiaryName} chez ${businessName} est atteint. ${businessName} va maintenant préparer la livraison !`;
        break;
      default:
        title = '📢 Notification cotisation';
        message = custom_message || `Mise à jour sur la cotisation pour ${beneficiaryName}`;
    }

    // Create notifications for all friends
    const notifications = friendIds.map(friendId => ({
      user_id: friendId,
      notification_type: `business_fund_${notification_type}`,
      title,
      message,
      scheduled_for: new Date().toISOString(),
      delivery_methods: ['email', 'push', 'in_app'],
      metadata: {
        fund_id,
        business_id: businessFund.business_id,
        business_name: businessName,
        beneficiary_user_id: businessFund.beneficiary_user_id,
        beneficiary_name: beneficiaryName,
        product_id: businessFund.product_id,
        product_name: productName
      }
    }));

    const { error: notificationError } = await supabaseClient
      .from('scheduled_notifications')
      .insert(notifications);

    if (notificationError) {
      console.error('Error creating notifications:', notificationError);
      throw new Error('Error creating notifications');
    }

    console.log(`Successfully created ${notifications.length} notifications`);

    return new Response(
      JSON.stringify({ 
        message: `Notifications sent to ${friendIds.length} friends`,
        notification_count: friendIds.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in notify-business-fund-contributors function:', error);
    return new Response(
      JSON.stringify({ 
        error: "Une erreur est survenue lors de l'envoi des notifications",
        code: "INTERNAL_ERROR"
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});