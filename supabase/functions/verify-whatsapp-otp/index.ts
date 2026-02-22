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

// --- Structured Logger ---
function maskPhone(phone: string): string {
  if (phone.length <= 6) return '***';
  return phone.slice(0, 4) + '***' + phone.slice(-4);
}

function createLogger(phone: string) {
  const requestId = crypto.randomUUID().slice(0, 8);
  const maskedPhone = maskPhone(phone);
  const startTime = Date.now();
  let lastStepTime = startTime;
  const steps: string[] = [];

  const log = (step: string, data: Record<string, unknown> = {}, level: 'info' | 'error' = 'info') => {
    const now = Date.now();
    const duration_ms = now - lastStepTime;
    lastStepTime = now;
    steps.push(step);
    const entry = { requestId, step, phone: maskedPhone, duration_ms, ...data };
    if (level === 'error') {
      console.error(JSON.stringify(entry));
    } else {
      console.log(JSON.stringify(entry));
    }
  };

  const summary = (result: string, extra: Record<string, unknown> = {}) => {
    const total_duration_ms = Date.now() - startTime;
    console.log(JSON.stringify({
      requestId, step: 'request_complete', phone: maskedPhone,
      total_duration_ms, result, steps, ...extra,
    }));
  };

  // Log start immediately
  log('request_start', { timestamp: new Date().toISOString() });

  return { log, summary, requestId };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const jsonHeaders = { ...corsHeaders, 'Content-Type': 'application/json' };
  let logger: ReturnType<typeof createLogger> | null = null;

  try {
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { phone, code }: VerifyOtpRequest = await req.json();

    logger = createLogger(phone || 'unknown');

    // Validate inputs
    if (!phone || !code) {
      logger.summary('error_missing_fields');
      return new Response(
        JSON.stringify({ success: false, error: 'missing_fields', message: 'Téléphone et code requis' }),
        { status: 400, headers: jsonHeaders }
      );
    }

    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
      logger.summary('error_invalid_code_format');
      return new Response(
        JSON.stringify({ success: false, error: 'invalid_code', message: 'Le code doit contenir 6 chiffres' }),
        { status: 400, headers: jsonHeaders }
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
      logger.log('otp_lookup', { result: 'error', error: fetchError.message }, 'error');
      logger.summary('error_otp_fetch');
      return new Response(
        JSON.stringify({ success: false, error: 'fetch_error', message: 'Erreur lors de la vérification' }),
        { status: 500, headers: jsonHeaders }
      );
    }

    logger.log('otp_lookup', {
      result: otpRecord ? 'found' : 'not_found',
      otp_id: otpRecord?.id,
      attempts: otpRecord?.attempts,
    });

    if (!otpRecord) {
      logger.summary('error_no_otp');
      return new Response(
        JSON.stringify({ success: false, error: 'no_otp', message: 'Aucun code valide trouvé. Veuillez en demander un nouveau.' }),
        { status: 400, headers: jsonHeaders }
      );
    }

    // Check max attempts
    if (otpRecord.attempts >= otpRecord.max_attempts) {
      await supabaseAdmin.from('whatsapp_otp_codes').delete().eq('id', otpRecord.id);
      logger.log('otp_validation', { result: 'max_attempts_exceeded' });
      logger.summary('error_max_attempts');
      return new Response(
        JSON.stringify({ success: false, error: 'max_attempts', message: 'Trop de tentatives. Veuillez demander un nouveau code.' }),
        { status: 400, headers: jsonHeaders }
      );
    }

    // Check if code matches
    if (otpRecord.code !== code) {
      await supabaseAdmin.from('whatsapp_otp_codes').update({ attempts: otpRecord.attempts + 1 }).eq('id', otpRecord.id);
      const remainingAttempts = otpRecord.max_attempts - otpRecord.attempts - 1;
      logger.log('otp_validation', { result: 'invalid', remaining_attempts: remainingAttempts });
      logger.summary('error_invalid_code');
      return new Response(
        JSON.stringify({ success: false, error: 'invalid_code', message: `Code incorrect. ${remainingAttempts} tentative(s) restante(s).`, remaining_attempts: remainingAttempts }),
        { status: 400, headers: jsonHeaders }
      );
    }

    logger.log('otp_validation', { result: 'valid' });

    // Code is valid - mark as verified
    await supabaseAdmin.from('whatsapp_otp_codes').update({ verified_at: new Date().toISOString() }).eq('id', otpRecord.id);

    // Get or create user
    const metadata = otpRecord.user_metadata || {};
    const phoneWithPlus = phone.startsWith('+') ? phone : `+${phone}`;
    const phoneWithoutPlus = phone.replace(/^\+/, '');

    // 1. Search in profiles table first
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
      }
    }

    logger.log('profile_lookup', {
      result: existingUser ? 'found' : 'not_found',
      user_id: existingUser?.id,
    });

    // 2. If not in profiles, try listUsers
    if (!existingUser) {
      const { data: listData1 } = await supabaseAdmin.auth.admin.listUsers({ filter: phoneWithPlus });
      existingUser = listData1?.users?.find(u => u.phone === phoneWithPlus || u.phone === phoneWithoutPlus) || null;

      if (!existingUser) {
        const { data: listData2 } = await supabaseAdmin.auth.admin.listUsers({ filter: phoneWithoutPlus });
        existingUser = listData2?.users?.find(u => u.phone === phoneWithPlus || u.phone === phoneWithoutPlus) || null;
      }

      logger.log('listusers_lookup', {
        result: existingUser ? 'found' : 'not_found',
        user_id: existingUser?.id,
      });
    }

    let user;
    let isNewUser = false;

    if (existingUser) {
      user = existingUser;
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
          logger.log('phone_exists_retry', { result: 'retrying' });

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
            logger.log('phone_exists_retry', { result: 'found', user_id: user.id });
          } else {
            logger.log('phone_exists_retry', { result: 'not_found' }, 'error');
            logger.summary('error_user_lookup_failed');
            return new Response(
              JSON.stringify({ success: false, error: 'user_lookup_failed', message: 'Erreur de recherche utilisateur. Veuillez réessayer.' }),
              { status: 500, headers: jsonHeaders }
            );
          }
        } else {
          logger.log('user_creation', { result: 'error', error: createError.message }, 'error');
          logger.summary('error_user_creation');
          return new Response(
            JSON.stringify({ success: false, error: 'user_creation_failed', message: 'Impossible de créer le compte' }),
            { status: 500, headers: jsonHeaders }
          );
        }
      } else {
        user = newUser.user;
        isNewUser = true;

        const detectedCountry = phoneWithPlus.startsWith('+229') ? 'BJ'
          : phoneWithPlus.startsWith('+221') ? 'SN'
          : phoneWithPlus.startsWith('+228') ? 'TG'
          : phoneWithPlus.startsWith('+223') ? 'ML'
          : phoneWithPlus.startsWith('+226') ? 'BF'
          : phoneWithPlus.startsWith('+225') ? 'CI' : 'CI';

        await supabaseAdmin.from('profiles').update({ country_code: detectedCountry, phone: phoneWithPlus }).eq('user_id', user.id);

        logger.log('user_creation', { result: 'success', user_id: user.id, country: detectedCountry });
      }
    }

    // Generate session via magiclink
    const emailForPhone = `${phone.replace(/\+/g, '')}@phone.joiedevivre.app`;

    await supabaseAdmin.auth.admin.updateUserById(user.id, { email: emailForPhone });
    logger.log('email_setup', { email: emailForPhone });

    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: emailForPhone,
    });

    if (linkError || !linkData?.properties?.action_link) {
      logger.log('magiclink_generate', { result: 'error', error: linkError?.message }, 'error');
      logger.summary('success_requires_reauth', { is_new_user: isNewUser });
      return new Response(
        JSON.stringify({ success: true, user_id: user.id, is_new_user: isNewUser, message: 'Vérification réussie', requires_reauth: true, phone }),
        { status: 200, headers: jsonHeaders }
      );
    }

    logger.log('magiclink_generate', { result: 'success' });

    // Extract token_hash
    const actionUrl = new URL(linkData.properties.action_link);
    const tokenHash = actionUrl.searchParams.get('token') || actionUrl.hash?.match(/token=([^&]+)/)?.[1];

    if (!tokenHash) {
      logger.log('session_create', { result: 'no_token' }, 'error');
      logger.summary('success_requires_reauth', { is_new_user: isNewUser });
      return new Response(
        JSON.stringify({ success: true, user_id: user.id, is_new_user: isNewUser, message: 'Vérification réussie', requires_reauth: true, phone }),
        { status: 200, headers: jsonHeaders }
      );
    }

    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.verifyOtp({
      token_hash: tokenHash,
      type: 'magiclink',
    });

    if (sessionError || !sessionData.session) {
      logger.log('session_create', { result: 'error', error: sessionError?.message }, 'error');
      logger.summary('success_requires_reauth', { is_new_user: isNewUser });
      return new Response(
        JSON.stringify({ success: true, user_id: user.id, is_new_user: isNewUser, message: 'Vérification réussie', requires_reauth: true, phone }),
        { status: 200, headers: jsonHeaders }
      );
    }

    logger.log('session_create', { result: 'success', has_session: true });

    // Cleanup
    await supabaseAdmin.from('whatsapp_otp_codes').delete().eq('id', otpRecord.id);
    logger.log('cleanup', { result: 'success' });

    logger.summary('success', { is_new_user: isNewUser });

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
      { status: 200, headers: jsonHeaders }
    );

  } catch (error) {
    if (logger) {
      logger.log('unexpected_error', { error: (error as Error).message }, 'error');
      logger.summary('error_unexpected');
    } else {
      console.error(JSON.stringify({ step: 'unexpected_error', error: (error as Error).message }));
    }
    return new Response(
      JSON.stringify({ success: false, error: 'internal_error', message: 'Une erreur inattendue s\'est produite' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
