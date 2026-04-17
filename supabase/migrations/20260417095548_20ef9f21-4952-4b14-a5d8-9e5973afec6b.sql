-- Extend birthday_contact_alerts alert types
ALTER TABLE public.birthday_contact_alerts 
  DROP CONSTRAINT IF EXISTS birthday_contact_alerts_alert_type_check;

ALTER TABLE public.birthday_contact_alerts 
  ADD CONSTRAINT birthday_contact_alerts_alert_type_check 
  CHECK (alert_type = ANY (ARRAY[
    'immediate'::text,
    'month'::text,
    'two_weeks'::text,
    'daily'::text,
    'contact_added'::text,
    'friends_circle_welcome'::text,
    'friends_circle_reminder'::text,
    'birthday_countdown'::text,
    'friend_page_invite'::text
  ]));

-- Anti-spam dedup table for birthday page activity notifications
CREATE TABLE IF NOT EXISTS public.birthday_page_activity_notifs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  birthday_page_id uuid NOT NULL,
  actor_user_id uuid NOT NULL,
  action_type text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bpan_dedup 
  ON public.birthday_page_activity_notifs(birthday_page_id, actor_user_id, action_type, created_at DESC);

ALTER TABLE public.birthday_page_activity_notifs ENABLE ROW LEVEL SECURITY;

-- No policies = service role only access (clients blocked)