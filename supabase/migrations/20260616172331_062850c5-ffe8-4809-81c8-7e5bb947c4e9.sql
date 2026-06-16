
-- =========================================================
-- PREMIUM TRIAL : 1 événement Premium offert par utilisateur
-- =========================================================

-- 1) Table principale : un seul grant par user (UNIQUE user_id)
CREATE TABLE IF NOT EXISTS public.premium_trial_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  target_type text NOT NULL CHECK (target_type IN ('birthday_page','event_page','collective_fund')),
  target_id uuid NOT NULL,
  event_date date,                          -- date de référence (jour de la célébration)
  granted_at timestamptz NOT NULL DEFAULT now(),
  premium_until timestamptz NOT NULL,       -- fin du Premium plein (= fin du jour J)
  memories_until timestamptz NOT NULL,      -- fin de la phase souvenirs (J+7)
  archived_at timestamptz NOT NULL,         -- bascule en archive (J+30)
  notified_unlock boolean NOT NULL DEFAULT false,
  notified_post_event boolean NOT NULL DEFAULT false,
  notified_memories_ending boolean NOT NULL DEFAULT false,
  converted_to_premium boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.premium_trial_grants TO authenticated;
GRANT ALL ON public.premium_trial_grants TO service_role;

ALTER TABLE public.premium_trial_grants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "premium_trial_grants_select_own"
  ON public.premium_trial_grants
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Aucun INSERT/UPDATE/DELETE direct côté client : tout passe par les triggers
-- et fonctions SECURITY DEFINER ci-dessous.

CREATE INDEX IF NOT EXISTS idx_premium_trial_grants_user ON public.premium_trial_grants(user_id);
CREATE INDEX IF NOT EXISTS idx_premium_trial_grants_target ON public.premium_trial_grants(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_premium_trial_grants_memories_until ON public.premium_trial_grants(memories_until);


-- 2) Analytics simple (offered / unlocked / post_event_view / upgrade_click / converted)
CREATE TABLE IF NOT EXISTS public.premium_trial_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  grant_id uuid REFERENCES public.premium_trial_grants(id) ON DELETE SET NULL,
  event_type text NOT NULL CHECK (event_type IN (
    'granted','unlock_viewed','post_event_viewed',
    'memories_phase_entered','upgrade_clicked','converted','archived'
  )),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.premium_trial_events TO authenticated;
GRANT ALL ON public.premium_trial_events TO service_role;

ALTER TABLE public.premium_trial_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "premium_trial_events_select_own"
  ON public.premium_trial_events
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "premium_trial_events_insert_own"
  ON public.premium_trial_events
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_premium_trial_events_user ON public.premium_trial_events(user_id, created_at DESC);


-- 3) Trigger updated_at
CREATE OR REPLACE FUNCTION public.set_premium_trial_grants_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_premium_trial_grants_updated_at ON public.premium_trial_grants;
CREATE TRIGGER trg_premium_trial_grants_updated_at
  BEFORE UPDATE ON public.premium_trial_grants
  FOR EACH ROW EXECUTE FUNCTION public.set_premium_trial_grants_updated_at();


-- 4) Fonction interne : créer un grant si l'user n'en a pas encore
CREATE OR REPLACE FUNCTION public._grant_premium_trial(
  _user_id uuid,
  _target_type text,
  _target_id uuid,
  _event_date date
) RETURNS public.premium_trial_grants
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _existing public.premium_trial_grants;
  _ref_date date;
  _premium_until timestamptz;
  _memories_until timestamptz;
  _archived_at timestamptz;
  _row public.premium_trial_grants;
BEGIN
  IF _user_id IS NULL THEN RETURN NULL; END IF;

  SELECT * INTO _existing FROM public.premium_trial_grants WHERE user_id = _user_id LIMIT 1;
  IF FOUND THEN RETURN _existing; END IF;

  -- fallback : si pas de date connue, on offre 30 jours à partir d'aujourd'hui
  _ref_date := COALESCE(_event_date, (now() AT TIME ZONE 'UTC')::date + INTERVAL '30 days');
  _premium_until   := (_ref_date::timestamp + INTERVAL '1 day') AT TIME ZONE 'UTC'; -- fin du jour J
  _memories_until  := _premium_until + INTERVAL '7 days';
  _archived_at     := _premium_until + INTERVAL '30 days';

  INSERT INTO public.premium_trial_grants(
    user_id, target_type, target_id, event_date,
    premium_until, memories_until, archived_at
  ) VALUES (
    _user_id, _target_type, _target_id, _ref_date,
    _premium_until, _memories_until, _archived_at
  )
  RETURNING * INTO _row;

  INSERT INTO public.premium_trial_events(user_id, grant_id, event_type, metadata)
  VALUES (_user_id, _row.id, 'granted', jsonb_build_object(
    'target_type', _target_type, 'target_id', _target_id, 'event_date', _ref_date
  ));

  RETURN _row;
