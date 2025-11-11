-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_user_follow_created ON public.user_follows;

-- Create trigger function to notify when someone follows a user
CREATE OR REPLACE FUNCTION public.notify_new_follower()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  follower_name TEXT;
  follower_avatar TEXT;
BEGIN
  -- Get follower's name and avatar
  SELECT 
    COALESCE(first_name || ' ' || COALESCE(last_name, ''), first_name, 'Un utilisateur'),
    avatar_url
  INTO follower_name, follower_avatar
  FROM public.profiles
  WHERE user_id = NEW.follower_id;

  -- Create notification for the user being followed
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    action_url,
    metadata
  ) VALUES (
    NEW.following_id,
    'new_follower',
    'Nouvel abonné ! 👤',
    follower_name || ' a commencé à vous suivre',
    '/profile/' || NEW.follower_id,
    jsonb_build_object(
      'follower_id', NEW.follower_id,
      'follower_name', follower_name,
      'follower_avatar', follower_avatar,
      'followed_at', NEW.created_at
    )
  );

  -- Also create a scheduled notification for push delivery
  INSERT INTO public.scheduled_notifications (
    user_id,
    notification_type,
    title,
    message,
    scheduled_for,
    delivery_methods,
    metadata
  ) VALUES (
    NEW.following_id,
    'new_follower',
    'Nouvel abonné ! 👤',
    follower_name || ' a commencé à vous suivre. Découvrez son profil !',
    now(),
    ARRAY['push', 'in_app'],
    jsonb_build_object(
      'follower_id', NEW.follower_id,
      'follower_name', follower_name,
      'follower_avatar', follower_avatar,
      'action_url', '/profile/' || NEW.follower_id
    )
  );

  RETURN NEW;
END;
$$;

-- Create trigger on user_follows table
CREATE TRIGGER on_user_follow_created
  AFTER INSERT ON public.user_follows
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_follower();

-- Create index on notifications for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_type 
  ON public.notifications(user_id, type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_unread 
  ON public.notifications(user_id, is_read, created_at DESC) 
  WHERE is_read = false;