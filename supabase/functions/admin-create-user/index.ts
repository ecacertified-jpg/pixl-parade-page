import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateUserRequest {
  type: 'client' | 'business';
  first_name: string;
  last_name?: string;
  phone: string;
  city?: string;
  birthday?: string;
  // Business specific fields
  business_name?: string;
  business_type?: string;
  business_email?: string;
  business_address?: string;
  business_description?: string;
  is_active?: boolean;
  is_verified?: boolean;
  country_code?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = "https://vaimfeurvzokepqqqrsl.supabase.co";
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseServiceKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY not configured');
    }

    // Get admin token from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create client with anon key to verify the admin user
    const supabaseAnon = createClient(
      supabaseUrl,
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhaW1mZXVydnpva2VwcXFxcnNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyNzgwMjYsImV4cCI6MjA2ODg1NDAyNn0.qX-5TcAzGZ4bk8trpEKbtQql9w0VxvnAvZfMBEkZ504",
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get the requesting user
    const { data: { user: adminUser }, error: authError } = await supabaseAnon.auth.getUser();
    if (authError || !adminUser) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create admin client with service role
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user is super_admin
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from('admin_users')
      .select('role, is_active')
      .eq('user_id', adminUser.id)
      .single();

    if (adminError || !adminData || !adminData.is_active || adminData.role !== 'super_admin') {
      return new Response(
        JSON.stringify({ error: 'Accès réservé aux super administrateurs' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body: CreateUserRequest = await req.json();

    // Validate required fields
    if (!body.first_name || !body.phone) {
      return new Response(
        JSON.stringify({ error: 'Prénom et téléphone sont requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (body.type === 'business' && !body.business_name) {
      return new Response(
        JSON.stringify({ error: 'Le nom du business est requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Normalize phone number
    let normalizedPhone = body.phone.replace(/\s/g, '');
    if (!normalizedPhone.startsWith('+')) {
      normalizedPhone = '+225' + normalizedPhone;
    }

    // Check for existing user with same phone
    const { data: existingUsers } = await supabaseAdmin
      .from('profiles')
      .select('user_id, first_name, last_name')
      .eq('phone', normalizedPhone)
      .limit(1);

    if (existingUsers && existingUsers.length > 0) {
      return new Response(
        JSON.stringify({ 
          error: 'Un utilisateur avec ce numéro de téléphone existe déjà',
          existing_user: existingUsers[0]
        }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate a temporary password
    const tempPassword = generatePassword(12);

    // Create the user via Admin API
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      phone: normalizedPhone,
      password: tempPassword,
      phone_confirm: true, // Auto-confirm phone
      user_metadata: {
        first_name: body.first_name,
        last_name: body.last_name || '',
        phone: normalizedPhone,
        city: body.city || '',
        birthday: body.birthday || null,
        created_by_admin: true,
        created_by_admin_id: adminUser.id
      }
    });

    if (createError) {
      console.error('Error creating user:', createError);
      return new Response(
        JSON.stringify({ error: `Erreur lors de la création: ${createError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const newUserId = newUser.user.id;
    let businessAccountId = null;

    // If it's a business account, create the business entry
    if (body.type === 'business') {
      // Déduire le country_code du téléphone si non fourni
      let businessCountryCode = body.country_code || null;
      if (!businessCountryCode) {
        if (normalizedPhone.startsWith('+229')) businessCountryCode = 'BJ';
        else if (normalizedPhone.startsWith('+221')) businessCountryCode = 'SN';
        else if (normalizedPhone.startsWith('+228')) businessCountryCode = 'TG';
        else if (normalizedPhone.startsWith('+223')) businessCountryCode = 'ML';
        else if (normalizedPhone.startsWith('+226')) businessCountryCode = 'BF';
        else businessCountryCode = 'CI';
      }

      const { data: businessData, error: businessError } = await supabaseAdmin
        .from('business_accounts')
        .insert({
          user_id: newUserId,
          business_name: body.business_name,
          business_type: body.business_type || null,
          email: body.business_email || null,
          address: body.business_address || null,
          description: body.business_description || null,
          is_active: true,
          is_verified: body.is_verified === true,
          status: 'active',
          country_code: businessCountryCode,
        })
        .select('id')
        .single();

      if (businessError) {
        console.error('Error creating business account:', businessError);
        // Don't fail completely, user was created
      } else {
        businessAccountId = businessData.id;
      }
    }

    // Log the action
    await supabaseAdmin
      .from('admin_audit_logs')
      .insert({
        admin_user_id: adminUser.id,
        action_type: body.type === 'business' ? 'create_business_account' : 'create_client_account',
        target_type: 'user',
        target_id: newUserId,
        description: body.type === 'business' 
          ? `Création du compte prestataire "${body.business_name}" pour ${body.first_name} ${body.last_name || ''}`
          : `Création du compte client pour ${body.first_name} ${body.last_name || ''}`,
        metadata: {
          phone: normalizedPhone,
          type: body.type,
          business_account_id: businessAccountId,
          city: body.city
        }
      });

    return new Response(
      JSON.stringify({
        success: true,
        user_id: newUserId,
        business_account_id: businessAccountId,
        message: body.type === 'business' 
          ? 'Compte prestataire créé avec succès'
          : 'Compte client créé avec succès',
        temp_password: tempPassword // In production, you might want to send this via SMS instead
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in admin-create-user:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Une erreur est survenue' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function generatePassword(length: number): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}
