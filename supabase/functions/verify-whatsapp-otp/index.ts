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
      requestId,
      step: 'request_complete',
      phone: maskedPhone,
      total_duration_ms,
      result,
      steps,
      ...extra,
    }));
  };

  log('request_start', { timestamp: new Date().toISOString() });

  return { log, summary, requestId };
}

function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-()]/g, '').trim();
}

function buildPhoneCandidates(phone: string): string[] {
  const normalized = normalizePhone(phone);
  const withPlus = normalized.startsWith('+') ? normalized : `+${normalized}`;
  const withoutPlus = withPlus.replace(/^\+/, '');
  const candidates = new Set<string>([withPlus, withoutPlus]);

  if (
    withPlus.startsWith('+22507') ||
    withPlus.startsWith('+22505') ||
    withPlus.startsWith('+22501')
  ) {
    const legacyWithPlus = `+225${withPlus.slice(6)}`;
    candidates.add(legacyWithPlus);
    candidates.add(legacyWithPlus.replace(/^\+/, ''));
  }

  return Array.from(candidates).filter(Boolean);
}

function buildSyntheticEmailCandidates(phoneCandidates: string[]): string[] {
  return Array.from(
    new Set(
      phoneCandidates.map((candidate) => `${candidate.replace(/^\+/, '')}@phone.joiedevivre.app`.toLowerCase())
    )
  );
}

function userMatchesCandidates(user: any, phoneCandidates: Set<string>, emailCandidates: Set<string>): boolean {
  const normalizedUserPhone = normalizePhone(user.phone || '');
  const userPhoneWithPlus = normalizedUserPhone
    ? (normalizedUserPhone.startsWith('+') ? normalizedUserPhone : `+${normalizedUserPhone}`)
    : '';
  const userPhoneWithoutPlus = userPhoneWithPlus.replace(/^\+/, '');
  const userEmail = (user.email || '').toLowerCase();

  return (
    phoneCandidates.has(userPhoneWithPlus) ||
    phoneCandidates.has(userPhoneWithoutPlus) ||
    emailCandidates.has(userEmail)
  );
}

