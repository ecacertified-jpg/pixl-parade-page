import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/xml; charset=utf-8',
};

const BASE_URL = 'https://joiedevivre-africa.com';
const SUPABASE_URL = 'https://vaimfeurvzokepqqqrsl.supabase.co';

// Static pages with their priorities and change frequencies
const STATIC_PAGES = [
  { path: '/', priority: '1.0', changefreq: 'daily' },
  { path: '/shop', priority: '0.9', changefreq: 'daily' },
  { path: '/about', priority: '0.7', changefreq: 'monthly' },
  { path: '/faq', priority: '0.6', changefreq: 'monthly' },
  { path: '/privacy-policy', priority: '0.3', changefreq: 'yearly' },
  { path: '/terms-of-service', priority: '0.3', changefreq: 'yearly' },
  { path: '/contact', priority: '0.5', changefreq: 'monthly' },
];

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      SUPABASE_URL,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );

    const today = new Date().toISOString().split('T')[0];

    // Fetch active products
    const { data: products, error: productsError } = await supabaseAdmin
      .from('products')
      .select('id, updated_at')
      .eq('is_active', true)
      .order('updated_at', { ascending: false });

    if (productsError) {
      console.error('Error fetching products:', productsError);
    }

    // Fetch active businesses
    const { data: businesses, error: businessesError } = await supabaseAdmin
      .from('business_accounts')
      .select('id, updated_at')
      .eq('is_active', true)
      .eq('status', 'approved')
      .order('updated_at', { ascending: false });

    if (businessesError) {
      console.error('Error fetching businesses:', businessesError);
    }

    // Fetch public collective funds
    const { data: funds, error: fundsError } = await supabaseAdmin
      .from('collective_funds')
      .select('id, updated_at, share_token')
      .eq('is_public', true)
      .eq('status', 'active')
      .order('updated_at', { ascending: false });

    if (fundsError) {
      console.error('Error fetching funds:', fundsError);
    }

    // Build sitemap XML
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
`;

    // Add static pages
    for (const page of STATIC_PAGES) {
      sitemap += `  <url>
    <loc>${BASE_URL}${page.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
    <xhtml:link rel="alternate" hreflang="fr-CI" href="${BASE_URL}${page.path}" />
    <xhtml:link rel="alternate" hreflang="fr-BJ" href="${BASE_URL}${page.path}" />
    <xhtml:link rel="alternate" hreflang="fr-SN" href="${BASE_URL}${page.path}" />
    <xhtml:link rel="alternate" hreflang="fr" href="${BASE_URL}${page.path}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${BASE_URL}${page.path}" />
  </url>
`;
    }

    // Add product pages (use edge function URL for crawler preview)
    if (products && products.length > 0) {
      for (const product of products) {
        const lastmod = product.updated_at 
          ? new Date(product.updated_at).toISOString().split('T')[0]
          : today;
        
        sitemap += `  <url>
    <loc>${BASE_URL}/p/${product.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
      }
    }

    // Add business pages
    if (businesses && businesses.length > 0) {
      for (const business of businesses) {
        const lastmod = business.updated_at 
          ? new Date(business.updated_at).toISOString().split('T')[0]
          : today;
        
        sitemap += `  <url>
    <loc>${BASE_URL}/b/${business.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
      }
    }

    // Add public fund pages
    if (funds && funds.length > 0) {
      for (const fund of funds) {
        const lastmod = fund.updated_at 
          ? new Date(fund.updated_at).toISOString().split('T')[0]
          : today;
        
        // Use share token if available, otherwise fund id
        const fundPath = fund.share_token ? `/f/${fund.share_token}` : `/contribute/${fund.id}`;
        
        sitemap += `  <url>
    <loc>${BASE_URL}${fundPath}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>
`;
      }
    }

    sitemap += `</urlset>`;

    console.log(`Sitemap generated: ${STATIC_PAGES.length} static pages, ${products?.length || 0} products, ${businesses?.length || 0} businesses, ${funds?.length || 0} funds`);

    return new Response(sitemap, {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error('Sitemap generation error:', error);
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`,
      { status: 500, headers: corsHeaders }
    );
  }
});
