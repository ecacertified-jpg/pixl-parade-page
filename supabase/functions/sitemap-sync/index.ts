import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BASE_URL = 'https://joiedevivre-africa.com';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;

// Pages statiques avec priorités
const STATIC_PAGES = [
  { path: '/', priority: '1.0', changefreq: 'daily', hasHreflang: true },
  { path: '/shop', priority: '0.9', changefreq: 'daily', hasHreflang: false },
  { path: '/about', priority: '0.6', changefreq: 'monthly', hasHreflang: false },
  { path: '/contact', priority: '0.5', changefreq: 'monthly', hasHreflang: false },
  { path: '/terms', priority: '0.3', changefreq: 'yearly', hasHreflang: false },
  { path: '/privacy', priority: '0.3', changefreq: 'yearly', hasHreflang: false },
  { path: '/business/register', priority: '0.7', changefreq: 'monthly', hasHreflang: false },
];

// Pages villes SEO
const CITY_PAGES = [
  { path: '/cadeaux-anniversaire-abidjan', priority: '0.8', changefreq: 'monthly' },
  { path: '/cadeaux-anniversaire-bouake', priority: '0.7', changefreq: 'monthly' },
  { path: '/cadeaux-anniversaire-yamoussoukro', priority: '0.7', changefreq: 'monthly' },
  { path: '/cadeaux-anniversaire-san-pedro', priority: '0.7', changefreq: 'monthly' },
  { path: '/cadeaux-anniversaire-korhogo', priority: '0.7', changefreq: 'monthly' },
  { path: '/cadeaux-anniversaire-man', priority: '0.7', changefreq: 'monthly' },
  { path: '/cadeaux-anniversaire-daloa', priority: '0.7', changefreq: 'monthly' },
  { path: '/cadeaux-anniversaire-gagnoa', priority: '0.7', changefreq: 'monthly' },
  { path: '/cadeaux-anniversaire-divo', priority: '0.7', changefreq: 'monthly' },
  { path: '/cadeaux-anniversaire-abengourou', priority: '0.7', changefreq: 'monthly' },
  { path: '/cadeaux-anniversaire-cotonou', priority: '0.7', changefreq: 'monthly' },
];

