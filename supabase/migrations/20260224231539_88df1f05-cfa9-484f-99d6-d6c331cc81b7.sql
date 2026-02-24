
-- Fix the create_default_contact_alert_preferences() trigger function
-- It was inserting alert_10_days which no longer exists in the table
CREATE OR REPLACE FUNCTION public.create_default_contact_alert_preferences()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  BEGIN
    INSERT INTO public.contact_alert_preferences (
      user_id,
      alerts_enabled,
      sms_enabled,
      whatsapp_enabled,
      email_enabled,
      alert_on_contact_add,
      alert_30_days,
      alert_21_days,
      alert_14_days,
      alert_7_days,
      alert_5_days,
      alert_3_days,
      alert_2_days,
      alert_1_day,
      alert_day_of,
      notify_of_adder_birthday
    ) VALUES (
      NEW.user_id,
      true,   -- alerts_enabled
      true,   -- sms_enabled
      true,   -- whatsapp_enabled
      false,  -- email_enabled
      true,   -- alert_on_contact_add
      true,   -- alert_30_days
      true,   -- alert_21_days
      true,   -- alert_14_days
      true,   -- alert_7_days
      true,   -- alert_5_days
      true,   -- alert_3_days
      true,   -- alert_2_days
      true,   -- alert_1_day
      true,   -- alert_day_of
      true    -- notify_of_adder_birthday
    )
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'create_default_contact_alert_preferences failed for user %: % (non-blocking)', NEW.user_id, SQLERRM;
  END;
  
  RETURN NEW;
END;
$$;

-- Backfill: create preferences for existing profiles that don't have them
INSERT INTO public.contact_alert_preferences (
  user_id,
  alerts_enabled,
  sms_enabled,
  whatsapp_enabled,
  email_enabled,
  alert_on_contact_add,
  alert_30_days,
  alert_21_days,
  alert_14_days,
  alert_7_days,
  alert_5_days,
  alert_3_days,
  alert_2_days,
  alert_1_day,
  alert_day_of,
  notify_of_adder_birthday
)
SELECT 
  p.user_id,
  true, true, true, false, true,
  true, true, true, true, true, true, true, true, true, true
FROM public.profiles p
LEFT JOIN public.contact_alert_preferences cap ON cap.user_id = p.user_id
WHERE cap.id IS NULL
ON CONFLICT (user_id) DO NOTHING;
