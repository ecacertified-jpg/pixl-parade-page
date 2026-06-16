
ALTER TABLE public.event_guests
  ADD COLUMN IF NOT EXISTS dietary_preference text,
  ADD COLUMN IF NOT EXISTS plus_one_names text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS reminder_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS reminder_count integer NOT NULL DEFAULT 0;

DROP FUNCTION IF EXISTS public.get_rsvp_by_token(text);
DROP FUNCTION IF EXISTS public.submit_rsvp_by_token(text, text, integer, text);

CREATE OR REPLACE FUNCTION public.get_rsvp_by_token(_token text)
 RETURNS TABLE(guest_id uuid, guest_name text, rsvp_response text, rsvp_plus_ones integer, rsvp_message text, page_type text, page_id uuid, event_title text, event_date date, event_slug text, event_occasion text, cover_image_url text, dietary_preference text, plus_one_names text[])
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT g.id, g.name, g.rsvp_response, g.rsvp_plus_ones, g.rsvp_message,
         g.page_type::text, g.page_id,
         COALESCE(ep.title, bp.title) AS event_title,
         ep.event_date,
         COALESCE(ep.slug, bp.slug) AS event_slug,
         COALESCE(ep.occasion, 'birthday') AS event_occasion,
         COALESCE(ep.cover_image_url, bp.cover_image_url) AS cover_image_url,
         g.dietary_preference,
         g.plus_one_names
  FROM public.event_guests g
  LEFT JOIN public.event_pages ep ON g.page_type::text = 'event' AND ep.id = g.page_id
  LEFT JOIN public.birthday_pages bp ON g.page_type::text = 'birthday' AND bp.id = g.page_id
  WHERE g.rsvp_token = _token
  LIMIT 1
$function$;

CREATE OR REPLACE FUNCTION public.submit_rsvp_by_token(
  _token text,
  _response text,
  _plus_ones integer DEFAULT 0,
  _message text DEFAULT NULL,
  _dietary text DEFAULT NULL,
  _plus_one_names text[] DEFAULT NULL
)
 RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_new_status text;
BEGIN
  IF _response NOT IN ('yes','no','maybe') THEN
    RAISE EXCEPTION 'invalid response';
  END IF;
  v_new_status := CASE _response WHEN 'yes' THEN 'confirmed' WHEN 'no' THEN 'declined' ELSE 'pending' END;
  UPDATE public.event_guests
  SET rsvp_response = _response,
      rsvp_plus_ones = GREATEST(0, COALESCE(_plus_ones, 0)),
      rsvp_message = NULLIF(trim(COALESCE(_message,'')), ''),
      dietary_preference = NULLIF(trim(COALESCE(_dietary,'')), ''),
      plus_one_names = COALESCE(_plus_one_names, '{}'::text[]),
      rsvp_responded_at = now(),
      status = v_new_status::event_guest_status,
      updated_at = now()
  WHERE rsvp_token = _token;
  RETURN FOUND;
END;
$function$;

CREATE OR REPLACE FUNCTION public.mark_rsvp_reminder_sent(_guest_id uuid)
 RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_can boolean;
  v_pt text;
  v_pid uuid;
BEGIN
  SELECT page_type::text, page_id INTO v_pt, v_pid FROM public.event_guests WHERE id = _guest_id;
  IF NOT FOUND THEN RETURN false; END IF;
  v_can := public.can_manage_page(auth.uid(), v_pt::organization_page_type, v_pid, 'guests'::organizer_role);
  IF NOT v_can THEN RAISE EXCEPTION 'not authorized'; END IF;
  UPDATE public.event_guests
  SET reminder_sent_at = now(), reminder_count = reminder_count + 1, updated_at = now()
  WHERE id = _guest_id;
  RETURN true;
END;
$function$;
