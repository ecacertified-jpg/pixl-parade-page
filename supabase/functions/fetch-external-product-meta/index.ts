import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const ALLOWED_HOSTS: { match: RegExp; platform: string }[] = [
  { match: /(^|\.)jumia\.(ci|com|com\.ng|sn|ma|ke|tn|ug|gh|cm|ic|africa|com\.gh|com\.eg|dz)$/i, platform: 'Jumia' },
  { match: /(^|\.)amazon\.[a-z.]+$/i, platform: 'Amazon' },
  { match: /(^|\.)aliexpress\.com$/i, platform: 'AliExpress' },
  { match: /(^|\.)alibaba\.com$/i, platform: 'Alibaba' },
  { match: /(^|\.)shein\.com$/i, platform: 'Shein' },
  { match: /(^|\.)temu\.com$/i, platform: 'Temu' },
  { match: /(^|\.)ebay\.[a-z.]+$/i, platform: 'eBay' },
]

// Fuzzy fallback: catches new TLDs, mobile subdomains, regional variants
const FUZZY_HOSTS: { keyword: RegExp; platform: string }[] = [
  { keyword: /jumia/i, platform: 'Jumia' },
  { keyword: /amazon/i, platform: 'Amazon' },
  { keyword: /aliexpress/i, platform: 'AliExpress' },
  { keyword: /alibaba/i, platform: 'Alibaba' },
  { keyword: /shein/i, platform: 'Shein' },
  { keyword: /temu/i, platform: 'Temu' },
  { keyword: /ebay/i, platform: 'eBay' },
]

function detectPlatform(hostname: string): string | null {
  const h = hostname.replace(/^www\./i, '')
  for (const { match, platform } of ALLOWED_HOSTS) {
    if (match.test(h)) return platform
  }
  // Fuzzy match for non-canonical hosts (m.jumia.ci, deals.jumia.com, jumia.com.eg, etc.)
  for (const { keyword, platform } of FUZZY_HOSTS) {
    if (keyword.test(h)) return platform
  }
  return null
}

/**
 * Normalize a raw user input into a clean product URL:
 *  - extract the first http(s) URL from messy text (WhatsApp shares, etc.)
 *  - prepend https:// when missing
 *  - rewrite m.* mobile subdomains to www.*
 *  - strip tracking params (utm_*, gclid, fbclid, ref, _ga, sclid, mc_*, ...)
 */
