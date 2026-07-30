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

    const { fund_id } = await req.json()
    if (!fund_id) throw new Error('fund_id is required')

    console.log(`🚀 [process-fund-completion] Processing fund ${fund_id}`)

    // 1. Deduplication: check if order already exists for this fund
    const { data: existingOrder } = await supabaseAdmin
      .from('business_orders')
      .select('id')
      .eq('fund_id', fund_id)
      .limit(1)

    if (existingOrder && existingOrder.length > 0) {
      console.log(`⏭️ Order already exists for fund ${fund_id}: ${existingOrder[0].id}`)
      return new Response(JSON.stringify({ skipped: true, reason: 'order_already_exists', order_id: existingOrder[0].id }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 2. Get fund details
    const { data: fund, error: fundErr } = await supabaseAdmin
      .from('collective_funds')
      .select('id, title, current_amount, target_amount, creator_id, beneficiary_contact_id, beneficiary_user_id, is_cash_gift, is_external_product, external_product_url, external_product_name, external_product_image_url, external_platform')
      .eq('id', fund_id)
      .single()

    if (fundErr || !fund) throw new Error('Fund not found: ' + fundErr?.message)

    // 2a. Cash gift fund: the collected amount IS the gift — create a payout record.
    if (fund.is_cash_gift) {
      const { data: existingPayout } = await supabaseAdmin
        .from('cash_gift_payouts')
        .select('id')
        .eq('fund_id', fund_id)
        .maybeSingle()

      if (existingPayout) {
        console.log(`⏭️ Cash gift payout already exists: ${existingPayout.id}`)
        return new Response(JSON.stringify({ skipped: true, reason: 'cash_payout_exists', payout_id: existingPayout.id }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { data: payout, error: payoutErr } = await supabaseAdmin
        .from('cash_gift_payouts')
        .insert({
          fund_id,
          beneficiary_user_id: fund.beneficiary_user_id ?? fund.creator_id,
          beneficiary_contact_id: fund.beneficiary_contact_id ?? null,
          amount: fund.current_amount ?? fund.target_amount,
          currency: 'XOF',
          status: 'pending',
        })
        .select()
        .single()

      if (payoutErr) throw new Error('Failed to create cash gift payout: ' + payoutErr.message)

      console.log(`✅ Cash gift payout created: ${payout.id}`)

      try {
        const recipients = [...new Set([fund.creator_id, fund.beneficiary_user_id].filter(Boolean))]
        await supabaseAdmin.from('notifications').insert(
          recipients.map((uid: string) => ({
            user_id: uid,
            type: 'fund_completed',
            title: 'Cagnotte complète 🎉',
            message: `La cagnotte « ${fund.title} » a atteint son objectif. Le montant collecté sera versé au bénéficiaire.`,
            action_url: `/f/${fund_id}`,
          }))
        )
      } catch (e) {
        console.warn('notification insert failed', e)
      }

      return new Response(JSON.stringify({ success: true, kind: 'cash_gift', payout_id: payout.id }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 2bis. External-product fund: create an external_purchase_request instead of a business order
    if (fund.is_external_product) {
      const { data: existingReq } = await supabaseAdmin
        .from('external_purchase_requests')
        .select('id')
        .eq('fund_id', fund_id)
        .maybeSingle()

      if (existingReq) {
        console.log(`⏭️ External purchase request already exists: ${existingReq.id}`)
        return new Response(JSON.stringify({ skipped: true, reason: 'external_request_exists', request_id: existingReq.id }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Best-effort beneficiary phone lookup via beneficiary contact
      let beneficiaryPhone: string | null = null
      if (fund.beneficiary_contact_id) {
        const { data: c } = await supabaseAdmin
          .from('contacts')
          .select('phone')
          .eq('id', fund.beneficiary_contact_id)
          .maybeSingle()
        beneficiaryPhone = c?.phone ?? null
      }

      // Jumia (and other "self-purchase" platforms) = funds are paid out to the
      // beneficiary via Wave; the beneficiary places the order themselves.
      // Other platforms (Amazon, AliExpress…) keep the manual admin-purchase flow.
      const SELF_PURCHASE_PLATFORMS = new Set(['Jumia'])
      const isSelfPurchase = SELF_PURCHASE_PLATFORMS.has(fund.external_platform ?? '')
      const status = isSelfPurchase ? 'awaiting_beneficiary_purchase' : 'pending'

      const { data: req, error: reqErr } = await supabaseAdmin
        .from('external_purchase_requests')
        .insert({
          fund_id,
          status,
          external_url: fund.external_product_url ?? '',
          product_name: fund.external_product_name ?? fund.title,
          estimated_price: fund.target_amount,
          currency: 'XOF',
          external_platform: fund.external_platform,
          beneficiary_phone: beneficiaryPhone,
        })
        .select()
        .single()

      if (reqErr) throw new Error('Failed to create external purchase request: ' + reqErr.message)

      console.log(`✅ External purchase request created (${status}): ${req.id}`)

      // Notify the creator (best-effort, non-blocking)
      try {
        const message = isSelfPurchase
          ? `Votre cagnotte « ${fund.title} » a atteint son objectif. Les fonds sont prêts à être versés au bénéficiaire via Wave pour finaliser l'achat sur ${fund.external_platform}.`
          : `Votre cagnotte « ${fund.title} » a atteint son objectif. L'équipe Joie de Vivre va commander le produit sur ${fund.external_platform ?? 'la plateforme externe'}.`
        await supabaseAdmin.from('notifications').insert({
          user_id: fund.creator_id,
          type: 'fund_completed',
          title: 'Cagnotte complète 🎉',
          message,
          action_url: `/f/${fund_id}`,
        })
      } catch (e) {
        console.warn('notification insert failed', e)
      }

      return new Response(JSON.stringify({
        success: true,
        external_purchase_request_id: req.id,
        kind: isSelfPurchase ? 'external_self_purchase' : 'external_product',
        status,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 3. Get linked business fund
    const { data: bf, error: bfErr } = await supabaseAdmin
      .from('business_collective_funds')
      .select('business_id, product_id, beneficiary_user_id')
      .eq('fund_id', fund_id)
      .single()

    if (bfErr || !bf) {
      console.log(`⏭️ Not a business fund, skipping`)
      return new Response(JSON.stringify({ skipped: true, reason: 'not_business_fund' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 4. Get product (original price)
    const { data: product, error: productErr } = await supabaseAdmin
      .from('products')
      .select('id, name, price')
      .eq('id', bf.product_id)
      .single()

    if (productErr || !product) throw new Error('Product not found: ' + productErr?.message)

    // 5. Get business account
    const { data: business, error: bizErr } = await supabaseAdmin
      .from('business_accounts')
      .select('id, business_name')
      .eq('id', bf.business_id)
      .single()

    if (bizErr || !business) throw new Error('Business not found: ' + bizErr?.message)

    const { data: businessPayment } = await supabaseAdmin
      .from('business_payment_info')
      .select('wave_merchant_phone, mobile_money_merchant_phone')
      .eq('business_account_id', bf.business_id)
      .maybeSingle()

    // 6. Determine payment method from contributions
    const { data: contributions } = await supabaseAdmin
      .from('fund_contributions')
      .select('id')
      .eq('fund_id', fund_id)
      .limit(1)

    // Default to wave since that's the primary payment method for funds
    const paymentMethod = 'wave'

    // 7. Get beneficiary info for the order
    let beneficiaryPhone = ''
    let donorPhone = ''

    if (bf.beneficiary_user_id) {
      const { data: beneficiaryProfile } = await supabaseAdmin
        .from('profiles')
        .select('phone')
        .eq('user_id', bf.beneficiary_user_id)
        .single()
      beneficiaryPhone = beneficiaryProfile?.phone || ''
    }

    // Get creator phone
    const { data: creatorProfile } = await supabaseAdmin
      .from('profiles')
      .select('phone')
      .eq('user_id', fund.creator_id)
      .single()
    donorPhone = creatorProfile?.phone || ''

    // 8. Calculate split
    const vendorAmount = product.price
    const totalClientAmount = fund.current_amount
    const platformAmount = totalClientAmount - vendorAmount
    const markupRate = vendorAmount > 0 ? ((totalClientAmount - vendorAmount) / vendorAmount) * 100 : 0

    // 9. Create business_order
    const { data: order, error: orderErr } = await supabaseAdmin
      .from('business_orders')
      .insert({
        business_account_id: bf.business_id,
        customer_id: fund.creator_id,
        fund_id: fund_id,
        order_summary: {
          items: [{
            product_id: product.id,
            name: product.name,
            price: totalClientAmount,
            original_price: product.price,
            quantity: 1,
          }],
          source: 'collective_fund',
          fund_title: fund.title,
        },
        total_amount: totalClientAmount,
        currency: 'XOF',
        status: 'pending',
        payment_method: paymentMethod,
        delivery_address: 'À définir',
        donor_phone: donorPhone || 'N/A',
        beneficiary_phone: beneficiaryPhone || 'N/A',
      })
      .select()
      .single()

    if (orderErr) throw new Error('Failed to create order: ' + orderErr.message)

    console.log(`✅ Business order created: ${order.id}`)

    // 10. Get platform Wave phone
    const { data: platformSetting } = await supabaseAdmin
      .from('platform_settings')
      .select('setting_value')
      .eq('setting_key', 'platform_wave_phone')
      .single()

    const platformWavePhone = platformSetting?.setting_value?.value || ''

    // 11. Create payment split
    const { data: split, error: splitErr } = await supabaseAdmin
      .from('payment_splits')
      .insert({
        business_order_id: order.id,
        total_client_amount: totalClientAmount,
        vendor_amount: vendorAmount,
        platform_amount: platformAmount,
        currency: 'XOF',
        markup_rate: Math.round(markupRate * 100) / 100,
        vendor_wave_phone: businessPayment?.wave_merchant_phone || null,
        platform_wave_phone: platformWavePhone || null,
        vendor_transfer_status: 'pending',
        platform_transfer_status: 'received',
        payment_method: paymentMethod,
      })
      .select()
      .single()

    if (splitErr) throw new Error('Failed to create split: ' + splitErr.message)

    console.log(`✅ Payment split created: vendor=${vendorAmount} XOF, platform=${platformAmount} XOF, markup=${markupRate.toFixed(1)}%`)

    return new Response(JSON.stringify({
      success: true,
      order_id: order.id,
      split: {
        id: split.id,
        vendor_amount: vendorAmount,
        platform_amount: platformAmount,
        markup_rate: Math.round(markupRate * 100) / 100,
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('❌ [process-fund-completion] Error:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
