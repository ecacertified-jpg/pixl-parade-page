import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/xml; charset=utf-8',
};

// Cache headers optimized for AI crawlers (less frequent but deeper crawls)
const AI_CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=7200, s-maxage=14400, stale-while-revalidate=3600, stale-if-error=86400',
};

// Generate ETag for conditional requests (304 Not Modified)
function generateETag(content: string): string {
  const len = content.length;
  const sample = content.slice(0, 100) + content.slice(-100);
  return `${len}-${btoa(sample).slice(0, 12)}`;
}

const BASE_URL = 'https://joiedevivre-africa.com';
const SUPABASE_URL = 'https://vaimfeurvzokepqqqrsl.supabase.co';

// Pages statiques optimisées pour LLMs (priorités inversées vs SEO)
const AI_STATIC_PAGES = [
  // Tier 1: Points d'entrée IA (1.0)
  { path: '/llms.txt', priority: '1.0', changefreq: 'weekly', type: 'text' },
  { path: '/llms-full.txt', priority: '1.0', changefreq: 'weekly', type: 'text' },
  { path: '/ai-info', priority: '1.0', changefreq: 'weekly', type: 'json-ld' },
  
  // Tier 2: Documentation Markdown (0.9)
  { path: '/content/about.md', priority: '0.9', changefreq: 'monthly', type: 'markdown' },
  { path: '/content/faq.md', priority: '0.9', changefreq: 'weekly', type: 'markdown' },
  
  // Tier 3: Pages légales Markdown (0.8)
  { path: '/content/privacy-policy.md', priority: '0.8', changefreq: 'yearly', type: 'markdown' },
  { path: '/content/terms.md', priority: '0.8', changefreq: 'yearly', type: 'markdown' },
  { path: '/content/legal-notice.md', priority: '0.8', changefreq: 'yearly', type: 'markdown' },
  
  // Tier 4: Pages HTML (0.7)
  { path: '/', priority: '0.7', changefreq: 'daily', type: 'html' },
  { path: '/shop', priority: '0.7', changefreq: 'daily', type: 'html' },
  { path: '/about', priority: '0.7', changefreq: 'monthly', type: 'html' },
  { path: '/faq', priority: '0.7', changefreq: 'monthly', type: 'html' },
  
  // Tier 5: Config IA (0.6)
  { path: '/.well-known/ai-plugin.json', priority: '0.6', changefreq: 'monthly', type: 'json' },
  { path: '/openapi.yaml', priority: '0.6', changefreq: 'monthly', type: 'yaml' },
];

function escapeXml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Calculer la priorité dynamique basée sur le score de popularité
function calculateProductPriority(popularityScore: number): string {
  if (popularityScore >= 100) return '0.8';
  if (popularityScore >= 50) return '0.75';
  if (popularityScore >= 20) return '0.7';
  if (popularityScore >= 10) return '0.65';
  return '0.6';
}

