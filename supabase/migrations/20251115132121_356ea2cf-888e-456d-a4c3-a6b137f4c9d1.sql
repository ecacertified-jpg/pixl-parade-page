-- Create trigger function to call award-invitation-rewards edge function
CREATE OR REPLACE FUNCTION public.trigger_award_invitation_rewards()
RETURNS TRIGGER AS $$
DECLARE
  invitation_record RECORD;
BEGIN
  -- Only proceed if status changed to 'accepted'
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
    -- Call edge function via pg_net (if available) or schedule notification
    -- For now, we'll insert a notification to trigger the edge function from client
    INSERT INTO public.scheduled_notifications (
      user_id,
      notification_type,
      title,
      message,
      scheduled_for,
      delivery_methods,
      metadata
    ) VALUES (
      NEW.inviter_id,
      'invitation_accepted_internal',
      'Invitation acceptée',
      'Traitement des récompenses en cours...',
      now(),
      ARRAY['in_app'],
      jsonb_build_object(
        'invitation_id', NEW.id,
        'inviter_id', NEW.inviter_id,
        'trigger_reward_processing', true
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on invitations table
DROP TRIGGER IF EXISTS on_invitation_accepted ON public.invitations;

CREATE TRIGGER on_invitation_accepted
AFTER UPDATE OF status ON public.invitations
FOR EACH ROW
EXECUTE FUNCTION public.trigger_award_invitation_rewards();