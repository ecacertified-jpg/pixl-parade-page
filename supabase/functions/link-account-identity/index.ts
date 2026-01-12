import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LinkAccountRequest {
  current_user_id: string;
  target_phone?: string;
  verification_code?: string;
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

    // Vérifier l'authentification
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { 
        auth: { persistSession: false },
        global: { headers: { Authorization: authHeader } }
      }
    );

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { current_user_id, target_phone }: LinkAccountRequest = await req.json();

    // Vérifier que l'utilisateur actuel correspond
    if (user.id !== current_user_id) {
      return new Response(
        JSON.stringify({ error: 'User ID mismatch' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Récupérer les informations de l'utilisateur actuel
    const { data: currentUserData } = await supabaseAdmin.auth.admin.getUserById(current_user_id);
    if (!currentUserData?.user) {
      return new Response(
        JSON.stringify({ error: 'Current user not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const currentAuthMethods: string[] = [];
    if (currentUserData.user.phone) currentAuthMethods.push('phone');
    if (currentUserData.user.identities?.some(i => i.provider === 'google')) currentAuthMethods.push('google');
    if (currentUserData.user.email && !currentUserData.user.identities?.some(i => i.provider === 'google')) currentAuthMethods.push('email');

    // Si on veut ajouter un téléphone
    if (target_phone) {
      const normalizedPhone = target_phone.replace(/[\s\-\(\)]/g, '');
      
      // Vérifier si ce téléphone n'est pas déjà utilisé par un autre compte
      const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
      const existingUser = authUsers?.users?.find(u => {
        const userPhone = u.phone?.replace(/[\s\-\(\)]/g, '') || '';
        return userPhone === normalizedPhone && u.id !== current_user_id;
      });

      if (existingUser) {
        // Le téléphone existe déjà sur un autre compte
        // Option 1: Proposer de fusionner les comptes
        // Option 2: Retourner une erreur
        
        return new Response(
          JSON.stringify({ 
            error: 'phone_already_used',
            message: 'Ce numéro de téléphone est déjà lié à un autre compte',
            existing_user_id: existingUser.id,
            can_merge: true,
          }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Ajouter le téléphone à l'utilisateur actuel
      const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        current_user_id,
        { phone: normalizedPhone }
      );

      if (updateError) {
        console.error('[link-account-identity] Error updating phone:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to update phone' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Mettre à jour le profil
      await supabaseAdmin
        .from('profiles')
        .update({ phone: normalizedPhone })
        .eq('user_id', current_user_id);

      // Log dans admin_audit_logs si l'utilisateur est admin
      const { data: adminUser } = await supabaseAdmin
        .from('admin_users')
        .select('id')
        .eq('user_id', current_user_id)
        .eq('is_active', true)
        .maybeSingle();

      if (adminUser) {
        await supabaseAdmin.from('admin_audit_logs').insert({
          admin_user_id: current_user_id,
          action_type: 'link_phone',
          target_type: 'user',
          target_id: current_user_id,
          description: `Linked phone number ${normalizedPhone.slice(-4)} to account`,
        });
      }

      console.log(`[link-account-identity] Successfully linked phone to user ${current_user_id}`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Phone number linked successfully',
          auth_methods: [...currentAuthMethods, 'phone'],
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        current_auth_methods: currentAuthMethods,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[link-account-identity] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
