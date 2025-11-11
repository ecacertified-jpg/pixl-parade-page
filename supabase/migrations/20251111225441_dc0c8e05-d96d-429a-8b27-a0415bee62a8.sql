-- Add comment_notifications column to notification_preferences
ALTER TABLE public.notification_preferences 
ADD COLUMN IF NOT EXISTS comment_notifications BOOLEAN DEFAULT true;

-- Update existing rows to have comment_notifications enabled by default
UPDATE public.notification_preferences 
SET comment_notifications = true 
WHERE comment_notifications IS NULL;

-- Create function to notify post author when someone comments
CREATE OR REPLACE FUNCTION public.notify_post_comment()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  post_author_id UUID;
  commenter_name TEXT;
  commenter_avatar TEXT;
  post_content TEXT;
  preferences_enabled BOOLEAN;
BEGIN
  -- Get post author ID
  SELECT user_id INTO post_author_id
  FROM public.posts
  WHERE id = NEW.post_id;
  
  -- Don't notify if author comments on their own post
  IF post_author_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  
  -- Check if author has comment notifications enabled
  SELECT COALESCE(comment_notifications, true) INTO preferences_enabled
  FROM public.notification_preferences
  WHERE user_id = post_author_id;
  
  -- Exit if notifications disabled
  IF NOT preferences_enabled THEN
    RETURN NEW;
  END IF;
  
  -- Get commenter info
  SELECT 
    COALESCE(first_name || ' ' || last_name, first_name, 'Un utilisateur'),
    avatar_url
  INTO commenter_name, commenter_avatar
  FROM public.profiles
  WHERE user_id = NEW.user_id;
  
  -- Get post content preview (first 50 chars)
  SELECT LEFT(content, 50) INTO post_content
  FROM public.posts
  WHERE id = NEW.post_id;
  
  -- Create in-app notification
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    metadata
  ) VALUES (
    post_author_id,
    'new_comment',
    'Nouveau commentaire',
    commenter_name || ' a commenté votre publication',
    jsonb_build_object(
      'post_id', NEW.post_id,
      'comment_id', NEW.id,
      'commenter_id', NEW.user_id,
      'commenter_name', commenter_name,
      'commenter_avatar', commenter_avatar,
      'comment_preview', LEFT(NEW.content, 100),
      'post_preview', post_content
    )
  );
  
  -- Create scheduled push notification
  INSERT INTO public.scheduled_notifications (
    user_id,
    notification_type,
    title,
    message,
    scheduled_for,
    delivery_methods,
    metadata
  ) VALUES (
    post_author_id,
    'new_comment',
    'Nouveau commentaire 💬',
    commenter_name || ' : "' || LEFT(NEW.content, 80) || '"',
    NOW(),
    ARRAY['push', 'in_app'],
    jsonb_build_object(
      'post_id', NEW.post_id,
      'comment_id', NEW.id,
      'commenter_id', NEW.user_id,
      'commenter_name', commenter_name,
      'action_url', '/community?post=' || NEW.post_id
    )
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger on post_comments
DROP TRIGGER IF EXISTS trigger_notify_post_comment ON public.post_comments;
CREATE TRIGGER trigger_notify_post_comment
  AFTER INSERT ON public.post_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_post_comment();