async function findUserFromProfiles(
  supabaseAdmin: any,
  phoneCandidates: string[],
  logger: ReturnType<typeof createLogger>,
  step: string,
) {
  const { data: profileData, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('user_id, phone')
    .in('phone', phoneCandidates)
    .limit(1)
    .maybeSingle();

  if (profileError) {
    logger.log(step, { result: 'error', error: profileError.message }, 'error');
    return null;
  }

  if (!profileData?.user_id) {
    logger.log(step, { result: 'not_found' });
    return null;
  }

  const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(profileData.user_id);
  if (userError || !userData?.user) {
    logger.log(step, {
      result: 'auth_user_missing',
      user_id: profileData.user_id,
      error: userError?.message || 'user_not_found',
    }, 'error');
    return null;
  }

  logger.log(step, { result: 'found', user_id: userData.user.id });
  return userData.user;
}

async function findAuthUserByPhoneOrEmail(
  supabaseAdmin: any,
  phoneCandidates: string[],
  emailCandidates: string[],
  logger: ReturnType<typeof createLogger>,
  step: string,
) {
  const phoneSet = new Set(phoneCandidates);
  const emailSet = new Set(emailCandidates);
  const perPage = 1000;
  const maxPages = 50;
  let page = 1;
  let pagesScanned = 0;
  let totalUsersChecked = 0;

  while (page <= maxPages) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });

    if (error) {
      logger.log(step, {
        result: 'error',
        page,
        pages_scanned: pagesScanned,
        total_users_checked: totalUsersChecked,
        error: error.message,
      }, 'error');
      return null;
    }

    const users = data?.users || [];
    pagesScanned += 1;
    totalUsersChecked += users.length;

    const foundUser = users.find((user: any) => userMatchesCandidates(user, phoneSet, emailSet)) || null;
    if (foundUser) {
      logger.log(step, {
        result: 'found',
        user_id: foundUser.id,
        pages_scanned: pagesScanned,
        total_users_checked: totalUsersChecked,
      });
      return foundUser;
    }

    if (users.length < perPage) {
      break;
    }

    page += 1;
  }

  logger.log(step, {
    result: 'not_found',
    pages_scanned: pagesScanned,
    total_users_checked: totalUsersChecked,
  });

  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const jsonHeaders = { ...corsHeaders, 'Content-Type': 'application/json' };
  let logger: ReturnType<typeof createLogger> | null = null;
  let requestId = 'unknown';

  try {
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });
    const { phone, code: rawCode }: VerifyOtpRequest = await req.json();

    logger = createLogger(phone || 'unknown');
    requestId = logger.requestId;

    const code = (rawCode || '').trim().replace(/\D/g, '');

    if (!phone || !code) {
      logger.summary('error_missing_fields');
      return new Response(
        JSON.stringify({ success: false, error: 'missing_fields', message: 'Téléphone et code requis', requestId }),
        { status: 400, headers: jsonHeaders }
      );
    }

    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
      logger.summary('error_invalid_code_format');
      return new Response(
        JSON.stringify({ success: false, error: 'invalid_code', message: 'Le code doit contenir 6 chiffres', requestId }),
        { status: 400, headers: jsonHeaders }
      );
    }

    const { data: otpRecord, error: fetchError } = await supabaseAdmin
      .from('whatsapp_otp_codes')
      .select('*')
      .eq('phone', phone)
      .eq('code', code)
      .is('verified_at', null)
      .gt('expires_at', new Date().toISOString())
      .limit(1)
      .maybeSingle();

    if (fetchError) {
      logger.log('otp_lookup', { result: 'error', error: fetchError.message }, 'error');
      logger.summary('error_otp_fetch');
      return new Response(
        JSON.stringify({ success: false, error: 'fetch_error', message: 'Erreur lors de la vérification', requestId }),
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
        JSON.stringify({ success: false, error: 'invalid_code', message: 'Code invalide ou expiré. Veuillez vérifier ou demander un nouveau code.', requestId }),
        { status: 400, headers: jsonHeaders }
      );
    }

    if (otpRecord.attempts >= otpRecord.max_attempts) {
      await supabaseAdmin.from('whatsapp_otp_codes').delete().eq('id', otpRecord.id);
      logger.log('otp_validation', { result: 'max_attempts_exceeded' });
      logger.summary('error_max_attempts');
      return new Response(
        JSON.stringify({ success: false, error: 'max_attempts', message: 'Trop de tentatives. Veuillez demander un nouveau code.', requestId }),
        { status: 400, headers: jsonHeaders }
      );
    }

    await supabaseAdmin
      .from('whatsapp_otp_codes')
      .update({ attempts: otpRecord.attempts + 1 })
      .eq('id', otpRecord.id);

    logger.log('otp_validation', { result: 'valid' });

    const metadata = otpRecord.user_metadata || {};
    const phoneCandidates = buildPhoneCandidates(phone);
    const phoneWithPlus = phoneCandidates.find((candidate) => candidate.startsWith('+')) || `+${normalizePhone(phone).replace(/^\+/, '')}`;
    const phoneWithoutPlus = phoneWithPlus.replace(/^\+/, '');
    const emailCandidates = buildSyntheticEmailCandidates(phoneCandidates);

    let existingUser = await findUserFromProfiles(supabaseAdmin, phoneCandidates, logger, 'profile_lookup');
    if (!existingUser) {
      existingUser = await findAuthUserByPhoneOrEmail(
        supabaseAdmin,
        phoneCandidates,
        emailCandidates,
        logger,
        'auth_users_lookup'
      );
    }

    let user;
    let isNewUser = false;

    if (existingUser) {
      user = existingUser;
    } else {
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

          existingUser = await findUserFromProfiles(supabaseAdmin, phoneCandidates, logger, 'profile_retry_lookup');
          if (!existingUser) {
            existingUser = await findAuthUserByPhoneOrEmail(
              supabaseAdmin,
              phoneCandidates,
              emailCandidates,
              logger,
              'phone_exists_retry_lookup'
            );
          }

          if (existingUser) {
            user = existingUser;
            logger.log('phone_exists_retry', { result: 'found', user_id: user.id });
          } else {
            logger.log('phone_exists_retry', {
              result: 'not_found',
              phone_candidates: phoneCandidates.length,
              email_candidates: emailCandidates.length,
            }, 'error');
            logger.summary('error_user_lookup_failed');
            return new Response(
              JSON.stringify({ success: false, error: 'user_lookup_failed', message: 'Erreur de recherche utilisateur. Veuillez réessayer.', requestId }),
              { status: 500, headers: jsonHeaders }
            );
          }
        } else {
          logger.log('user_creation', { result: 'error', error: createError.message }, 'error');
          logger.summary('error_user_creation');
          return new Response(
            JSON.stringify({ success: false, error: 'user_creation_failed', message: 'Impossible de créer le compte', requestId }),
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

        await supabaseAdmin
          .from('profiles')
          .update({ country_code: detectedCountry, phone: phoneWithPlus })
          .eq('user_id', user.id);

        logger.log('user_creation', { result: 'success', user_id: user.id, country: detectedCountry });
      }
    }

    const emailForPhone = `${phoneWithoutPlus}@phone.joiedevivre.app`;

    await supabaseAdmin.auth.admin.updateUserById(user.id, { email: emailForPhone });
    logger.log('email_setup', { email: emailForPhone });

    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: emailForPhone,
    });

    if (linkError || !linkData?.properties?.action_link) {
      logger.log('magiclink_generate', { result: 'error', error: linkError?.message }, 'error');
      await supabaseAdmin.from('whatsapp_otp_codes').update({ verified_at: new Date().toISOString() }).eq('id', otpRecord.id);
      logger.summary('success_requires_reauth', { is_new_user: isNewUser });
      return new Response(
        JSON.stringify({ success: true, user_id: user.id, is_new_user: isNewUser, message: 'Vérification réussie', requires_reauth: true, phone }),
        { status: 200, headers: jsonHeaders }
      );
    }

    logger.log('magiclink_generate', { result: 'success' });

    const actionUrl = new URL(linkData.properties.action_link);
    const tokenHash = actionUrl.searchParams.get('token') || actionUrl.hash?.match(/token=([^&]+)/)?.[1];

    if (!tokenHash) {
      logger.log('session_create', { result: 'no_token' }, 'error');
      await supabaseAdmin.from('whatsapp_otp_codes').update({ verified_at: new Date().toISOString() }).eq('id', otpRecord.id);
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
      await supabaseAdmin.from('whatsapp_otp_codes').update({ verified_at: new Date().toISOString() }).eq('id', otpRecord.id);
      logger.summary('success_requires_reauth', { is_new_user: isNewUser });
      return new Response(
        JSON.stringify({ success: true, user_id: user.id, is_new_user: isNewUser, message: 'Vérification réussie', requires_reauth: true, phone }),
        { status: 200, headers: jsonHeaders }
      );
    }

    logger.log('session_create', { result: 'success', has_session: true });

    await supabaseAdmin.from('whatsapp_otp_codes').update({ verified_at: new Date().toISOString() }).eq('id', otpRecord.id);
    await supabaseAdmin.from('whatsapp_otp_codes').delete().eq('phone', phone).is('verified_at', null);
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
      JSON.stringify({ success: false, error: 'internal_error', message: 'Une erreur inattendue s\'est produite', requestId }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});