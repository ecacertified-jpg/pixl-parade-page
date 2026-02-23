import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendSms, shouldUseSms } from "../_shared/sms-sender.ts";

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

async function sendWebPush(subscription: any, payload: any): Promise<boolean> {
  try {
    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'TTL': '86400',
        'Urgency': 'high',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Push failed:', response.status, errorText);
      return false;
    }

    console.log('✅ Push sent to:', subscription.endpoint.substring(0, 50) + '...');
    return true;
  } catch (error) {
    console.error('❌ Error in sendWebPush:', error);
    return false;
  }
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

    // Fetch the order and verify ownership (includes phone numbers for SMS)
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
        donor_phone,
        beneficiary_phone,
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
      // 1. In-app notification
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
        console.log('✅ Customer in-app notification created');
      }

      // 2. Push notifications to customer
      try {
        const { data: customerSubs } = await supabase
          .from('push_subscriptions')
          .select('*')
          .eq('user_id', order.customer_id)
          .eq('is_active', true);

        if (customerSubs && customerSubs.length > 0) {
          console.log(`📱 Sending push to ${customerSubs.length} customer subscription(s)...`);

          const pushPayload = {
            title: notificationTitle,
            message: notificationMessage,
            body: notificationMessage,
            icon: '/logo-jv.png',
            badge: '/logo-jv.png',
            tag: `order-status-${order_id}`,
            data: {
              type: action === 'accept' ? 'order_confirmed' : 'order_rejected',
              order_id: order_id,
              url: '/dashboard',
            },
          };

          for (const sub of customerSubs) {
            const success = await sendWebPush(sub, pushPayload);
            if (success) {
              await supabase
                .from('push_subscriptions')
                .update({ last_used_at: new Date().toISOString() })
                .eq('id', sub.id);
            } else {
              // Deactivate expired/invalid subscriptions
              await supabase
                .from('push_subscriptions')
                .update({ is_active: false })
                .eq('id', sub.id);
            }
          }
        } else {
          console.log('📭 No active push subscriptions for customer');
        }
      } catch (pushError) {
        console.error('⚠️ Push notification error:', pushError);
      }
    }

    // 3. Send SMS to customer
    const customerPhone = order.donor_phone || order.beneficiary_phone;
    if (customerPhone) {
      try {
        const orderShortId = order_id.substring(0, 8).toUpperCase();
        const bizName = businessAccount.business_name.substring(0, 25);
        
        let smsMessage: string;
        if (action === 'accept') {
          smsMessage = `JoieDvivre: Bonne nouvelle! Votre commande #${orderShortId} chez ${bizName} est confirmee. Suivez-la sur joiedevivre-africa.com`;
        } else {
          smsMessage = `JoieDvivre: Votre commande #${orderShortId} chez ${bizName} n'a pas pu etre acceptee. Contactez-nous sur joiedevivre-africa.com`;
        }

        console.log(`📤 [SMS] Sending order status SMS to customer...`);
        const smsResult = await sendSms(customerPhone, smsMessage, { truncate: true });
        
        if (smsResult.success) {
          console.log('✅ Customer SMS sent:', smsResult.sid);
        } else {
          console.error('⚠️ Customer SMS failed:', smsResult.error);
        }
      } catch (smsError) {
        console.error('⚠️ SMS sending error:', smsError);
      }
    } else {
      console.log('📭 No customer phone number available for SMS');
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
