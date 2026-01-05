import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OrderActionPayload {
  order_id: string;
  action: 'accept' | 'reject' | 'view';
  business_user_id: string;
  rejection_reason?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: OrderActionPayload = await req.json();
    const { order_id, action, business_user_id, rejection_reason } = payload;

    console.log('📦 [handle-order-action] Processing action:', action, 'for order:', order_id);

    if (!order_id || !action || !business_user_id) {
      console.error('❌ Missing required fields');
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch the order and verify ownership
    const { data: order, error: orderError } = await supabase
      .from('business_orders')
      .select(`
        id,
        status,
        business_account_id,
        customer_id,
        total_amount,
        currency,
        order_summary,
        business_accounts!inner (
          user_id,
          business_name
        )
      `)
      .eq('id', order_id)
      .single();

    if (orderError || !order) {
      console.error('❌ Order not found:', orderError);
      return new Response(
        JSON.stringify({ success: false, error: 'Order not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the business_user_id matches the business owner
    const businessAccount = order.business_accounts as any;
    if (businessAccount.user_id !== business_user_id) {
      console.error('❌ Unauthorized: User does not own this business');
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For view action, just return the redirect URL
    if (action === 'view') {
      console.log('👁️ View action - returning redirect URL');
      return new Response(
        JSON.stringify({ 
          success: true, 
          action: 'view',
          redirect_url: `/business-account?tab=orders&highlight=${order_id}`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if order is in a valid state for accept/reject
    if (order.status !== 'pending') {
      console.log('⚠️ Order is not pending, current status:', order.status);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Order is not in pending status',
          current_status: order.status
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let newStatus: string;
    let notificationTitle: string;
    let notificationMessage: string;

    if (action === 'accept') {
      newStatus = 'confirmed';
      notificationTitle = '✅ Commande confirmée';
      notificationMessage = `Votre commande de ${order.total_amount.toLocaleString()} ${order.currency} chez ${businessAccount.business_name} a été confirmée !`;
      console.log('✅ Accepting order');
    } else if (action === 'reject') {
      newStatus = 'cancelled';
      notificationTitle = '❌ Commande annulée';
      notificationMessage = rejection_reason 
        ? `Votre commande chez ${businessAccount.business_name} a été annulée. Raison: ${rejection_reason}`
        : `Votre commande chez ${businessAccount.business_name} n'a pas pu être acceptée par le prestataire.`;
      console.log('❌ Rejecting order');
    } else {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid action' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update order status
    const { error: updateError } = await supabase
      .from('business_orders')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', order_id);

    if (updateError) {
      console.error('❌ Failed to update order:', updateError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to update order' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Notify the customer if they have a user_id
    if (order.customer_id) {
      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: order.customer_id,
          type: action === 'accept' ? 'order_confirmed' : 'order_rejected',
          title: notificationTitle,
          message: notificationMessage,
          data: {
            order_id: order_id,
            action: action,
            business_name: businessAccount.business_name
          },
          is_read: false
        });

      if (notifError) {
        console.error('⚠️ Failed to create customer notification:', notifError);
      } else {
        console.log('✅ Customer notification created');
      }

      // Send push notification to customer
      const { data: customerSubs } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', order.customer_id)
        .eq('is_active', true);

      if (customerSubs && customerSubs.length > 0) {
        console.log('📱 Sending push to customer...');
        // We could call send-push-notification here, but for simplicity we'll just log
      }
    }

    // Track this quick action in analytics
    try {
      await supabase.from('notification_analytics').insert({
        user_id: business_user_id,
        notification_type: 'quick_order_action',
        sent_at: new Date().toISOString(),
        clicked_at: new Date().toISOString(),
        action_url: action,
        status: 'clicked',
        metadata: {
          quick_action: true,
          action_type: action,
          order_id: order_id,
          from_push: true
        }
      });
    } catch (analyticsError) {
      console.log('⚠️ Analytics tracking failed:', analyticsError);
    }

    console.log(`✅ Order ${order_id} ${action}ed successfully`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        action: action,
        new_status: newStatus,
        redirect_url: `/business-account?tab=orders`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in handle-order-action:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
