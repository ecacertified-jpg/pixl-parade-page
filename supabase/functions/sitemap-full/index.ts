import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/xml; charset=utf-8',
  'Cache-Control': 'public, max-age=3600, s-maxage=3600',
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

// SEO City pages
const CITY_PAGES = [
  // Main cities
  { path: '/villes', priority: '0.8', changefreq: 'weekly' },
  { path: '/abidjan', priority: '0.8', changefreq: 'monthly' },
  { path: '/cotonou', priority: '0.8', changefreq: 'monthly' },
  { path: '/dakar', priority: '0.8', changefreq: 'monthly' },
  // Secondary Côte d'Ivoire
  { path: '/bouake', priority: '0.7', changefreq: 'monthly' },
  { path: '/yamoussoukro', priority: '0.7', changefreq: 'monthly' },
  { path: '/san-pedro', priority: '0.7', changefreq: 'monthly' },
  { path: '/daloa', priority: '0.7', changefreq: 'monthly' },
  { path: '/korhogo', priority: '0.7', changefreq: 'monthly' },
  // Secondary Bénin & Sénégal
  { path: '/porto-novo', priority: '0.7', changefreq: 'monthly' },
  { path: '/thies', priority: '0.7', changefreq: 'monthly' },
];

// Hreflang tags for francophone African countries
const HREFLANG_TAGS = [
  { hreflang: 'fr-CI', country: 'Côte d\'Ivoire' },
  { hreflang: 'fr-BJ', country: 'Bénin' },
  { hreflang: 'fr-SN', country: 'Sénégal' },
  { hreflang: 'fr-ML', country: 'Mali' },
  { hreflang: 'fr-CM', country: 'Cameroun' },
  { hreflang: 'fr-TG', country: 'Togo' },
  { hreflang: 'fr-BF', country: 'Burkina Faso' },
  { hreflang: 'fr', country: 'France' },
  { hreflang: 'x-default', country: 'Default' },
];

// Helper to escape XML special characters
function escapeXml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Helper to truncate text for captions (max 150 chars)
function truncateCaption(text: string, maxLength = 150): string {
  if (!text) return '';
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (cleaned.length <= maxLength) return cleaned;
  return cleaned.substring(0, maxLength - 3) + '...';
}

// Generate hreflang tags for a URL
function generateHreflangTags(path: string): string {
  return HREFLANG_TAGS.map(lang => 
    `    <xhtml:link rel="alternate" hreflang="${lang.hreflang}" href="${BASE_URL}${path}" />`
  ).join('\n');
}

// Generate complete inline sitemap
async function generateFullSitemap(supabaseAdmin: ReturnType<typeof createClient>): Promise<string> {
  const today = new Date().toISOString().split('T')[0];
  
  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
`;

  // ============================================
  // STATIC PAGES
  // ============================================
  for (const page of STATIC_PAGES) {
    sitemap += `  <url>
    <loc>${BASE_URL}${page.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
${generateHreflangTags(page.path)}
  </url>
`;
  }

  // ============================================
  // SEO CITY PAGES
  // ============================================
  for (const city of CITY_PAGES) {
    sitemap += `  <url>
    <loc>${BASE_URL}${city.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${city.changefreq}</changefreq>
    <priority>${city.priority}</priority>
  </url>
`;
  }

  // ============================================
  // PRODUCTS (with images)
  // ============================================
  const { data: products, error: productsError } = await supabaseAdmin
    .from('products')
    .select('id, name, description, image_url, images, updated_at')
    .eq('is_active', true)
    .order('updated_at', { ascending: false });

  if (productsError) {
    console.error('Error fetching products:', productsError);
  }

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
`;

      // Add main image if exists
      if (product.image_url) {
        const title = escapeXml(product.name || 'Produit JOIE DE VIVRE');
        const caption = escapeXml(truncateCaption(product.description || `${product.name} disponible sur JOIE DE VIVRE en Côte d'Ivoire`));
        
        sitemap += `    <image:image>
      <image:loc>${escapeXml(product.image_url)}</image:loc>
      <image:title>${title}</image:title>
      <image:caption>${caption}</image:caption>
      <image:geo_location>Abidjan, Côte d'Ivoire</image:geo_location>
    </image:image>
`;
      }

      // Add additional images from images array (limit to 5)
      if (product.images && Array.isArray(product.images)) {
        for (let i = 0; i < product.images.length && i < 5; i++) {
          const imgUrl = product.images[i];
          if (imgUrl && typeof imgUrl === 'string') {
            const title = escapeXml(`${product.name || 'Produit'} - Image ${i + 2}`);
            sitemap += `    <image:image>
      <image:loc>${escapeXml(imgUrl)}</image:loc>
      <image:title>${title}</image:title>
      <image:geo_location>Abidjan, Côte d'Ivoire</image:geo_location>
    </image:image>
`;
          }
        }
      }

      sitemap += `  </url>
`;
    }
  }

  // ============================================
  // BUSINESSES (approved only, with logos)
  // ============================================
  const { data: businesses, error: businessesError } = await supabaseAdmin
    .from('business_accounts')
    .select('id, business_name, description, logo_url, updated_at')
    .eq('is_active', true)
    .eq('status', 'approved')
    .order('updated_at', { ascending: false });

  if (businessesError) {
    console.error('Error fetching businesses:', businessesError);
  }

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
`;

      // Add logo if exists
      if (business.logo_url) {
        const title = escapeXml(business.business_name || 'Boutique JOIE DE VIVRE');
        const caption = escapeXml(truncateCaption(business.description || `${business.business_name} - Boutique partenaire JOIE DE VIVRE en Côte d'Ivoire`));
        
        sitemap += `    <image:image>
      <image:loc>${escapeXml(business.logo_url)}</image:loc>
      <image:title>${title}</image:title>
      <image:caption>${caption}</image:caption>
      <image:geo_location>Abidjan, Côte d'Ivoire</image:geo_location>
    </image:image>
`;
      }

      sitemap += `  </url>
`;
    }
  }

  // ============================================
  // COLLECTIVE FUNDS (public and active only)
  // ============================================
  const { data: funds, error: fundsError } = await supabaseAdmin
    .from('collective_funds')
    .select('id, title, description, updated_at, share_token')
    .eq('is_public', true)
    .eq('status', 'active')
    .order('updated_at', { ascending: false });

  if (fundsError) {
    console.error('Error fetching funds:', fundsError);
  }

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

  // ============================================
  // CLOSE SITEMAP
  // ============================================
  sitemap += `
  <!-- 
    JOIE DE VIVRE - Sitemap Complet
    Generated: ${new Date().toISOString()}
    Static Pages: ${STATIC_PAGES.length}
    City Pages: ${CITY_PAGES.length}
    Products: ${products?.length || 0}
    Businesses: ${businesses?.length || 0}
    Funds: ${funds?.length || 0}
    Total URLs: ${STATIC_PAGES.length + CITY_PAGES.length + (products?.length || 0) + (businesses?.length || 0) + (funds?.length || 0)}
  -->
</urlset>`;

  console.log(`Full sitemap generated: ${STATIC_PAGES.length} static + ${CITY_PAGES.length} cities + ${products?.length || 0} products + ${businesses?.length || 0} businesses + ${funds?.length || 0} funds`);
  
  return sitemap;
}

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

    const sitemap = await generateFullSitemap(supabaseAdmin);

    return new Response(sitemap, {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error('Full sitemap generation error:', error);
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Error generating sitemap: ${error instanceof Error ? error.message : 'Unknown error'} -->
</urlset>`,
      { status: 500, headers: corsHeaders }
    );
  }
});
