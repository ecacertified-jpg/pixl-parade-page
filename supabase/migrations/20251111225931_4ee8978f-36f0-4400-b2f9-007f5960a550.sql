-- Add reaction_notifications column to notification_preferences
ALTER TABLE public.notification_preferences 
ADD COLUMN IF NOT EXISTS reaction_notifications BOOLEAN DEFAULT true;

-- Update existing rows to have reaction_notifications enabled by default
UPDATE public.notification_preferences 
SET reaction_notifications = true 
WHERE reaction_notifications IS NULL;

-- Create function to notify post author when someone reacts
CREATE OR REPLACE FUNCTION public.notify_post_reaction()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  post_author_id UUID;
  reactor_name TEXT;
  reactor_avatar TEXT;
  post_content TEXT;
  preferences_enabled BOOLEAN;
  existing_notification_id UUID;
  reaction_count INTEGER;
  recent_reactors TEXT[];
BEGIN
  -- Get post author ID
  SELECT user_id INTO post_author_id
  FROM public.posts
  WHERE id = NEW.post_id;
  
  -- Don't notify if author reacts to their own post
  IF post_author_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  
  -- Check if author has reaction notifications enabled
  SELECT COALESCE(reaction_notifications, true) INTO preferences_enabled
  FROM public.notification_preferences
  WHERE user_id = post_author_id;
  
  -- Exit if notifications disabled
  IF NOT preferences_enabled THEN
    RETURN NEW;
  END IF;
  
  -- Get reactor info
  SELECT 
    COALESCE(first_name || ' ' || last_name, first_name, 'Un utilisateur'),
    avatar_url
  INTO reactor_name, reactor_avatar
  FROM public.profiles
  WHERE user_id = NEW.user_id;
  
  -- Get post content preview
  SELECT LEFT(content, 50) INTO post_content
  FROM public.posts
  WHERE id = NEW.post_id;
  
  -- Check if there's a recent notification (within last 5 minutes) for this post
  SELECT id INTO existing_notification_id
  FROM public.notifications
  WHERE user_id = post_author_id
    AND type = 'post_reaction'
    AND (metadata->>'post_id')::uuid = NEW.post_id
    AND created_at > NOW() - INTERVAL '5 minutes'
    AND is_read = false
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Count total reactions on this post
  SELECT COUNT(*) INTO reaction_count
  FROM public.post_reactions
  WHERE post_id = NEW.post_id;
  
  -- Get names of recent reactors (last 3, excluding current)
  SELECT ARRAY_AGG(COALESCE(p.first_name, 'Quelqu''un'))
  INTO recent_reactors
  FROM (
    SELECT DISTINCT pr.user_id
    FROM public.post_reactions pr
    WHERE pr.post_id = NEW.post_id
      AND pr.user_id != NEW.user_id
    ORDER BY pr.created_at DESC
    LIMIT 2
  ) recent_users
  JOIN public.profiles p ON p.user_id = recent_users.user_id;
  
  IF existing_notification_id IS NOT NULL THEN
    -- Update existing notification with new count
    UPDATE public.notifications
    SET 
      message = CASE 
        WHEN reaction_count = 2 THEN reactor_name || ' et 1 autre personne ont réagi à votre publication'
        WHEN reaction_count > 2 THEN reactor_name || ' et ' || (reaction_count - 1) || ' autres personnes ont réagi à votre publication'
        ELSE reactor_name || ' a réagi à votre publication'
      END,
      metadata = jsonb_set(
        jsonb_set(metadata, '{reaction_count}', to_jsonb(reaction_count)),
        '{recent_reactors}', to_jsonb(COALESCE(recent_reactors, ARRAY[]::text[]))
      ),
      created_at = NOW()
    WHERE id = existing_notification_id;
  ELSE
    -- Create new notification
    INSERT INTO public.notifications (
      user_id,
      type,
      title,
      message,
      metadata
    ) VALUES (
      post_author_id,
      'post_reaction',
      'Nouvelle réaction',
      reactor_name || ' a réagi à votre publication',
      jsonb_build_object(
        'post_id', NEW.post_id,
        'reaction_id', NEW.id,
        'reactor_id', NEW.user_id,
        'reactor_name', reactor_name,
        'reactor_avatar', reactor_avatar,
        'reaction_type', NEW.reaction_type,
        'reaction_count', reaction_count,
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
      'post_reaction',
      '❤️ Nouvelle réaction',
      reactor_name || ' a aimé votre publication',
      NOW(),
      ARRAY['push', 'in_app'],
      jsonb_build_object(
        'post_id', NEW.post_id,
        'reactor_id', NEW.user_id,
        'reactor_name', reactor_name,
        'reaction_type', NEW.reaction_type,
        'action_url', '/community?post=' || NEW.post_id
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on post_reactions
DROP TRIGGER IF EXISTS trigger_notify_post_reaction ON public.post_reactions;
CREATE TRIGGER trigger_notify_post_reaction
  AFTER INSERT ON public.post_reactions
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_post_reaction();