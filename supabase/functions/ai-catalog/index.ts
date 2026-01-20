import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json; charset=utf-8',
};

const BASE_URL = 'https://joiedevivre-africa.com';
const SUPABASE_URL = 'https://vaimfeurvzokepqqqrsl.supabase.co';

interface ProductCatalogItem {
  '@type': 'Product';
  id: string;
  name: string;
  description: string | null;
  url: string;
  price: number;
  currency: string;
  image: string | null;
  category: string | null;
  seller: { name: string; id: string } | null;
  popularity: {
    score: number;
    views: number;
    orders: number;
    favorites: number;
    rank: number;
  };
  availability: string;
  updatedAt: string;
}

interface BusinessCatalogItem {
  '@type': 'LocalBusiness';
  id: string;
  name: string;
  url: string;
  description: string | null;
  businessType: string | null;
  logo: string | null;
  location: string | null;
  productCount: number;
  isVerified: boolean;
  updatedAt: string;
}

interface CategoryCount {
  name: string;
  productCount: number;
}

async function generateAICatalog(supabaseAdmin: ReturnType<typeof createClient>) {
  const today = new Date().toISOString();
  
  // Fetch top 50 products by popularity
  const { data: products, error: productsError } = await supabaseAdmin
    .from('products')
    .select(`
      id, name, description, price, currency, image_url,
      view_count, order_count, favorites_count, popularity_score,
      updated_at, is_active, business_id,
      business_accounts!inner(id, business_name),
      categories(name)
    `)
    .eq('is_active', true)
    .order('popularity_score', { ascending: false })
    .limit(50);

  if (productsError) {
    console.error('Error fetching products:', productsError);
  }

  // Fetch top 20 approved businesses
  const { data: businesses, error: businessesError } = await supabaseAdmin
    .from('business_accounts')
    .select('id, business_name, description, business_type, logo_url, address, updated_at, is_verified')
    .eq('is_active', true)
    .eq('status', 'approved')
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })
    .limit(20);

  if (businessesError) {
    console.error('Error fetching businesses:', businessesError);
  }

  // Count products per business for active products
  const { data: productCounts, error: countsError } = await supabaseAdmin
    .from('products')
    .select('business_id')
    .eq('is_active', true);

  if (countsError) {
    console.error('Error fetching product counts:', countsError);
  }

  const businessProductCounts: Record<string, number> = (productCounts || []).reduce((acc: Record<string, number>, p: { business_id: string }) => {
    acc[p.business_id] = (acc[p.business_id] || 0) + 1;
    return acc;
  }, {});

  // Aggregate categories
  const categoryMap: Record<string, number> = {};
  (products || []).forEach((p: { categories?: { name: string } | null }) => {
    const catName = p.categories?.name;
    if (catName) {
      categoryMap[catName] = (categoryMap[catName] || 0) + 1;
    }
  });

  const categories: CategoryCount[] = Object.entries(categoryMap)
    .map(([name, count]) => ({ name, productCount: count }))
    .sort((a, b) => b.productCount - a.productCount);

  // Build product catalog items
  const productItems: ProductCatalogItem[] = (products || []).map((p: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    currency: string | null;
    image_url: string | null;
    view_count: number | null;
    order_count: number | null;
    favorites_count: number | null;
    popularity_score: number | null;
    updated_at: string | null;
    business_accounts: { id: string; business_name: string } | null;
    categories: { name: string } | null;
  }, idx: number) => ({
    '@type': 'Product' as const,
    id: p.id,
    name: p.name,
    description: p.description,
    url: `${BASE_URL}/p/${p.id}`,
    price: p.price,
    currency: p.currency || 'XOF',
    image: p.image_url,
    category: p.categories?.name || null,
    seller: p.business_accounts ? {
      name: p.business_accounts.business_name,
      id: p.business_accounts.id
    } : null,
    popularity: {
      score: p.popularity_score || 0,
      views: p.view_count || 0,
      orders: p.order_count || 0,
      favorites: p.favorites_count || 0,
      rank: idx + 1
    },
    availability: 'in_stock',
    updatedAt: p.updated_at?.split('T')[0] || today.split('T')[0]
  }));

  // Build business catalog items
  const businessItems: BusinessCatalogItem[] = (businesses || []).map((b: {
    id: string;
    business_name: string;
    description: string | null;
    business_type: string | null;
    logo_url: string | null;
    address: string | null;
    updated_at: string | null;
    is_verified: boolean | null;
  }) => ({
    '@type': 'LocalBusiness' as const,
    id: b.id,
    name: b.business_name,
    url: `${BASE_URL}/b/${b.id}`,
    description: b.description,
    businessType: b.business_type,
    logo: b.logo_url,
    location: b.address,
    productCount: businessProductCounts[b.id] || 0,
    isVerified: b.is_verified || false,
    updatedAt: b.updated_at?.split('T')[0] || today.split('T')[0]
  }));

  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Joie de Vivre - AI Catalog',
    description: 'Popular products and businesses from African artisans. Collaborative gift platform for French-speaking Africa.',
    numberOfItems: productItems.length + businessItems.length,
    generatedAt: today,
    platform: {
      name: 'Joie de Vivre',
      url: BASE_URL,
      description: 'Collaborative gift platform for French-speaking Africa. Create collective gift funds for birthdays, weddings, and celebrations.',
      markets: ["Côte d'Ivoire", 'Bénin', 'Sénégal', 'Mali', 'Cameroun'],
      currency: 'XOF',
      language: 'fr',
      paymentMethods: ['Orange Money', 'MTN Mobile Money', 'Wave', 'Flooz']
    },
    products: productItems,
    businesses: businessItems,
    categories: categories,
    metadata: {
      totalProducts: productItems.length,
      totalBusinesses: businessItems.length,
      totalCategories: categories.length,
      cacheMaxAge: 3600,
      documentation: `${BASE_URL}/llms-full.txt`,
      xmlSitemap: `${SUPABASE_URL}/functions/v1/sitemap-ai-generator`,
      openApiSpec: `${BASE_URL}/openapi.yaml`
    }
  };
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

    const catalog = await generateAICatalog(supabaseAdmin);

    return new Response(JSON.stringify(catalog, null, 2), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('AI Catalog generation error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to generate catalog',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, null, 2), { 
      status: 500, 
      headers: corsHeaders 
    });
  }
});
