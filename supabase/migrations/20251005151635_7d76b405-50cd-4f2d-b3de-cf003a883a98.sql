-- Créer la table gratitude_wall pour les messages de gratitude
CREATE TABLE public.gratitude_wall (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fund_id UUID NOT NULL REFERENCES public.collective_funds(id) ON DELETE CASCADE,
  contributor_id UUID NOT NULL,
  beneficiary_id UUID NOT NULL,
  message_type TEXT NOT NULL CHECK (message_type IN ('auto', 'personal')),
  message_text TEXT NOT NULL,
  is_public BOOLEAN DEFAULT true,
  reaction_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.gratitude_wall ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can view public gratitude messages
CREATE POLICY "Public gratitude messages are viewable by everyone"
ON public.gratitude_wall
FOR SELECT
USING (is_public = true);

-- Policy: Contributors and beneficiaries can view their messages
CREATE POLICY "Users can view their own gratitude messages"
ON public.gratitude_wall
FOR SELECT
USING (auth.uid() = contributor_id OR auth.uid() = beneficiary_id);

-- Policy: Contributors can create gratitude messages
CREATE POLICY "Contributors can create gratitude messages"
ON public.gratitude_wall
FOR INSERT
WITH CHECK (auth.uid() = contributor_id);

-- Policy: Users can update their own messages
CREATE POLICY "Users can update their own gratitude messages"
ON public.gratitude_wall
FOR UPDATE
USING (auth.uid() = contributor_id);

-- Create index for performance
CREATE INDEX idx_gratitude_wall_created_at ON public.gratitude_wall(created_at DESC);
CREATE INDEX idx_gratitude_wall_fund_id ON public.gratitude_wall(fund_id);
CREATE INDEX idx_gratitude_wall_beneficiary_id ON public.gratitude_wall(beneficiary_id);

-- Function to auto-increment reaction count
CREATE OR REPLACE FUNCTION public.increment_gratitude_reaction(p_gratitude_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.gratitude_wall
  SET reaction_count = reaction_count + 1
  WHERE id = p_gratitude_id;
END;
$$;

-- Trigger to create automatic gratitude message after contribution
CREATE OR REPLACE FUNCTION public.create_auto_gratitude()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  fund_creator UUID;
  contributor_name TEXT;
  fund_title TEXT;
BEGIN
  -- Get fund creator (beneficiary)
  SELECT creator_id, title INTO fund_creator, fund_title
  FROM public.collective_funds
  WHERE id = NEW.fund_id;
  
  -- Get contributor name
  SELECT COALESCE(first_name || ' ' || last_name, 'Un généreux donateur')
  INTO contributor_name
  FROM public.profiles
  WHERE user_id = NEW.contributor_id;
  
  -- Create automatic gratitude message
  INSERT INTO public.gratitude_wall (
    fund_id,
    contributor_id,
    beneficiary_id,
    message_type,
    message_text,
    is_public
  ) VALUES (
    NEW.fund_id,
    NEW.contributor_id,
    fund_creator,
    'auto',
    '✨ ' || contributor_name || ' a contribué ' || NEW.amount || ' ' || NEW.currency || 
    ' à la cagnotte "' || fund_title || '". Merci pour ce geste généreux ! 💝',
    true
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger on fund_contributions
CREATE TRIGGER trigger_auto_gratitude
AFTER INSERT ON public.fund_contributions
FOR EACH ROW
EXECUTE FUNCTION public.create_auto_gratitude();

-- Enable realtime for gratitude_wall
ALTER PUBLICATION supabase_realtime ADD TABLE public.gratitude_wall;