
CREATE OR REPLACE FUNCTION public.get_friends_circle_reminder_candidates(max_results integer DEFAULT 40)
RETURNS TABLE(user_id uuid, first_name text, phone text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.user_id, p.first_name, p.phone
  FROM profiles p
  WHERE p.birthday IS NOT NULL
    AND p.city IS NOT NULL
    AND p.phone IS NOT NULL
    AND (SELECT count(*) FROM contacts c WHERE c.user_id = p.user_id) < 2
    AND NOT EXISTS (
      SELECT 1 FROM birthday_contact_alerts a
      WHERE a.user_id = p.user_id
        AND a.alert_type = 'friends_circle_reminder'
        AND a.created_at >= now() - interval '72 hours'
    )
  LIMIT max_results;
$$;
