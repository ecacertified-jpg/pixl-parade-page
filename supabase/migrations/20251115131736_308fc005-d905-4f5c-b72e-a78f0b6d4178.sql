-- Create invitation_rewards table
CREATE TABLE IF NOT EXISTS public.invitation_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invitation_id UUID NOT NULL REFERENCES public.invitations(id) ON DELETE CASCADE,
  reward_type TEXT NOT NULL CHECK (reward_type IN ('points', 'badge', 'discount')),
  reward_value JSONB NOT NULL,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  claimed BOOLEAN DEFAULT false,
  claimed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS policies for invitation_rewards
ALTER TABLE public.invitation_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own rewards"
  ON public.invitation_rewards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can claim their own rewards"
  ON public.invitation_rewards FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_invitation_rewards_user_id ON public.invitation_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_invitation_rewards_claimed ON public.invitation_rewards(user_id, claimed);

-- Add referral badges to badge_definitions
INSERT INTO public.badge_definitions (badge_key, category, name, description, level, requirement_type, requirement_threshold, icon, color_primary, color_secondary, is_active)
VALUES 
  ('ambassador_bronze', 'referral', 'Ambassadeur Bronze', 'Invitez 5 amis à rejoindre Joie de Vivre', 1, 'referral_count', 5, 'Users', '#CD7F32', '#8B5A2B', true),
  ('ambassador_silver', 'referral', 'Ambassadeur Argent', 'Invitez 10 amis à rejoindre Joie de Vivre', 2, 'referral_count', 10, 'Users', '#C0C0C0', '#A8A8A8', true),
  ('ambassador_gold', 'referral', 'Ambassadeur Or', 'Invitez 20 amis à rejoindre Joie de Vivre', 3, 'referral_count', 20, 'Award', '#FFD700', '#FFA500', true),
  ('ambassador_platinum', 'referral', 'Ambassadeur Platine', 'Invitez 50 amis à rejoindre Joie de Vivre', 4, 'referral_count', 50, 'Crown', '#E5E4E2', '#B8B8B8', true),
  ('ambassador_legend', 'referral', 'Légende', 'Invitez 100 amis à rejoindre Joie de Vivre', 5, 'referral_count', 100, 'Gem', '#9C27B0', '#7B1FA2', true)
ON CONFLICT (badge_key) DO NOTHING;

-- Function to get invitation statistics
CREATE OR REPLACE FUNCTION public.get_invitation_stats(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_sent', COUNT(*),
    'accepted', COUNT(*) FILTER (WHERE status = 'accepted'),
    'pending', COUNT(*) FILTER (WHERE status = 'pending'),
    'expired', COUNT(*) FILTER (WHERE status = 'expired'),
    'acceptance_rate', ROUND((COUNT(*) FILTER (WHERE status = 'accepted')::NUMERIC / NULLIF(COUNT(*), 0)) * 100, 1),
    'total_points', COUNT(*) FILTER (WHERE status = 'accepted') * 50,
    'avg_acceptance_days', ROUND(AVG(EXTRACT(EPOCH FROM (accepted_at - invited_at)) / 86400) FILTER (WHERE status = 'accepted'), 1)
  ) INTO result
  FROM public.invitations
  WHERE inviter_id = user_uuid;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;