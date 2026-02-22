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
    
    // Normalize phone formats (auth.users may store with or without +)
    const phoneWithPlus = phone.startsWith('+') ? phone : `+${phone}`;
    const phoneWithoutPlus = phone.replace(/^\+/, '');
    
    // 1. Search in profiles table first (most reliable)
    let existingUser = null;
    const { data: profileData } = await supabaseAdmin
      .from('profiles')
      .select('user_id')
      .or(`phone.eq.${phoneWithPlus},phone.eq.${phoneWithoutPlus}`)
      .limit(1)
      .maybeSingle();

    if (profileData?.user_id) {
      const { data: userData } = await supabaseAdmin.auth.admin.getUserById(profileData.user_id);
      if (userData?.user) {
        existingUser = userData.user;
        console.log(`User found via profiles table: ${existingUser.id}`);
      }
    }

    // 2. If not in profiles, try listUsers with both formats
    if (!existingUser) {
      const { data: listData1 } = await supabaseAdmin.auth.admin.listUsers({ filter: phoneWithPlus });
      existingUser = listData1?.users?.find(u => u.phone === phoneWithPlus || u.phone === phoneWithoutPlus) || null;

      if (!existingUser) {
        const { data: listData2 } = await supabaseAdmin.auth.admin.listUsers({ filter: phoneWithoutPlus });
        existingUser = listData2?.users?.find(u => u.phone === phoneWithPlus || u.phone === phoneWithoutPlus) || null;
      }
      if (existingUser) {
        console.log(`User found via listUsers: ${existingUser.id}`);
      }
    }

    let user;
    let isNewUser = false;

    if (existingUser) {
      user = existingUser;
      console.log(`Existing user found: ${user.id}`);
    } else {
      // Create new user
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        phone: phoneWithPlus,
        phone_confirm: true,
        user_metadata: {
          first_name: metadata.first_name,
          last_name: metadata.last_name,
          city: metadata.city,
          birthday: metadata.birthday,
          is_business: metadata.is_business,
          phone: phoneWithPlus,
        },
      });

      if (createError) {
        if (createError.message?.includes('phone_exists') || (createError as any).code === 'phone_exists') {
          console.log("phone_exists detected, searching with both formats...");
          
          const { data: retryProfile } = await supabaseAdmin
            .from('profiles')
            .select('user_id')
            .or(`phone.eq.${phoneWithPlus},phone.eq.${phoneWithoutPlus}`)
            .limit(1)
            .maybeSingle();

          if (retryProfile?.user_id) {
            const { data: ud } = await supabaseAdmin.auth.admin.getUserById(retryProfile.user_id);
            if (ud?.user) existingUser = ud.user;
          }

          if (!existingUser) {
            const { data: retryData } = await supabaseAdmin.auth.admin.listUsers({ filter: phoneWithoutPlus, page: 1, perPage: 1000 });
            existingUser = retryData?.users?.find(u => u.phone === phoneWithPlus || u.phone === phoneWithoutPlus) || null;
          }
          
          if (existingUser) {
            user = existingUser;
            console.log(`User found on retry: ${user.id}`);
          } else {
            console.error("User exists but cannot be found even after retry");
            return new Response(
              JSON.stringify({ success: false, error: 'user_lookup_failed', message: 'Erreur de recherche utilisateur. Veuillez réessayer.' }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        } else {
          console.error("Error creating user:", createError);
          return new Response(
            JSON.stringify({ success: false, error: 'user_creation_failed', message: 'Impossible de créer le compte' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } else {
        user = newUser.user;
        isNewUser = true;
        console.log(`New user created: ${user.id}`);

        const detectedCountry = phoneWithPlus.startsWith('+229') ? 'BJ'
          : phoneWithPlus.startsWith('+221') ? 'SN'
          : phoneWithPlus.startsWith('+228') ? 'TG'
          : phoneWithPlus.startsWith('+223') ? 'ML'
          : phoneWithPlus.startsWith('+226') ? 'BF'
          : phoneWithPlus.startsWith('+225') ? 'CI' : 'CI';

        await supabaseAdmin
          .from('profiles')
          .update({ country_code: detectedCountry, phone: phoneWithPlus })
          .eq('user_id', user.id);
      }
    }

    // Generate session via magiclink + verifyOtp (no temp password)
    const emailForPhone = `${phone.replace(/\+/g, '')}@phone.joiedevivre.app`;

    // Ensure the user has this email set (needed for magiclink)
    await supabaseAdmin.auth.admin.updateUserById(user.id, {
      email: emailForPhone,
    });

    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: emailForPhone,
    });

    if (linkError || !linkData?.properties?.action_link) {
      console.error("Error generating magiclink:", linkError);
      return new Response(
        JSON.stringify({ 
          success: true, 
          user_id: user.id,
          is_new_user: isNewUser,
          message: 'Vérification réussie',
          requires_reauth: true,
          phone
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract token_hash from the generated link
    const actionUrl = new URL(linkData.properties.action_link);
    const tokenHash = actionUrl.searchParams.get('token') || actionUrl.hash?.match(/token=([^&]+)/)?.[1];

    if (!tokenHash) {
      console.error("No token found in magiclink URL:", linkData.properties.action_link);
      return new Response(
        JSON.stringify({ 
          success: true, 
          user_id: user.id,
          is_new_user: isNewUser,
          message: 'Vérification réussie',
          requires_reauth: true,
          phone
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use verifyOtp with the token_hash to create a proper session
    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.verifyOtp({
      token_hash: tokenHash,
      type: 'magiclink',
    });

    if (sessionError || !sessionData.session) {
      console.error("Error verifying magiclink OTP:", sessionError);
      return new Response(
        JSON.stringify({ 
          success: true, 
          user_id: user.id,
          is_new_user: isNewUser,
          message: 'Vérification réussie',
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

    console.log(`WhatsApp OTP verified for ${phone}, session created via magiclink`);

    return new Response(
      JSON.stringify({ 
        success: true,
        user_id: user.id,
        is_new_user: isNewUser,
        access_token: sessionData.session.access_token,
        refresh_token: sessionData.session.refresh_token,
        expires_in: sessionData.session.expires_in,
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
