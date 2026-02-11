import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface VerifyOtpRequest {
  phone: string;
  code: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    const { phone, code }: VerifyOtpRequest = await req.json();

    // Validate inputs
    if (!phone || !code) {
      return new Response(
        JSON.stringify({ success: false, error: 'missing_fields', message: 'Téléphone et code requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
      return new Response(
        JSON.stringify({ success: false, error: 'invalid_code', message: 'Le code doit contenir 6 chiffres' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find the OTP record
    const { data: otpRecord, error: fetchError } = await supabaseAdmin
      .from('whatsapp_otp_codes')
      .select('*')
      .eq('phone', phone)
      .is('verified_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError) {
      console.error("Error fetching OTP:", fetchError);
      return new Response(
        JSON.stringify({ success: false, error: 'fetch_error', message: 'Erreur lors de la vérification' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!otpRecord) {
      return new Response(
        JSON.stringify({ success: false, error: 'no_otp', message: 'Aucun code valide trouvé. Veuillez en demander un nouveau.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check max attempts
    if (otpRecord.attempts >= otpRecord.max_attempts) {
      // Delete the OTP record
      await supabaseAdmin
        .from('whatsapp_otp_codes')
        .delete()
        .eq('id', otpRecord.id);

      return new Response(
        JSON.stringify({ success: false, error: 'max_attempts', message: 'Trop de tentatives. Veuillez demander un nouveau code.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if code matches
    if (otpRecord.code !== code) {
      // Increment attempts
      await supabaseAdmin
        .from('whatsapp_otp_codes')
        .update({ attempts: otpRecord.attempts + 1 })
        .eq('id', otpRecord.id);

      const remainingAttempts = otpRecord.max_attempts - otpRecord.attempts - 1;
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'invalid_code', 
          message: `Code incorrect. ${remainingAttempts} tentative(s) restante(s).`,
          remaining_attempts: remainingAttempts
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Code is valid - mark as verified
    await supabaseAdmin
      .from('whatsapp_otp_codes')
      .update({ verified_at: new Date().toISOString() })
      .eq('id', otpRecord.id);

    // Get or create user
    const metadata = otpRecord.user_metadata || {};
    
    // Check if user exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.phone === phone);

    let user;
    let isNewUser = false;

    if (existingUser) {
      user = existingUser;
      console.log(`Existing user found: ${user.id}`);
    } else {
      // Create new user
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        phone,
        phone_confirm: true,
      user_metadata: {
          first_name: metadata.first_name,
          last_name: metadata.last_name,
          city: metadata.city,
          birthday: metadata.birthday,
          is_business: metadata.is_business,
          phone,
        },
      });

      if (createError) {
        console.error("Error creating user:", createError);
        return new Response(
          JSON.stringify({ success: false, error: 'user_creation_failed', message: 'Impossible de créer le compte' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      user = newUser.user;
      isNewUser = true;
      console.log(`New user created: ${user.id}`);

      // Explicitly set country_code based on phone prefix
      const detectedCountry = phone.startsWith('+229') ? 'BJ'
        : phone.startsWith('+221') ? 'SN'
        : phone.startsWith('+225') ? 'CI' : 'CI';

      await supabaseAdmin
        .from('profiles')
        .update({ country_code: detectedCountry, phone: phone })
        .eq('user_id', user.id);
    }

    // Generate session tokens
    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: `${phone.replace(/\+/g, '')}@phone.joiedevivre.app`,
      options: {
        data: { phone }
      }
    });

    // Use a different approach - create a session directly
    // Since we can't directly create a session, we'll use signInWithPassword with a generated password
    
    // First, set a temporary password for the user
    const tempPassword = crypto.randomUUID();
    await supabaseAdmin.auth.admin.updateUserById(user.id, {
      password: tempPassword
    });

    // Now sign in with that password to get tokens
    const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      phone,
      password: tempPassword,
    });

    if (signInError || !signInData.session) {
      console.error("Error creating session:", signInError);
      
      // Fallback: return user info without session, let client handle it
      return new Response(
        JSON.stringify({ 
          success: true, 
          user_id: user.id,
          is_new_user: isNewUser,
          message: 'Vérification réussie',
          // Indicate that client should use alternative auth method
          requires_reauth: true,
          phone
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Clean up - delete verified OTP
    await supabaseAdmin
      .from('whatsapp_otp_codes')
      .delete()
      .eq('id', otpRecord.id);

    console.log(`WhatsApp OTP verified for ${phone}, session created`);

    return new Response(
      JSON.stringify({ 
        success: true,
        user_id: user.id,
        is_new_user: isNewUser,
        access_token: signInData.session.access_token,
        refresh_token: signInData.session.refresh_token,
        expires_in: signInData.session.expires_in,
        message: 'Connexion réussie'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ success: false, error: 'internal_error', message: 'Une erreur inattendue s\'est produite' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
