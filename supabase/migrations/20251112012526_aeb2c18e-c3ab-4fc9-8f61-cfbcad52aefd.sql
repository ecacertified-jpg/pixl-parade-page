-- Create invitations table to track user invitations
CREATE TABLE public.invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inviter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invitee_email TEXT NOT NULL,
  invitee_phone TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  invitation_token TEXT NOT NULL UNIQUE,
  invited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '30 days'),
  message TEXT,
  CONSTRAINT unique_inviter_invitee UNIQUE (inviter_id, invitee_email)
);

-- Enable RLS
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Users can view their own sent invitations
CREATE POLICY "Users can view their own invitations"
  ON public.invitations FOR SELECT
  TO authenticated
  USING (inviter_id = auth.uid());

-- Users can create invitations
CREATE POLICY "Users can create invitations"
  ON public.invitations FOR INSERT
  TO authenticated
  WITH CHECK (inviter_id = auth.uid());

-- Users can update their own invitations
CREATE POLICY "Users can update their own invitations"
  ON public.invitations FOR UPDATE
  TO authenticated
  USING (inviter_id = auth.uid());

-- Create index for faster lookups
CREATE INDEX idx_invitations_inviter ON public.invitations(inviter_id);
CREATE INDEX idx_invitations_token ON public.invitations(invitation_token);
CREATE INDEX idx_invitations_status ON public.invitations(status);

-- Add invitation stats to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS invitations_sent INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS invitations_accepted INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES auth.users(id);

-- Function to update invitation stats
CREATE OR REPLACE FUNCTION public.update_invitation_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update inviter's stats when invitation is accepted
  IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
    UPDATE public.profiles
    SET invitations_accepted = invitations_accepted + 1
    WHERE user_id = NEW.inviter_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger to update stats
CREATE TRIGGER trigger_update_invitation_stats
  AFTER UPDATE ON public.invitations
  FOR EACH ROW
  WHEN (NEW.status = 'accepted' AND OLD.status != 'accepted')
  EXECUTE FUNCTION public.update_invitation_stats();

-- Function to increment invitations_sent
CREATE OR REPLACE FUNCTION public.increment_invitations_sent()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET invitations_sent = invitations_sent + 1
  WHERE user_id = NEW.inviter_id;
  
  RETURN NEW;
END;
$$;

-- Trigger to increment sent count
CREATE TRIGGER trigger_increment_invitations_sent
  AFTER INSERT ON public.invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_invitations_sent();