function normalizeRawUrl(input: string): string | null {
  let raw = input.trim()
  if (!raw) return null
  // Extract first URL from messy text
  const urlMatch = raw.match(/https?:\/\/[^\s<>"']+/i)
  if (urlMatch) {
    raw = urlMatch[0]
  } else if (/^[a-z0-9-]+(\.[a-z0-9-]+)+/i.test(raw)) {
    // Bare domain like "www.jumia.ci/foo" — prepend scheme
    raw = 'https://' + raw.replace(/^\/+/, '')
  } else {
    return null
  }
  let parsed: URL
  try {
    parsed = new URL(raw)
  } catch {
    return null
  }
  // Rewrite mobile → www
  if (/^m\./i.test(parsed.hostname)) {
    parsed.hostname = 'www.' + parsed.hostname.slice(2)
  }
  // Strip tracking / share params
  const stripParams = [
    /^utm_/i, /^gclid$/i, /^fbclid$/i, /^msclkid$/i, /^_ga$/i, /^mc_/i,
    /^sclid$/i, /^ref$/i, /^src$/i, /^source$/i, /^share_/i, /^shared_/i,
    /^spm$/i, /^scm$/i, /^pdp_/i, /^algo_/i, /^aff_/i,
  ]
  const keep: [string, string][] = []
  for (const [k, v] of parsed.searchParams) {
    if (!stripParams.some((rx) => rx.test(k))) keep.push([k, v])
  }
  parsed.search = ''
  for (const [k, v] of keep) parsed.searchParams.set(k, v)
  return parsed.toString()
}

/** Jumia-specific extra extractors: itemprop=price, data-price attrs, h1 fallback. */
function pickJumiaExtras(html: string): { name?: string; price?: number; image?: string } {
  const out: { name?: string; price?: number; image?: string } = {}
  // <span itemprop="price" content="12345"> or <meta itemprop="price" content="...">
  const itemPropPrice = html.match(/itemprop=["']price["'][^>]*content=["']([^"']+)["']/i)
    || html.match(/content=["']([^"']+)["'][^>]*itemprop=["']price["']/i)
  if (itemPropPrice) {
    const n = Number.parseFloat(itemPropPrice[1].replace(/[^\d.]/g, ''))
    if (Number.isFinite(n) && n > 0) out.price = Math.round(n)
  }
  // data-price="12345" attribute (Jumia & many e-commerce themes)
  if (out.price == null) {
    const dataPrice = html.match(/data-price=["']([\d.,]+)["']/i)
    if (dataPrice) {
      const norm = dataPrice[1].replace(/[^\d.,]/g, '').replace(/,/g, '')
      const n = Number.parseFloat(norm)
      if (Number.isFinite(n) && n > 0) out.price = Math.round(n)
    }
  }
  // <h1 class="-fs20 -pts -pbxs"> Product Name </h1>
  const h1 = html.match(/<h1[^>]*>([\s\S]{1,300}?)<\/h1>/i)
  if (h1) {
    const stripped = h1[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
    if (stripped) out.name = stripped.slice(0, 200)
  }
  return out
}

function pickMeta(html: string, ...keys: string[]): string | null {
  for (const key of keys) {
    // <meta property="og:title" content="..."> or <meta name="..." content="...">
    const re = new RegExp(
      `<meta[^>]+(?:property|name|itemprop)\\s*=\\s*["']${key.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}["'][^>]*>`,
      'i',
    )
    const m = html.match(re)
    if (!m) continue
    const c = m[0].match(/content\s*=\s*["']([^"']+)["']/i)
    if (c?.[1]) return c[1].trim()
  }
  return null
}

function pickPrice(html: string): number | null {
  const candidates = [
    pickMeta(html, 'product:price:amount', 'og:price:amount', 'twitter:data1', 'price'),
  ].filter(Boolean) as string[]
  for (const raw of candidates) {
    const cleaned = raw.replace(/[^\d.,]/g, '').replace(/\s/g, '')
    // Convert European decimals to dot
    const norm = cleaned.includes(',') && !cleaned.includes('.')
      ? cleaned.replace(',', '.')
      : cleaned.replace(/,/g, '')
    const n = Number.parseFloat(norm)
    if (Number.isFinite(n) && n > 0) return Math.round(n)
  }
  // Try JSON-LD
  const ldMatches = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
  for (const m of ldMatches) {
    try {
      const data = JSON.parse(m[1].trim())
      const stack = Array.isArray(data) ? [...data] : [data]
      while (stack.length) {
        const node: any = stack.pop()
        if (!node || typeof node !== 'object') continue
        const offers = node.offers
        if (offers) stack.push(offers)
        const p = node.price ?? node.lowPrice
        if (p != null) {
          const n = Number.parseFloat(String(p).replace(/[^\d.]/g, ''))
          if (Number.isFinite(n) && n > 0) return Math.round(n)
        }
        for (const v of Object.values(node)) {
          if (v && typeof v === 'object') stack.push(v)
        }
      }
    } catch { /* ignore */ }
  }
  return null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  try {
    // --- Auth (JWT extraction per project convention) ---
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const token = authHeader.replace(/^Bearer\s+/i, '')
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    )
    const { data: userRes, error: userErr } = await supabase.auth.getUser(token)
    if (userErr || !userRes?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // --- Input validation ---
    let body: { url?: string }
    try {
      body = await req.json()
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const rawUrl = (body.url ?? '').trim()
    if (!rawUrl || rawUrl.length > 2000) {
      return new Response(JSON.stringify({ error: 'URL is required (max 2000 chars)' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const normalized = normalizeRawUrl(rawUrl)
    if (!normalized) {
      return new Response(JSON.stringify({ error: 'Invalid URL' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const parsed = new URL(normalized)
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return new Response(JSON.stringify({ error: 'Only http(s) URLs are allowed' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const platform = detectPlatform(parsed.hostname)
    if (!platform) {
      return new Response(JSON.stringify({ error: 'Plateforme non supportée. Utilisez Jumia, Amazon, AliExpress, Alibaba, Shein, Temu ou eBay.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // --- Fetch HTML (15s timeout) ---
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)
    let html = ''
    try {
      const res = await fetch(parsed.toString(), {
        signal: controller.signal,
        redirect: 'follow',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; JoieDeVivreBot/1.0; +https://joiedevivre-africa.com)',
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
        },
      })
      if (!res.ok) {
        // Soft-fail: platform is known, return empty meta so user can fill manually
        return new Response(
          JSON.stringify({
            platform,
            name: null,
            image_url: null,
            price: null,
            currency: 'XOF',
            url: parsed.toString(),
            partial: true,
            warning: `Aperçu indisponible (HTTP ${res.status}) — saisis le nom et le prix manuellement.`,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }
      html = (await res.text()).slice(0, 1_500_000) // cap 1.5 MB
    } catch (e) {
      console.error('fetch error', e)
      return new Response(
        JSON.stringify({
          platform,
          name: null,
          image_url: null,
          price: null,
          currency: 'XOF',
          url: parsed.toString(),
          partial: true,
          warning: 'Aperçu indisponible (timeout ou réseau) — saisis le nom et le prix manuellement.',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    } finally {
      clearTimeout(timeout)
    }

    const extras = platform === 'Jumia' ? pickJumiaExtras(html) : {}
    const name =
      pickMeta(html, 'og:title', 'twitter:title') ||
      extras.name ||
      (html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() ?? null)
    const image =
      pickMeta(html, 'og:image', 'og:image:url', 'twitter:image', 'twitter:image:src') ||
      extras.image ||
      null
    const price = pickPrice(html) ?? extras.price ?? null
    const currency = pickMeta(html, 'product:price:currency', 'og:price:currency') || 'XOF'

    return new Response(
      JSON.stringify({
        platform,
        name: name?.slice(0, 200) ?? null,
        image_url: image ?? null,
        price,
        currency,
        url: parsed.toString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    console.error('fetch-external-product-meta unexpected', err)
    return new Response(JSON.stringify({ error: 'Erreur interne' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})