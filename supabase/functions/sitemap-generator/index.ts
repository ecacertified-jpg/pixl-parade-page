import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/xml; charset=utf-8',
};

// Cache durations by sitemap type (optimized for Google crawls)
const CACHE_HEADERS: Record<string, string> = {
  index: 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=600',
  pages: 'public, max-age=21600, s-maxage=21600, stale-while-revalidate=3600',
  products: 'public, max-age=3600, s-maxage=7200, stale-while-revalidate=1800',
  businesses: 'public, max-age=7200, s-maxage=14400, stale-while-revalidate=3600',
  funds: 'public, max-age=1800, s-maxage=3600, stale-while-revalidate=600',
};

// Generate ETag for conditional requests
function generateETag(content: string): string {
  const len = content.length;
  const sample = content.slice(0, 100) + content.slice(-100);
  return `${len}-${btoa(sample).slice(0, 12)}`;
}

const BASE_URL = 'https://joiedevivre-africa.com';
const SUPABASE_URL = 'https://vaimfeurvzokepqqqrsl.supabase.co';
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/sitemap-generator`;

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

// Generate sitemap index
function generateSitemapIndex(today: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${FUNCTION_URL}?type=pages</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${FUNCTION_URL}?type=products</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${FUNCTION_URL}?type=businesses</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${FUNCTION_URL}?type=funds</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
</sitemapindex>`;
}

// Generate static pages sitemap
function generatePagesSitemap(today: string): string {
  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
`;

  for (const page of STATIC_PAGES) {
    sitemap += `  <url>
    <loc>${BASE_URL}${page.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
`;
    // Add hreflang tags
    for (const lang of HREFLANG_TAGS) {
      sitemap += `    <xhtml:link rel="alternate" hreflang="${lang.hreflang}" href="${BASE_URL}${page.path}" />\n`;
    }
    sitemap += `  </url>\n`;
  }

  sitemap += `</urlset>`;
  return sitemap;
}

// Generate products sitemap with images
async function generateProductsSitemap(supabaseAdmin: ReturnType<typeof createClient>, today: string): Promise<string> {
  const { data: products, error } = await supabaseAdmin
    .from('products')
    .select('id, name, description, image_url, images, updated_at')
    .eq('is_active', true)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching products:', error);
  }

  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
`;

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

      // Add additional images from images array
      if (product.images && Array.isArray(product.images)) {
        for (let i = 0; i < product.images.length && i < 5; i++) { // Limit to 5 additional images
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

      sitemap += `  </url>\n`;
    }
  }

  sitemap += `</urlset>`;
  
  console.log(`Products sitemap generated: ${products?.length || 0} products`);
  return sitemap;
}

// Generate businesses sitemap with logos
async function generateBusinessesSitemap(supabaseAdmin: ReturnType<typeof createClient>, today: string): Promise<string> {
  const { data: businesses, error } = await supabaseAdmin
    .from('business_accounts')
    .select('id, business_name, description, logo_url, updated_at')
    .eq('is_active', true)
    .eq('status', 'approved')
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching businesses:', error);
  }

  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
`;

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

      sitemap += `  </url>\n`;
    }
  }

  sitemap += `</urlset>`;
  
  console.log(`Businesses sitemap generated: ${businesses?.length || 0} businesses`);
  return sitemap;
}

// Generate collective funds sitemap
async function generateFundsSitemap(supabaseAdmin: ReturnType<typeof createClient>, today: string): Promise<string> {
  const { data: funds, error } = await supabaseAdmin
    .from('collective_funds')
    .select('id, title, description, updated_at, share_token')
    .eq('is_public', true)
    .eq('status', 'active')
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching funds:', error);
  }

  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

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
  
  console.log(`Funds sitemap generated: ${funds?.length || 0} funds`);
  return sitemap;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const type = url.searchParams.get('type') || 'index';
    
    const supabaseAdmin = createClient(
      SUPABASE_URL,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );

    const today = new Date().toISOString().split('T')[0];
    
    let sitemap: string;

    switch (type) {
      case 'index':
        sitemap = generateSitemapIndex(today);
        console.log('Sitemap index generated');
        break;
        
      case 'pages':
        sitemap = generatePagesSitemap(today);
        console.log(`Pages sitemap generated: ${STATIC_PAGES.length} pages`);
        break;
        
      case 'products':
        sitemap = await generateProductsSitemap(supabaseAdmin, today);
        break;
        
      case 'businesses':
        sitemap = await generateBusinessesSitemap(supabaseAdmin, today);
        break;
        
      case 'funds':
        sitemap = await generateFundsSitemap(supabaseAdmin, today);
        break;
        
      default:
        sitemap = generateSitemapIndex(today);
        console.log('Default: Sitemap index generated');
    }

    // Generate ETag for conditional requests
    const etag = generateETag(sitemap);
    const ifNoneMatch = req.headers.get('If-None-Match');

    // Return 304 Not Modified if content hasn't changed
    if (ifNoneMatch === `"${etag}"`) {
      return new Response(null, {
        status: 304,
        headers: {
          ...corsHeaders,
          'Cache-Control': CACHE_HEADERS[type] || CACHE_HEADERS.index,
        },
      });
    }

    return new Response(sitemap, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Cache-Control': CACHE_HEADERS[type] || CACHE_HEADERS.index,
        'ETag': `"${etag}"`,
        'Last-Modified': new Date().toUTCString(),
      },
    });
  } catch (error) {
    console.error('Sitemap generation error:', error);
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`,
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
