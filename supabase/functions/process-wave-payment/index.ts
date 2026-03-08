import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Authenticate user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing authorization header')

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    if (authError || !user) throw new Error('Unauthorized')

    const { business_order_id } = await req.json()
    if (!business_order_id) throw new Error('business_order_id is required')

    // 1. Fetch the business order
    const { data: order, error: orderErr } = await supabaseAdmin
      .from('business_orders')
      .select('id, total_amount, business_account_id, order_summary, payment_method')
      .eq('id', business_order_id)
      .single()

    if (orderErr || !order) throw new Error('Order not found: ' + orderErr?.message)
    if (order.payment_method !== 'wave') {
      return new Response(JSON.stringify({ skipped: true, reason: 'Not a Wave payment' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 2. Calculate vendor amount from original product prices (no markup)
    const items = (order.order_summary as any)?.items || []
    let vendorAmount = 0

    for (const item of items) {
      const productId = item.product_id
      if (productId) {
        const { data: product } = await supabaseAdmin
          .from('products')
          .select('price')
          .eq('id', productId)
          .single()

        if (product) {
          vendorAmount += product.price * (item.quantity || 1)
        }
      }
    }

    const totalClientAmount = order.total_amount
    const platformAmount = totalClientAmount - vendorAmount
    const markupRate = vendorAmount > 0 ? ((totalClientAmount - vendorAmount) / vendorAmount) * 100 : 0

    // 3. Get vendor Wave phone
    const { data: businessAccount } = await supabaseAdmin
      .from('business_accounts')
      .select('wave_merchant_phone')
      .eq('id', order.business_account_id)
      .single()

    // 4. Get platform Wave phone
    const { data: platformSetting } = await supabaseAdmin
      .from('platform_settings')
      .select('setting_value')
      .eq('setting_key', 'platform_wave_phone')
      .single()

    const platformWavePhone = platformSetting?.setting_value?.value || ''

    // 5. Insert payment split
    const { data: split, error: splitErr } = await supabaseAdmin
      .from('payment_splits')
      .insert({
        business_order_id,
        total_client_amount: totalClientAmount,
        vendor_amount: vendorAmount,
        platform_amount: platformAmount,
        currency: 'XOF',
        markup_rate: Math.round(markupRate * 100) / 100,
        vendor_wave_phone: businessAccount?.wave_merchant_phone || null,
        platform_wave_phone: platformWavePhone || null,
        vendor_transfer_status: 'simulated',
        platform_transfer_status: 'simulated',
        payment_method: 'wave',
      })
      .select()
      .single()

    if (splitErr) throw new Error('Failed to create payment split: ' + splitErr.message)

    console.log(`✅ Payment split created: vendor=${vendorAmount} XOF, platform=${platformAmount} XOF`)

    return new Response(JSON.stringify({
      success: true,
      split: {
        id: split.id,
        total_client_amount: totalClientAmount,
        vendor_amount: vendorAmount,
        platform_amount: platformAmount,
        markup_rate: Math.round(markupRate * 100) / 100,
        vendor_transfer_status: 'simulated',
        platform_transfer_status: 'simulated',
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('❌ process-wave-payment error:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
