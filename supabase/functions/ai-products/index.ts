import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json; charset=utf-8',
};

const BASE_URL = 'https://joiedevivre-africa.com';

interface ProductItem {
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
  popularity: { score: number; views: number; orders: number; favorites: number };
  availability: string;
  updatedAt: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    
    // Parse query parameters
    const category = url.searchParams.get('category');
    const minPrice = url.searchParams.get('min_price');
    const maxPrice = url.searchParams.get('max_price');
    const sort = url.searchParams.get('sort') || 'popularity';
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const businessId = url.searchParams.get('business_id');

    const supabaseAdmin = createClient(
      'https://vaimfeurvzokepqqqrsl.supabase.co',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );

    // Build query
    let query = supabaseAdmin
      .from('products')
      .select(`
        id, name, description, price, currency, image_url,
        view_count, order_count, favorites_count, popularity_score,
        updated_at, business_id,
        business_accounts!inner(id, business_name),
        categories(name)
      `)
      .eq('is_active', true);

    // Apply filters
    if (category) {
      query = query.ilike('categories.name', `%${category}%`);
    }
    if (minPrice) {
      query = query.gte('price', parseFloat(minPrice));
    }
    if (maxPrice) {
      query = query.lte('price', parseFloat(maxPrice));
    }
    if (businessId) {
      query = query.eq('business_id', businessId);
    }

    // Apply sorting
    switch (sort) {
      case 'price_asc':
        query = query.order('price', { ascending: true });
        break;
      case 'price_desc':
        query = query.order('price', { ascending: false });
        break;
      case 'newest':
        query = query.order('created_at', { ascending: false });
        break;
      default: // popularity
        query = query.order('popularity_score', { ascending: false });
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: products, error } = await query;

    if (error) throw error;

    // Transform to Schema.org format
    const productItems: ProductItem[] = (products || []).map((p: any) => ({
      '@type': 'Product',
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
        favorites: p.favorites_count || 0
      },
      availability: 'in_stock',
      updatedAt: p.updated_at?.split('T')[0] || new Date().toISOString().split('T')[0]
    }));

    const response = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Joie de Vivre - Products API',
      numberOfItems: productItems.length,
      generatedAt: new Date().toISOString(),
      filters: {
        category: category || null,
        minPrice: minPrice ? parseFloat(minPrice) : null,
        maxPrice: maxPrice ? parseFloat(maxPrice) : null,
        sort,
        businessId: businessId || null
      },
      pagination: { limit, offset, hasMore: productItems.length === limit },
      itemListElement: productItems,
      metadata: {
        currency: 'XOF',
        documentation: `${BASE_URL}/llms-full.txt`
      }
    };

    return new Response(JSON.stringify(response, null, 2), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Cache-Control': 'public, max-age=300, s-maxage=300',
      },
    });
  } catch (error) {
    console.error('ai-products error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to fetch products',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, null, 2), { status: 500, headers: corsHeaders });
  }
});
