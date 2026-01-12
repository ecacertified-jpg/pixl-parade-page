import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProfileData {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  birthday: string | null;
  city: string | null;
  avatar_url: string | null;
  created_at: string;
  is_suspended: boolean;
}

interface BusinessData {
  id: string;
  user_id: string;
  business_name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  is_verified: boolean;
  status: string;
  created_at: string;
}

interface DuplicateGroup {
  type: 'client' | 'business';
  match_criteria: string[];
  confidence: 'high' | 'medium' | 'low';
  account_ids: string[];
  primary_user_id: string | null;
  metadata: {
    accounts: Array<{
      user_id: string;
      name: string;
      phone: string | null;
      created_at: string;
      data_counts: {
        contacts?: number;
        funds?: number;
        contributions?: number;
        posts?: number;
        orders?: number;
        products?: number;
      };
    }>;
  };
}

function normalizePhone(phone: string | null): string {
  if (!phone) return '';
  return phone.replace(/[\s\-\(\)\.+]/g, '').slice(-8);
}

function normalizeString(str: string | null): string {
  if (!str) return '';
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Verify admin authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify super_admin role
    const { data: adminUser, error: adminError } = await supabaseAdmin
      .from('admin_users')
      .select('role, is_active')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (adminError || !adminUser || adminUser.role !== 'super_admin') {
      return new Response(
        JSON.stringify({ error: 'Super admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const duplicateGroups: DuplicateGroup[] = [];
    const processedUserIds = new Set<string>();

    // ==========================================
    // 1. SCAN CLIENT DUPLICATES
    // ==========================================

    // Fetch all active profiles
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('is_suspended', false)
      .order('created_at', { ascending: true });

    if (profilesError) throw profilesError;

    // Group by phone number (high confidence)
    const phoneGroups = new Map<string, ProfileData[]>();
    for (const profile of profiles || []) {
      const normalizedPhone = normalizePhone(profile.phone);
      if (normalizedPhone && normalizedPhone.length >= 8) {
        if (!phoneGroups.has(normalizedPhone)) {
          phoneGroups.set(normalizedPhone, []);
        }
        phoneGroups.get(normalizedPhone)!.push(profile);
      }
    }

    // Create duplicate groups from phone matches
    for (const [phone, group] of phoneGroups) {
      if (group.length > 1) {
        const userIds = group.map(p => p.user_id);
        if (userIds.some(id => processedUserIds.has(id))) continue;

        // Enrich with data counts
        const enrichedAccounts = await Promise.all(group.map(async (profile) => {
          const [contacts, funds, contributions, posts] = await Promise.all([
            supabaseAdmin.from('contacts').select('id', { count: 'exact', head: true }).eq('user_id', profile.user_id),
            supabaseAdmin.from('collective_funds').select('id', { count: 'exact', head: true }).eq('creator_id', profile.user_id),
            supabaseAdmin.from('fund_contributions').select('id', { count: 'exact', head: true }).eq('contributor_id', profile.user_id),
            supabaseAdmin.from('posts').select('id', { count: 'exact', head: true }).eq('user_id', profile.user_id),
          ]);

          return {
            user_id: profile.user_id,
            name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Sans nom',
            phone: profile.phone,
            created_at: profile.created_at,
            data_counts: {
              contacts: contacts.count || 0,
              funds: funds.count || 0,
              contributions: contributions.count || 0,
              posts: posts.count || 0,
            },
          };
        }));

        // Recommend primary (oldest with most data)
        const sortedAccounts = enrichedAccounts.sort((a, b) => {
          const aTotal = Object.values(a.data_counts).reduce((sum, n) => sum + (n || 0), 0);
          const bTotal = Object.values(b.data_counts).reduce((sum, n) => sum + (n || 0), 0);
          if (aTotal !== bTotal) return bTotal - aTotal;
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        });

        duplicateGroups.push({
          type: 'client',
          match_criteria: ['phone'],
          confidence: 'high',
          account_ids: userIds,
          primary_user_id: sortedAccounts[0].user_id,
          metadata: { accounts: enrichedAccounts },
        });

        userIds.forEach(id => processedUserIds.add(id));
      }
    }

    // Group by first_name + birthday (high confidence)
    const nameAndBirthdayGroups = new Map<string, ProfileData[]>();
    for (const profile of profiles || []) {
      if (profile.first_name && profile.birthday && !processedUserIds.has(profile.user_id)) {
        const key = `${normalizeString(profile.first_name)}|${profile.birthday}`;
        if (!nameAndBirthdayGroups.has(key)) {
          nameAndBirthdayGroups.set(key, []);
        }
        nameAndBirthdayGroups.get(key)!.push(profile);
      }
    }

    for (const [key, group] of nameAndBirthdayGroups) {
      if (group.length > 1) {
        const userIds = group.map(p => p.user_id);

        const enrichedAccounts = await Promise.all(group.map(async (profile) => {
          const [contacts, funds, contributions, posts] = await Promise.all([
            supabaseAdmin.from('contacts').select('id', { count: 'exact', head: true }).eq('user_id', profile.user_id),
            supabaseAdmin.from('collective_funds').select('id', { count: 'exact', head: true }).eq('creator_id', profile.user_id),
            supabaseAdmin.from('fund_contributions').select('id', { count: 'exact', head: true }).eq('contributor_id', profile.user_id),
            supabaseAdmin.from('posts').select('id', { count: 'exact', head: true }).eq('user_id', profile.user_id),
          ]);

          return {
            user_id: profile.user_id,
            name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Sans nom',
            phone: profile.phone,
            created_at: profile.created_at,
            data_counts: {
              contacts: contacts.count || 0,
              funds: funds.count || 0,
              contributions: contributions.count || 0,
              posts: posts.count || 0,
            },
          };
        }));

        const sortedAccounts = enrichedAccounts.sort((a, b) => {
          const aTotal = Object.values(a.data_counts).reduce((sum, n) => sum + (n || 0), 0);
          const bTotal = Object.values(b.data_counts).reduce((sum, n) => sum + (n || 0), 0);
          if (aTotal !== bTotal) return bTotal - aTotal;
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        });

        duplicateGroups.push({
          type: 'client',
          match_criteria: ['first_name', 'birthday'],
          confidence: 'high',
          account_ids: userIds,
          primary_user_id: sortedAccounts[0].user_id,
          metadata: { accounts: enrichedAccounts },
        });

        userIds.forEach(id => processedUserIds.add(id));
      }
    }

    // ==========================================
    // 2. SCAN BUSINESS DUPLICATES
    // ==========================================

    const processedBusinessIds = new Set<string>();

    const { data: businesses, error: businessError } = await supabaseAdmin
      .from('business_accounts')
      .select('*')
      .order('created_at', { ascending: true });

    if (businessError) throw businessError;

    // Group by normalized business name
    const businessNameGroups = new Map<string, BusinessData[]>();
    for (const business of businesses || []) {
      const normalizedName = normalizeString(business.business_name);
      if (normalizedName && normalizedName.length >= 3) {
        if (!businessNameGroups.has(normalizedName)) {
          businessNameGroups.set(normalizedName, []);
        }
        businessNameGroups.get(normalizedName)!.push(business);
      }
    }

    for (const [name, group] of businessNameGroups) {
      if (group.length > 1) {
        const businessIds = group.map(b => b.id);
        if (businessIds.some(id => processedBusinessIds.has(id))) continue;

        const enrichedAccounts = await Promise.all(group.map(async (business) => {
          const [products, orders, funds] = await Promise.all([
            supabaseAdmin.from('products').select('id', { count: 'exact', head: true }).eq('business_id', business.id),
            supabaseAdmin.from('business_orders').select('id', { count: 'exact', head: true }).eq('business_account_id', business.id),
            supabaseAdmin.from('collective_funds').select('id', { count: 'exact', head: true }).eq('created_by_business_id', business.id),
          ]);

          return {
            user_id: business.user_id,
            name: business.business_name,
            phone: business.phone,
            created_at: business.created_at,
            data_counts: {
              products: products.count || 0,
              orders: orders.count || 0,
              funds: funds.count || 0,
            },
          };
        }));

        // Recommend primary (verified first, then most data, then oldest)
        const sortedAccounts = enrichedAccounts.sort((a, b) => {
          const businessA = group.find(g => g.user_id === a.user_id)!;
          const businessB = group.find(g => g.user_id === b.user_id)!;
          
          // Verified first
          if (businessA.is_verified && !businessB.is_verified) return -1;
          if (!businessA.is_verified && businessB.is_verified) return 1;

          const aTotal = Object.values(a.data_counts).reduce((sum, n) => sum + (n || 0), 0);
          const bTotal = Object.values(b.data_counts).reduce((sum, n) => sum + (n || 0), 0);
          if (aTotal !== bTotal) return bTotal - aTotal;
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        });

        duplicateGroups.push({
          type: 'business',
          match_criteria: ['business_name'],
          confidence: 'high',
          account_ids: group.map(b => b.user_id),
          primary_user_id: sortedAccounts[0].user_id,
          metadata: { accounts: enrichedAccounts },
        });

        businessIds.forEach(id => processedBusinessIds.add(id));
      }
    }

    // Group by phone
    const businessPhoneGroups = new Map<string, BusinessData[]>();
    for (const business of businesses || []) {
      if (processedBusinessIds.has(business.id)) continue;
      const normalizedPhone = normalizePhone(business.phone);
      if (normalizedPhone && normalizedPhone.length >= 8) {
        if (!businessPhoneGroups.has(normalizedPhone)) {
          businessPhoneGroups.set(normalizedPhone, []);
        }
        businessPhoneGroups.get(normalizedPhone)!.push(business);
      }
    }

    for (const [phone, group] of businessPhoneGroups) {
      if (group.length > 1) {
        const enrichedAccounts = await Promise.all(group.map(async (business) => {
          const [products, orders, funds] = await Promise.all([
            supabaseAdmin.from('products').select('id', { count: 'exact', head: true }).eq('business_id', business.id),
            supabaseAdmin.from('business_orders').select('id', { count: 'exact', head: true }).eq('business_account_id', business.id),
            supabaseAdmin.from('collective_funds').select('id', { count: 'exact', head: true }).eq('created_by_business_id', business.id),
          ]);

          return {
            user_id: business.user_id,
            name: business.business_name,
            phone: business.phone,
            created_at: business.created_at,
            data_counts: {
              products: products.count || 0,
              orders: orders.count || 0,
              funds: funds.count || 0,
            },
          };
        }));

        const sortedAccounts = enrichedAccounts.sort((a, b) => {
          const businessA = group.find(g => g.user_id === a.user_id)!;
          const businessB = group.find(g => g.user_id === b.user_id)!;
          
          if (businessA.is_verified && !businessB.is_verified) return -1;
          if (!businessA.is_verified && businessB.is_verified) return 1;

          const aTotal = Object.values(a.data_counts).reduce((sum, n) => sum + (n || 0), 0);
          const bTotal = Object.values(b.data_counts).reduce((sum, n) => sum + (n || 0), 0);
          if (aTotal !== bTotal) return bTotal - aTotal;
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        });

        duplicateGroups.push({
          type: 'business',
          match_criteria: ['phone'],
          confidence: 'high',
          account_ids: group.map(b => b.user_id),
          primary_user_id: sortedAccounts[0].user_id,
          metadata: { accounts: enrichedAccounts },
        });
      }
    }

    // ==========================================
    // 3. SAVE TO DATABASE
    // ==========================================

    // Get existing pending/reviewed duplicates to avoid recreating
    const { data: existingDuplicates } = await supabaseAdmin
      .from('detected_duplicate_accounts')
      .select('account_ids, status')
      .in('status', ['pending', 'reviewed']);

    const existingAccountSets = (existingDuplicates || []).map(d => 
      new Set(d.account_ids)
    );

    let insertedCount = 0;
    for (const group of duplicateGroups) {
      // Check if this group already exists
      const groupSet = new Set(group.account_ids);
      const alreadyExists = existingAccountSets.some(existingSet => {
        if (existingSet.size !== groupSet.size) return false;
        for (const id of groupSet) {
          if (!existingSet.has(id)) return false;
        }
        return true;
      });

      if (!alreadyExists) {
        const { error: insertError } = await supabaseAdmin
          .from('detected_duplicate_accounts')
          .insert({
            type: group.type,
            match_criteria: group.match_criteria,
            confidence: group.confidence,
            account_ids: group.account_ids,
            primary_user_id: group.primary_user_id,
            metadata: group.metadata,
            status: 'pending',
          });

        if (!insertError) {
          insertedCount++;
        }
      }
    }

    // Log the scan action
    await supabaseAdmin.from('admin_audit_logs').insert({
      admin_user_id: user.id,
      action_type: 'scan_duplicates',
      target_type: 'system',
      description: `Scan des doublons: ${duplicateGroups.length} groupes détectés, ${insertedCount} nouveaux ajoutés`,
      metadata: {
        total_detected: duplicateGroups.length,
        new_inserted: insertedCount,
        client_groups: duplicateGroups.filter(g => g.type === 'client').length,
        business_groups: duplicateGroups.filter(g => g.type === 'business').length,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        total_detected: duplicateGroups.length,
        new_inserted: insertedCount,
        client_groups: duplicateGroups.filter(g => g.type === 'client').length,
        business_groups: duplicateGroups.filter(g => g.type === 'business').length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error scanning duplicates:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