// Générer le sitemap complet
async function generateAISitemap(
  supabaseAdmin: ReturnType<typeof createClient>,
  today: string
): Promise<string> {
  
  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<!--
  JOIE DE VIVRE - Dynamic AI Sitemap
  Generated: ${today}
  
  Ce sitemap est généré dynamiquement pour les crawlers IA.
  Il inclut les produits et boutiques populaires de la plateforme.
  Produits triés par score de popularité (vues, commandes, favoris, notes, partages).
  
  Pour le sitemap SEO standard: /sitemap.xml
  Pour le sitemap IA statique: /sitemap-ai.xml
-->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  
  <!-- ========================================= -->
  <!-- STATIC PAGES (optimized for LLMs)        -->
  <!-- ========================================= -->
`;

  // Ajouter les pages statiques
  for (const page of AI_STATIC_PAGES) {
    sitemap += `  <url>
    <loc>${BASE_URL}${page.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
    <!-- content-type: ${page.type} -->
  </url>
`;
  }

  // Récupérer les top 50 produits par score de popularité
  const { data: products, error: productsError } = await supabaseAdmin
    .from('products')
    .select(`
      id, 
      name, 
      updated_at, 
      price, 
      category_id,
      view_count,
      order_count,
      favorites_count,
      popularity_score
    `)
    .eq('is_active', true)
    .order('popularity_score', { ascending: false })
    .order('updated_at', { ascending: false })
    .limit(50);

  if (productsError) {
    console.error('Error fetching products:', productsError);
  }

  if (products && products.length > 0) {
    sitemap += `
  <!-- ========================================= -->
  <!-- POPULAR PRODUCTS (Top ${String(products.length).padEnd(2, ' ')} by popularity)   -->
  <!-- Sorted by: popularity_score DESC         -->
  <!-- Priority: 0.6-0.8 based on score         -->
  <!-- ========================================= -->
`;
    for (const product of products) {
      const lastmod = product.updated_at
        ? new Date(product.updated_at).toISOString().split('T')[0]
        : today;
      const priority = calculateProductPriority(product.popularity_score || 0);
      
      sitemap += `  <url>
    <loc>${BASE_URL}/p/${product.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
    <!-- product: ${escapeXml(product.name || 'Unknown')} | ${product.price} FCFA -->
    <!-- popularity: score=${product.popularity_score || 0} views=${product.view_count || 0} orders=${product.order_count || 0} favorites=${product.favorites_count || 0} -->
  </url>
`;
    }
  }

  // Récupérer les top 20 boutiques approuvées
  const { data: businesses, error: businessError } = await supabaseAdmin
    .from('business_accounts')
    .select('id, business_name, updated_at')
    .eq('is_active', true)
    .eq('status', 'approved')
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })
    .limit(20);

  if (businessError) {
    console.error('Error fetching businesses:', businessError);
  }

  if (businesses && businesses.length > 0) {
    sitemap += `
  <!-- ========================================= -->
  <!-- APPROVED BUSINESSES (Top ${businesses.length})           -->
  <!-- Priority 0.6 - Verified partners         -->
  <!-- ========================================= -->
`;
    for (const business of businesses) {
      const lastmod = business.updated_at
        ? new Date(business.updated_at).toISOString().split('T')[0]
        : today;
      
      sitemap += `  <url>
    <loc>${BASE_URL}/b/${business.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
    <!-- business: ${escapeXml(business.business_name || 'Unknown')} -->
  </url>
`;
    }
  }

  // Récupérer les cagnottes publiques actives
  const { data: funds, error: fundsError } = await supabaseAdmin
    .from('collective_funds')
    .select('id, title, updated_at, share_token')
    .eq('is_public', true)
    .eq('status', 'active')
    .order('updated_at', { ascending: false })
    .limit(30);

  if (fundsError) {
    console.error('Error fetching funds:', fundsError);
  }

  if (funds && funds.length > 0) {
    sitemap += `
  <!-- ========================================= -->
  <!-- PUBLIC FUNDS (Active: ${funds.length})                 -->
  <!-- Priority 0.5 - User-generated content    -->
  <!-- ========================================= -->
`;
    for (const fund of funds) {
      const lastmod = fund.updated_at
        ? new Date(fund.updated_at).toISOString().split('T')[0]
        : today;
      const fundPath = fund.share_token ? `/f/${fund.share_token}` : `/contribute/${fund.id}`;
      
      sitemap += `  <url>
    <loc>${BASE_URL}${fundPath}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.5</priority>
    <!-- fund: ${escapeXml(fund.title || 'Cagnotte')} -->
  </url>
`;
    }
  }

  // Footer avec statistiques
  const totalUrls = AI_STATIC_PAGES.length + 
    (products?.length || 0) + 
    (businesses?.length || 0) + 
    (funds?.length || 0);
    
  sitemap += `
  <!-- ========================================= -->
  <!-- STATISTICS                               -->
  <!-- Total URLs: ${String(totalUrls).padEnd(34, ' ')} -->
  <!-- Static pages: ${String(AI_STATIC_PAGES.length).padEnd(30, ' ')} -->
  <!-- Products: ${String(products?.length || 0).padEnd(35, ' ')} -->
  <!-- Businesses: ${String(businesses?.length || 0).padEnd(33, ' ')} -->
  <!-- Funds: ${String(funds?.length || 0).padEnd(38, ' ')} -->
  <!-- Generated: ${new Date().toISOString()}   -->
  <!-- ========================================= -->
  
</urlset>`;

  console.log(`AI Sitemap generated: ${totalUrls} total URLs`);
  return sitemap;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      SUPABASE_URL,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );

    const today = new Date().toISOString().split('T')[0];
    const sitemap = await generateAISitemap(supabaseAdmin, today);

    // Generate ETag for conditional requests
    const etag = generateETag(sitemap);
    const ifNoneMatch = req.headers.get('If-None-Match');

    // Return 304 Not Modified if content hasn't changed
    if (ifNoneMatch === `"${etag}"`) {
      return new Response(null, {
        status: 304,
        headers: {
          ...corsHeaders,
          ...AI_CACHE_HEADERS,
        },
      });
    }

    return new Response(sitemap, {
      status: 200,
      headers: {
        ...corsHeaders,
        ...AI_CACHE_HEADERS,
        'ETag': `"${etag}"`,
        'Last-Modified': new Date().toUTCString(),
        'X-Robots-Tag': 'noindex', // AI sitemap should not be indexed by Google
      },
    });
  } catch (error) {
    console.error('AI Sitemap generation error:', error);
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Error generating AI sitemap: ${error instanceof Error ? escapeXml(error.message) : 'Unknown error'} -->
</urlset>`,
      { 
        status: 500, 
        headers: {
          ...corsHeaders,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  }
});
