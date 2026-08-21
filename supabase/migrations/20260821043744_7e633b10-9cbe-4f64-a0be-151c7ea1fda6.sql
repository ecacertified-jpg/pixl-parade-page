
CREATE OR REPLACE FUNCTION public.crm_is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = _user_id AND is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.crm_admin_countries(_user_id uuid)
RETURNS text[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN a.role = 'super_admin' THEN NULL
    WHEN a.assigned_countries IS NULL OR array_length(a.assigned_countries, 1) IS NULL THEN NULL
    ELSE a.assigned_countries
  END
  FROM public.admin_users a
  WHERE a.user_id = _user_id AND a.is_active = true
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.crm_get_overview()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _countries text[];
  _result jsonb;
BEGIN
  IF NOT public.crm_is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Acces refuse';
  END IF;

  _countries := public.crm_admin_countries(auth.uid());

  SELECT COALESCE(jsonb_agg(
    to_jsonb(v)
    || jsonb_build_object(
      'crm_id', c.crm_id,
      'statut_reactivation', COALESCE(c.statut_reactivation, 'Non traite'),
      'statut_doublon', COALESCE(c.statut_doublon, 'Unique'),
      'admin_notes', c.admin_notes,
      'last_contacted_at', c.last_contacted_at
    )
  ), '[]'::jsonb)
  INTO _result
  FROM public.crm_user_overview v
  LEFT JOIN public.crm_profiles c ON c.user_id = v.user_id
  WHERE _countries IS NULL OR v.country_code = ANY(_countries);

  RETURN _result;
END;
$$;

CREATE OR REPLACE FUNCTION public.crm_provision_profiles()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _inserted integer;
BEGIN
  IF NOT public.crm_is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Acces refuse';
  END IF;

  WITH ins AS (
    INSERT INTO public.crm_profiles (user_id)
    SELECT v.user_id
    FROM public.crm_user_overview v
    LEFT JOIN public.crm_profiles c ON c.user_id = v.user_id
    WHERE c.user_id IS NULL
    ON CONFLICT (user_id) DO NOTHING
    RETURNING 1
  )
  SELECT count(*) INTO _inserted FROM ins;

  RETURN _inserted;
END;
$$;

CREATE OR REPLACE FUNCTION public.crm_get_rules()
RETURNS SETOF public.crm_scoring_rules
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.crm_scoring_rules
  WHERE public.crm_is_admin(auth.uid())
  ORDER BY sort_order NULLS LAST, rule_key;
$$;

CREATE OR REPLACE FUNCTION public.crm_get_history(_user_id uuid)
RETURNS SETOF public.crm_reactivation_history
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.crm_reactivation_history
  WHERE user_id = _user_id AND public.crm_is_admin(auth.uid())
  ORDER BY occurred_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.crm_set_status(
  _user_id uuid,
  _statut_reactivation text DEFAULT NULL,
  _statut_doublon text DEFAULT NULL,
  _admin_notes text DEFAULT NULL
)
RETURNS public.crm_profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _row public.crm_profiles;
BEGIN
  IF NOT public.crm_is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Acces refuse';
  END IF;

  INSERT INTO public.crm_profiles (user_id)
  VALUES (_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  UPDATE public.crm_profiles
  SET statut_reactivation = COALESCE(_statut_reactivation, statut_reactivation),
      statut_doublon = COALESCE(_statut_doublon, statut_doublon),
      admin_notes = COALESCE(left(_admin_notes, 5000), admin_notes),
      updated_at = now()
  WHERE user_id = _user_id
  RETURNING * INTO _row;

  RETURN _row;
END;
$$;

CREATE OR REPLACE FUNCTION public.crm_add_history(
  _user_id uuid,
  _canal text DEFAULT NULL,
  _campagne text DEFAULT NULL,
  _message text DEFAULT NULL,
  _statut text DEFAULT NULL,
  _reponse text DEFAULT NULL,
  _action_suivante text DEFAULT NULL,
  _resultat text DEFAULT NULL
)
RETURNS public.crm_reactivation_history
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _profile_id uuid;
  _row public.crm_reactivation_history;
BEGIN
  IF NOT public.crm_is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Acces refuse';
  END IF;

  INSERT INTO public.crm_profiles (user_id)
  VALUES (_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT id INTO _profile_id FROM public.crm_profiles WHERE user_id = _user_id;

  INSERT INTO public.crm_reactivation_history (
    user_id, crm_profile_id, occurred_at, canal, campagne, message,
    statut, reponse, action_suivante, resultat, created_by
  ) VALUES (
    _user_id, _profile_id, now(), _canal, _campagne, left(_message, 5000),
    _statut, left(_reponse, 5000), _action_suivante, _resultat, auth.uid()
  )
  RETURNING * INTO _row;

  IF _statut IS NOT NULL THEN
    UPDATE public.crm_profiles
    SET statut_reactivation = _statut, last_contacted_at = now(), updated_at = now()
    WHERE user_id = _user_id;
  END IF;

  RETURN _row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.crm_get_overview() TO authenticated;
GRANT EXECUTE ON FUNCTION public.crm_provision_profiles() TO authenticated;
GRANT EXECUTE ON FUNCTION public.crm_get_rules() TO authenticated;
GRANT EXECUTE ON FUNCTION public.crm_get_history(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.crm_set_status(uuid, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.crm_add_history(uuid, text, text, text, text, text, text, text) TO authenticated;
