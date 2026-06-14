
-- Lot 1: RSVP tokens + new plan feature keys for "Préparer" module

-- 1) event_guests: add RSVP token + response tracking
ALTER TABLE public.event_guests
  ADD COLUMN IF NOT EXISTS rsvp_token text UNIQUE DEFAULT replace(gen_random_uuid()::text, '-', ''),
  ADD COLUMN IF NOT EXISTS rsvp_response text CHECK (rsvp_response IN ('yes','no','maybe')),
  ADD COLUMN IF NOT EXISTS rsvp_plus_ones integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rsvp_message text,
  ADD COLUMN IF NOT EXISTS rsvp_responded_at timestamptz;

CREATE INDEX IF NOT EXISTS event_guests_rsvp_token_idx ON public.event_guests(rsvp_token);

-- 2) Public read-only access by token (no auth), and public update of own row by token
-- We expose a SECURITY DEFINER RPC so anonymous users never get direct table grant.

CREATE OR REPLACE FUNCTION public.get_rsvp_by_token(_token text)
RETURNS TABLE (
  guest_id uuid,
  guest_name text,
  rsvp_response text,
  rsvp_plus_ones integer,
  rsvp_message text,
  page_type text,
  page_id uuid,
  event_title text,
  event_date date,
  event_slug text,
  event_occasion text,
  cover_image_url text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT g.id, g.name, g.rsvp_response, g.rsvp_plus_ones, g.rsvp_message,
         g.page_type::text, g.page_id,
         COALESCE(ep.title, bp.title) AS event_title,
         ep.event_date,
         COALESCE(ep.slug, bp.slug) AS event_slug,
         COALESCE(ep.occasion, 'birthday') AS event_occasion,
         COALESCE(ep.cover_image_url, bp.cover_image_url) AS cover_image_url
  FROM public.event_guests g
  LEFT JOIN public.event_pages ep ON g.page_type::text = 'event' AND ep.id = g.page_id
  LEFT JOIN public.birthday_pages bp ON g.page_type::text = 'birthday' AND bp.id = g.page_id
  WHERE g.rsvp_token = _token
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.submit_rsvp_by_token(
  _token text,
  _response text,
  _plus_ones integer DEFAULT 0,
  _message text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_status text;
BEGIN
  IF _response NOT IN ('yes','no','maybe') THEN
    RAISE EXCEPTION 'invalid response';
  END IF;

  v_new_status := CASE _response
    WHEN 'yes' THEN 'confirmed'
    WHEN 'no' THEN 'declined'
    ELSE 'pending'
  END;

  UPDATE public.event_guests
  SET rsvp_response = _response,
      rsvp_plus_ones = GREATEST(0, COALESCE(_plus_ones, 0)),
      rsvp_message = NULLIF(trim(COALESCE(_message,'')), ''),
      rsvp_responded_at = now(),
      status = v_new_status::event_guest_status,
      updated_at = now()
  WHERE rsvp_token = _token;

  RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_rsvp_by_token(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_rsvp_by_token(text, text, integer, text) TO anon, authenticated;

-- 3) Plan feature keys: add new ones to existing subscription_plans rows
UPDATE public.subscription_plans
SET limits = limits
  || jsonb_build_object(
       'rsvp_advanced', false,
       'premium_invitations', false,
       'expense_management', false,
       'ai_assistant', false,
       'family_collaboration', false,
       'priority_vendors', false,
       'full_customization', false,
       'smart_suggestions', false
     )
WHERE tier = 'free';

UPDATE public.subscription_plans
SET limits = limits
  || jsonb_build_object(
       'rsvp_advanced', true,
       'premium_invitations', true,
       'expense_management', true,
       'ai_assistant', false,
       'family_collaboration', false,
       'priority_vendors', false,
       'full_customization', false,
       'smart_suggestions', false
     )
WHERE tier = 'essentiel';

UPDATE public.subscription_plans
SET limits = limits
  || jsonb_build_object(
       'rsvp_advanced', true,
       'premium_invitations', true,
       'expense_management', true,
       'ai_assistant', true,
       'family_collaboration', true,
       'priority_vendors', true,
       'full_customization', true,
       'smart_suggestions', true
     )
WHERE tier = 'premium';