END;
$$;

GRANT EXECUTE ON FUNCTION public._grant_premium_trial(uuid,text,uuid,date) TO service_role;


-- 5) Triggers d'auto-attribution sur les 3 entités
CREATE OR REPLACE FUNCTION public.trg_premium_trial_on_birthday_page()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _bd date;
  _evt date;
BEGIN
  SELECT birthday INTO _bd FROM public.profiles WHERE user_id = NEW.user_id LIMIT 1;
  IF _bd IS NOT NULL AND NEW.celebration_year IS NOT NULL THEN
    BEGIN
      _evt := make_date(NEW.celebration_year, EXTRACT(MONTH FROM _bd)::int, EXTRACT(DAY FROM _bd)::int);
    EXCEPTION WHEN OTHERS THEN _evt := NULL; END;
  END IF;
  PERFORM public._grant_premium_trial(NEW.user_id, 'birthday_page', NEW.id, _evt);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_premium_trial_birthday_page ON public.birthday_pages;
CREATE TRIGGER trg_premium_trial_birthday_page
  AFTER INSERT ON public.birthday_pages
  FOR EACH ROW EXECUTE FUNCTION public.trg_premium_trial_on_birthday_page();


CREATE OR REPLACE FUNCTION public.trg_premium_trial_on_event_page()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public._grant_premium_trial(NEW.creator_id, 'event_page', NEW.id, NEW.event_date);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_premium_trial_event_page ON public.event_pages;
CREATE TRIGGER trg_premium_trial_event_page
  AFTER INSERT ON public.event_pages
  FOR EACH ROW EXECUTE FUNCTION public.trg_premium_trial_on_event_page();


CREATE OR REPLACE FUNCTION public.trg_premium_trial_on_collective_fund()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public._grant_premium_trial(NEW.creator_id, 'collective_fund', NEW.id, NEW.deadline_date);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_premium_trial_collective_fund ON public.collective_funds;
CREATE TRIGGER trg_premium_trial_collective_fund
  AFTER INSERT ON public.collective_funds
  FOR EACH ROW EXECUTE FUNCTION public.trg_premium_trial_on_collective_fund();


-- 6) Helper public : statut du trial pour l'user courant
CREATE OR REPLACE FUNCTION public.get_premium_trial_status()
RETURNS TABLE (
  grant_id uuid,
  target_type text,
  target_id uuid,
  event_date date,
  premium_until timestamptz,
  memories_until timestamptz,
  archived_at timestamptz,
  phase text,
  converted_to_premium boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _g public.premium_trial_grants;
  _now timestamptz := now();
  _phase text;
BEGIN
  IF _uid IS NULL THEN RETURN; END IF;
  SELECT * INTO _g FROM public.premium_trial_grants WHERE user_id = _uid LIMIT 1;
  IF NOT FOUND THEN RETURN; END IF;

  IF _now <= _g.premium_until THEN _phase := 'active';
  ELSIF _now <= _g.memories_until THEN _phase := 'memories';
  ELSIF _now <= _g.archived_at THEN _phase := 'limited';
  ELSE _phase := 'archived';
  END IF;

  grant_id := _g.id; target_type := _g.target_type; target_id := _g.target_id;
  event_date := _g.event_date; premium_until := _g.premium_until;
  memories_until := _g.memories_until; archived_at := _g.archived_at;
  phase := _phase; converted_to_premium := _g.converted_to_premium;
  RETURN NEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_premium_trial_status() TO authenticated;


-- 7) Log analytics depuis le client (typage protégé via CHECK)
CREATE OR REPLACE FUNCTION public.log_premium_trial_event(
  _event_type text,
  _metadata jsonb DEFAULT '{}'::jsonb
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _gid uuid;
BEGIN
  IF _uid IS NULL THEN RETURN; END IF;
  IF _event_type NOT IN ('unlock_viewed','post_event_viewed','memories_phase_entered','upgrade_clicked','converted','archived') THEN
    RAISE EXCEPTION 'invalid event_type';
  END IF;
  SELECT id INTO _gid FROM public.premium_trial_grants WHERE user_id = _uid LIMIT 1;
  INSERT INTO public.premium_trial_events(user_id, grant_id, event_type, metadata)
  VALUES (_uid, _gid, _event_type, COALESCE(_metadata,'{}'::jsonb));
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_premium_trial_event(text,jsonb) TO authenticated;
