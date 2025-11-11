-- Create trigger function to notify followers when a user creates a post
CREATE OR REPLACE FUNCTION public.notify_followers_new_post()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  author_name TEXT;
  author_avatar TEXT;
  follower_record RECORD;
  post_preview TEXT;
BEGIN
  -- Get author's name and avatar
  SELECT 
    COALESCE(first_name || ' ' || COALESCE(last_name, ''), first_name, 'Un utilisateur'),
    avatar_url
  INTO author_name, author_avatar
  FROM public.profiles
  WHERE user_id = NEW.author_id;

  -- Create a preview of the post content
  post_preview := CASE 
    WHEN LENGTH(NEW.content) > 100 THEN SUBSTRING(NEW.content FROM 1 FOR 97) || '...'
    ELSE NEW.content
  END;

  -- Notify all followers who have this preference enabled
  FOR follower_record IN 
    SELECT uf.follower_id
    FROM public.user_follows uf
    LEFT JOIN public.notification_preferences np ON np.user_id = uf.follower_id
    WHERE uf.following_id = NEW.author_id
    AND (np.id IS NULL OR np.categories->>'posts' IS NULL OR (np.categories->>'posts')::boolean = true)
  LOOP
    -- Create in-app notification
    INSERT INTO public.notifications (
      user_id,
      type,
      title,
      message,
      action_url,
      metadata
    ) VALUES (
      follower_record.follower_id,
      'new_post',
      'Nouvelle publication 📝',
      author_name || ' a publié quelque chose',
      '/community?post=' || NEW.id,
      jsonb_build_object(
        'post_id', NEW.id,
        'author_id', NEW.author_id,
        'author_name', author_name,
        'author_avatar', author_avatar,
        'post_preview', post_preview
      )
    );

    -- Create scheduled notification for push
    INSERT INTO public.scheduled_notifications (
      user_id,
      notification_type,
      title,
      message,
      scheduled_for,
      delivery_methods,
      metadata
    ) VALUES (
      follower_record.follower_id,
      'new_post',
      'Nouvelle publication 📝',
      author_name || ' : ' || post_preview,
      now(),
      ARRAY['push', 'in_app'],
      jsonb_build_object(
        'post_id', NEW.id,
        'author_id', NEW.author_id,
        'author_name', author_name,
        'action_url', '/community?post=' || NEW.id
      )
    );
  END LOOP;

  RETURN NEW;
END;
$$;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS on_post_created ON public.posts;

-- Create trigger on posts table
CREATE TRIGGER on_post_created
  AFTER INSERT ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_followers_new_post();