// Tags hreflang pour pays francophones africains
const HREFLANG_COUNTRIES = [
  { code: 'fr-CI', name: 'Côte d\'Ivoire' },
  { code: 'fr-BJ', name: 'Bénin' },
  { code: 'fr-SN', name: 'Sénégal' },
  { code: 'fr-ML', name: 'Mali' },
  { code: 'fr-CM', name: 'Cameroun' },
  { code: 'fr-TG', name: 'Togo' },
  { code: 'fr-BF', name: 'Burkina Faso' },
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

function truncateCaption(text: string, maxLength = 150): string {
  if (!text) return '';
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (cleaned.length <= maxLength) return escapeXml(cleaned);
  return escapeXml(cleaned.substring(0, maxLength - 3) + '...');
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
}

function formatDate(dateString: string | null): string {
  if (!dateString) return new Date().toISOString().split('T')[0];
  return new Date(dateString).toISOString().split('T')[0];
}

function generateHreflangTags(path: string): string {
  return HREFLANG_COUNTRIES.map(country => 
    `    <xhtml:link rel="alternate" hreflang="${country.code}" href="${BASE_URL}${path}" />`
  ).join('\n') + `\n    <xhtml:link rel="alternate" hreflang="x-default" href="${BASE_URL}${path}" />`;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  images: string[] | null;
  updated_at: string;
}

interface Fund {
  id: string;
  title: string;
  description: string | null;
  share_token: string | null;
  updated_at: string;
}

interface Business {
  id: string;
  business_name: string;
  description: string | null;
  logo_url: string | null;
  updated_at: string;
}

async function generateSitemapXml(supabaseAdmin: ReturnType<typeof createClient>): Promise<{ xml: string; stats: Record<string, number> }> {
  const today = new Date().toISOString().split('T')[0];
  const generatedAt = new Date().toISOString();
  
  // Fetch data from database
  const [productsResult, fundsResult, businessesResult] = await Promise.all([
    supabaseAdmin
      .from('products')
      .select('id, name, description, price, image_url, images, updated_at')
      .eq('is_active', true)
      .order('updated_at', { ascending: false }),
    supabaseAdmin
      .from('collective_funds')
      .select('id, title, description, share_token, updated_at')
      .eq('is_public', true)
      .eq('status', 'active')
      .order('updated_at', { ascending: false }),
    supabaseAdmin
      .from('business_accounts')
      .select('id, business_name, description, logo_url, updated_at')
      .eq('is_active', true)
      .eq('status', 'approved')
      .order('updated_at', { ascending: false }),
  ]);

  const products: Product[] = productsResult.data || [];
  const funds: Fund[] = fundsResult.data || [];
  const businesses: Business[] = businessesResult.data || [];

  const stats = {
    static_pages: STATIC_PAGES.length,
    city_pages: CITY_PAGES.length,
    products: products.length,
    funds: funds.length,
    businesses: businesses.length,
    total_urls: STATIC_PAGES.length + CITY_PAGES.length + products.length + funds.length + businesses.length,
  };

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<!--
  JOIE DE VIVRE - Sitemap Complet
  Généré automatiquement par sitemap-sync
  Date: ${generatedAt}
  
  Statistiques:
  - Pages statiques: ${stats.static_pages}
  - Pages villes SEO: ${stats.city_pages}
  - Produits actifs: ${stats.products}
  - Cagnottes publiques: ${stats.funds}
  - Commerces approuvés: ${stats.businesses}
  - Total URLs: ${stats.total_urls}
-->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">

  <!-- ========== PAGES STATIQUES ========== -->
`;

  // Static pages
  for (const page of STATIC_PAGES) {
    xml += `  <url>
    <loc>${BASE_URL}${page.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
${page.hasHreflang ? generateHreflangTags(page.path) + '\n' : ''}  </url>
`;
  }

  // City pages
  xml += `
  <!-- ========== PAGES SEO VILLES ========== -->
`;
  for (const city of CITY_PAGES) {
    xml += `  <url>
    <loc>${BASE_URL}${city.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${city.changefreq}</changefreq>
    <priority>${city.priority}</priority>
  </url>
`;
  }

  // Products with images
  if (products.length > 0) {
    xml += `
  <!-- ========== PRODUITS AVEC IMAGES (${products.length}) ========== -->
`;
    for (const product of products) {
      const imageUrl = product.image_url || (product.images && product.images.length > 0 ? product.images[0] : null);
      const priceFormatted = formatPrice(product.price);
      
      xml += `  <!-- ${escapeXml(product.name)} - ${priceFormatted} -->
  <url>
    <loc>${BASE_URL}/p/${product.id}</loc>
    <lastmod>${formatDate(product.updated_at)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
`;
      
      if (imageUrl) {
        xml += `    <image:image>
      <image:loc>${escapeXml(imageUrl)}</image:loc>
      <image:title>${escapeXml(product.name)} - ${priceFormatted}</image:title>
      <image:caption>${truncateCaption(product.description || product.name)}</image:caption>
      <image:geo_location>Abidjan, Côte d'Ivoire</image:geo_location>
    </image:image>
`;
      }
      
      xml += `  </url>
`;
    }
  }

  // Funds
  if (funds.length > 0) {
    xml += `
  <!-- ========== CAGNOTTES PUBLIQUES (${funds.length}) ========== -->
`;
    for (const fund of funds) {
      xml += `  <!-- ${escapeXml(fund.title)} -->
  <url>
    <loc>${BASE_URL}/f/${fund.id}</loc>
    <lastmod>${formatDate(fund.updated_at)}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>
`;
    }
  }

  // Businesses
  if (businesses.length > 0) {
    xml += `
  <!-- ========== COMMERCES PARTENAIRES (${businesses.length}) ========== -->
`;
    for (const business of businesses) {
      xml += `  <!-- ${escapeXml(business.business_name)} -->
  <url>
    <loc>${BASE_URL}/business/${business.id}</loc>
    <lastmod>${formatDate(business.updated_at)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
`;
      
      if (business.logo_url) {
        xml += `    <image:image>
      <image:loc>${escapeXml(business.logo_url)}</image:loc>
      <image:title>${escapeXml(business.business_name)} - Commerce partenaire JOIE DE VIVRE</image:title>
      <image:caption>${truncateCaption(business.description || business.business_name)}</image:caption>
      <image:geo_location>Abidjan, Côte d'Ivoire</image:geo_location>
    </image:image>
`;
      }
      
      xml += `  </url>
`;
    }
  }

  xml += `
  <!-- ========== FIN DU SITEMAP ========== -->
  <!-- Total: ${stats.total_urls} URLs indexées -->
  <!-- Généré le ${generatedAt} par sitemap-sync -->
</urlset>`;

  return { xml, stats };
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const format = url.searchParams.get('format') || 'xml';

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      SUPABASE_URL,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } }
    );

    const { xml, stats } = await generateSitemapXml(supabaseAdmin);

    // Return JSON stats only
    if (format === 'json') {
      return new Response(JSON.stringify({
        success: true,
        generated_at: new Date().toISOString(),
        stats,
        usage: {
          xml_endpoint: `${SUPABASE_URL}/functions/v1/sitemap-sync`,
          json_endpoint: `${SUPABASE_URL}/functions/v1/sitemap-sync?format=json`,
          instructions: 'Copiez le contenu XML dans public/sitemap.xml et commitez'
        }
      }, null, 2), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Return XML sitemap
    return new Response(xml, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });

  } catch (error) {
    console.error('Sitemap sync error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      generated_at: new Date().toISOString(),
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
