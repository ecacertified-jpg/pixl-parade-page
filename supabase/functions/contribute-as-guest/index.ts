import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface GuestContributionPayload {
  fund_id: string
  amount: number
  message?: string
  is_anonymous?: boolean
  guest_name: string
  guest_phone: string
  guest_email?: string
}

function badRequest(message: string, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return badRequest('Method not allowed', 405)
  }

  let payload: GuestContributionPayload
  try {
    payload = await req.json()
  } catch {
    return badRequest('Invalid JSON body')
  }

  const {
    fund_id,
    amount,
    message,
    is_anonymous,
    guest_name,
    guest_phone,
    guest_email,
  } = payload || ({} as GuestContributionPayload)

  // Basic validation
  if (!fund_id || typeof fund_id !== 'string') return badRequest('fund_id requis')
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
    return badRequest('Montant invalide')
  }
  if (amount > 500000) return badRequest('Montant trop élevé (max 500 000)')
  if (!guest_name || typeof guest_name !== 'string' || guest_name.trim().length < 2) {
    return badRequest('Nom requis')
  }
  if (!guest_phone || typeof guest_phone !== 'string' || guest_phone.trim().length < 6) {
    return badRequest('Téléphone requis')
  }
  if (message && typeof message === 'string' && message.length > 500) {
    return badRequest('Message trop long')
  }
  if (guest_email && typeof guest_email === 'string' && guest_email.length > 255) {
    return badRequest('Email trop long')
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // Load fund
  const { data: fund, error: fundErr } = await supabaseAdmin
    .from('collective_funds')
    .select('id, status, is_public, current_amount, target_amount, currency, creator_id, title')
    .eq('id', fund_id)
    .maybeSingle()

  if (fundErr || !fund) return badRequest('Cagnotte introuvable', 404)
  if (fund.status !== 'active') return badRequest('Cette cagnotte n\'est plus active', 409)
  if (!fund.is_public) {
    return badRequest('Les contributions invité sont réservées aux cagnottes publiques', 403)
  }

  const remaining = Number(fund.target_amount) - Number(fund.current_amount)
  if (amount > remaining) {
    return badRequest(`Le montant dépasse le restant (${remaining} ${fund.currency})`, 422)
  }

  // Insert guest contribution
  const { data: inserted, error: insertErr } = await supabaseAdmin
    .from('fund_contributions')
    .insert({
      fund_id,
      contributor_id: null,
      is_guest: true,
      guest_name: guest_name.trim().slice(0, 100),
      guest_phone: guest_phone.trim().slice(0, 30),
      guest_email: guest_email ? guest_email.trim().slice(0, 255) : null,
      amount,
      currency: fund.currency || 'XOF',
      message: message ? message.trim().slice(0, 500) : null,
      is_anonymous: !!is_anonymous,
    })
    .select('id')
    .single()

  if (insertErr) {
    console.error('contribute-as-guest insert error:', insertErr)
    return badRequest('Impossible d\'enregistrer la contribution', 500)
  }

  // Update fund current_amount
  const newAmount = Number(fund.current_amount) + amount
  const { error: updErr } = await supabaseAdmin
    .from('collective_funds')
    .update({ current_amount: newAmount })
    .eq('id', fund_id)

  if (updErr) {
    console.error('contribute-as-guest fund update error:', updErr)
    // Rollback contribution
    await supabaseAdmin.from('fund_contributions').delete().eq('id', inserted.id)
    return badRequest('Impossible de mettre à jour la cagnotte', 500)
  }

  return new Response(
    JSON.stringify({
      success: true,
      contribution_id: inserted.id,
      new_amount: newAmount,
      target_amount: Number(fund.target_amount),
      currency: fund.currency || 'XOF',
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
  )
})