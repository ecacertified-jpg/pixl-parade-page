import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CheckAccountRequest {
  phone?: string;
  email?: string;
  first_name?: string;
  city?: string;
}

interface ExistingAccount {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  city: string | null;
  avatar_url: string | null;
  created_at: string;
  auth_methods: ('phone' | 'google' | 'email')[];
  is_exact_phone_match: boolean;
  is_name_match: boolean;
}

interface CheckAccountResponse {
  exists: boolean;
  accounts: ExistingAccount[];
  confidence: 'high' | 'medium' | 'low';
  recommendation: 'login' | 'link' | 'create';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const { phone, email, first_name, city }: CheckAccountRequest = await req.json();

    if (!phone && !email) {
      return new Response(
        JSON.stringify({ error: 'Phone or email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const accounts: ExistingAccount[] = [];
    let hasExactPhoneMatch = false;
    let hasNameMatch = false;

    // Normaliser le téléphone
    const normalizedPhone = phone?.replace(/[\s\-\(\)]/g, '') || '';

    // 1. Vérifier par téléphone dans auth.users
    if (normalizedPhone && normalizedPhone.length >= 8) {
      const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers({
        perPage: 100
      });

      if (!authError && authUsers?.users) {
        for (const authUser of authUsers.users) {
          const userPhone = authUser.phone?.replace(/[\s\-\(\)]/g, '') || '';
          
          // Vérifier correspondance de téléphone (exacte ou suffixe)
          const isExactMatch = userPhone === normalizedPhone;
          const isSuffixMatch = normalizedPhone.length >= 8 && 
            (userPhone.endsWith(normalizedPhone.slice(-8)) || normalizedPhone.endsWith(userPhone.slice(-8)));
          
          if (isExactMatch || isSuffixMatch) {
            hasExactPhoneMatch = isExactMatch;
            
            // Récupérer le profil
            const { data: profile } = await supabaseAdmin
              .from('profiles')
              .select('*')
              .eq('user_id', authUser.id)
              .single();

            // Déterminer les méthodes d'auth
            const authMethods: ('phone' | 'google' | 'email')[] = [];
            if (authUser.phone) authMethods.push('phone');
            if (authUser.app_metadata?.provider === 'google' || 
                authUser.identities?.some(i => i.provider === 'google')) {
              authMethods.push('google');
            }
            if (authUser.email && !authUser.identities?.some(i => i.provider === 'google')) {
              authMethods.push('email');
            }

            // Éviter les doublons
            if (!accounts.some(a => a.user_id === authUser.id)) {
              accounts.push({
                user_id: authUser.id,
                first_name: profile?.first_name || authUser.user_metadata?.first_name || null,
                last_name: profile?.last_name || authUser.user_metadata?.last_name || null,
                phone: authUser.phone || profile?.phone || null,
                city: profile?.city || null,
                avatar_url: profile?.avatar_url || authUser.user_metadata?.avatar_url || null,
                created_at: profile?.created_at || authUser.created_at,
                auth_methods: authMethods,
                is_exact_phone_match: isExactMatch,
                is_name_match: false,
              });
            }
          }
        }
      }
    }

    // 2. Vérifier par email
    if (email) {
      const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers({ perPage: 100 });
      
      if (authUsers?.users) {
        const emailMatch = authUsers.users.find(u => 
          u.email?.toLowerCase() === email.toLowerCase()
        );
        
        if (emailMatch && !accounts.some(a => a.user_id === emailMatch.id)) {
          const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('user_id', emailMatch.id)
            .single();

          const authMethods: ('phone' | 'google' | 'email')[] = [];
          if (emailMatch.phone) authMethods.push('phone');
          if (emailMatch.app_metadata?.provider === 'google' || 
              emailMatch.identities?.some(i => i.provider === 'google')) {
            authMethods.push('google');
          }
          if (emailMatch.email) authMethods.push('email');

          accounts.push({
            user_id: emailMatch.id,
            first_name: profile?.first_name || emailMatch.user_metadata?.first_name || null,
            last_name: profile?.last_name || emailMatch.user_metadata?.last_name || null,
            phone: emailMatch.phone || profile?.phone || null,
            city: profile?.city || null,
            avatar_url: profile?.avatar_url || emailMatch.user_metadata?.avatar_url || null,
            created_at: profile?.created_at || emailMatch.created_at,
            auth_methods: authMethods,
            is_exact_phone_match: false,
            is_name_match: false,
          });
        }
      }
    }

    // 3. Vérifier par prénom similaire (si fourni et pas déjà trouvé)
    if (first_name && first_name.length >= 2 && accounts.length === 0) {
      const normalizedFirstName = first_name.trim().toLowerCase();
      
      let query = supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('is_suspended', false)
        .ilike('first_name', `%${normalizedFirstName}%`);

      if (city && city.length > 0) {
        query = query.ilike('city', `%${city}%`);
      }

      const { data: profiles } = await query.limit(5);

      if (profiles && profiles.length > 0) {
        hasNameMatch = true;
        
        for (const profile of profiles) {
          // Récupérer les infos auth
          const { data: authData } = await supabaseAdmin.auth.admin.getUserById(profile.user_id);
          
          if (authData?.user) {
            const authMethods: ('phone' | 'google' | 'email')[] = [];
            if (authData.user.phone) authMethods.push('phone');
            if (authData.user.app_metadata?.provider === 'google' || 
                authData.user.identities?.some(i => i.provider === 'google')) {
              authMethods.push('google');
            }
            if (authData.user.email && !authData.user.identities?.some(i => i.provider === 'google')) {
              authMethods.push('email');
            }

            if (!accounts.some(a => a.user_id === profile.user_id)) {
              accounts.push({
                user_id: profile.user_id,
                first_name: profile.first_name,
                last_name: profile.last_name,
                phone: authData.user.phone || profile.phone,
                city: profile.city,
                avatar_url: profile.avatar_url,
                created_at: profile.created_at,
                auth_methods: authMethods,
                is_exact_phone_match: false,
                is_name_match: true,
              });
            }
          }
        }
      }
    }

    // Calculer la confiance et la recommandation
    let confidence: 'high' | 'medium' | 'low' = 'low';
    let recommendation: 'login' | 'link' | 'create' = 'create';

    if (accounts.length > 0) {
      if (hasExactPhoneMatch) {
        confidence = 'high';
        recommendation = 'login';
      } else if (accounts.some(a => a.is_exact_phone_match)) {
        confidence = 'high';
        recommendation = 'login';
      } else if (hasNameMatch && city) {
        confidence = 'medium';
        recommendation = 'link';
      } else if (hasNameMatch) {
        confidence = 'low';
        recommendation = 'create';
      }
    }

    const response: CheckAccountResponse = {
      exists: accounts.length > 0,
      accounts,
      confidence,
      recommendation,
    };

    console.log(`[check-existing-account] Phone: ${phone?.slice(-4) || 'N/A'}, Found: ${accounts.length}, Confidence: ${confidence}`);

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[check-existing-account] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
