-- Create collective funds table for group gifting
CREATE TABLE public.collective_funds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL,
  beneficiary_contact_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  target_amount NUMERIC NOT NULL,
  current_amount NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'XOF',
  occasion TEXT,
  deadline_date DATE,
  status TEXT DEFAULT 'active',
  is_public BOOLEAN DEFAULT false,
  allow_anonymous_contributions BOOLEAN DEFAULT false,
  share_token UUID DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.collective_funds ENABLE ROW LEVEL SECURITY;

-- Create fund contributions table
CREATE TABLE public.fund_contributions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fund_id UUID NOT NULL,
  contributor_id UUID,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'XOF',
  message TEXT,
  is_anonymous BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.fund_contributions ENABLE ROW LEVEL SECURITY;

-- Create fund activities table for tracking fund events
CREATE TABLE public.fund_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fund_id UUID NOT NULL,
  contributor_id UUID,
  activity_type TEXT NOT NULL,
  amount NUMERIC,
  currency TEXT DEFAULT 'XOF',
  message TEXT NOT NULL DEFAULT '',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.fund_activities ENABLE ROW LEVEL SECURITY;

-- Create policies for collective_funds
CREATE POLICY "Users can create their own collective funds" 
ON public.collective_funds 
FOR INSERT 
WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can update their own collective funds" 
ON public.collective_funds 
FOR UPDATE 
USING (auth.uid() = creator_id);

CREATE POLICY "Users can delete their own collective funds" 
ON public.collective_funds 
FOR DELETE 
USING (auth.uid() = creator_id);

CREATE POLICY "Users can view collective funds they created or contributed to" 
ON public.collective_funds 
FOR SELECT 
USING (
  auth.uid() = creator_id OR 
  EXISTS (
    SELECT 1 FROM public.fund_contributions 
    WHERE fund_id = collective_funds.id AND contributor_id = auth.uid()
  )
);

CREATE POLICY "Public funds are viewable via share token" 
ON public.collective_funds 
FOR SELECT 
USING (is_public = true);

-- Create policies for fund_contributions
CREATE POLICY "Users can create contributions to accessible funds" 
ON public.fund_contributions 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.collective_funds cf
    WHERE cf.id = fund_id AND (
      cf.creator_id = auth.uid() OR 
      cf.is_public = true OR
      cf.allow_anonymous_contributions = true
    )
  )
);

CREATE POLICY "Users can view contributions for accessible funds" 
ON public.fund_contributions 
FOR SELECT 
USING (
  auth.uid() = contributor_id OR
  EXISTS (
    SELECT 1 FROM public.collective_funds cf
    WHERE cf.id = fund_id AND cf.creator_id = auth.uid()
  )
);

-- Create policies for fund_activities
CREATE POLICY "Users can view fund activities for accessible funds" 
ON public.fund_activities 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.collective_funds cf
    WHERE cf.id = fund_id AND (
      cf.creator_id = auth.uid() OR 
      cf.is_public = true OR
      EXISTS (
        SELECT 1 FROM public.fund_contributions fc
        WHERE fc.fund_id = cf.id AND fc.contributor_id = auth.uid()
      )
    )
  )
);

-- Create trigger to update fund current_amount when contributions are added
CREATE OR REPLACE FUNCTION public.update_fund_current_amount()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the current_amount in collective_funds
  UPDATE public.collective_funds 
  SET current_amount = (
    SELECT COALESCE(SUM(amount), 0) 
    FROM public.fund_contributions 
    WHERE fund_id = NEW.fund_id
  )
  WHERE id = NEW.fund_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER update_fund_amount_trigger
AFTER INSERT ON public.fund_contributions
FOR EACH ROW EXECUTE FUNCTION public.update_fund_current_amount();

-- Create function to record fund activities
CREATE OR REPLACE FUNCTION public.create_fund_activity(
  p_fund_id UUID,
  p_contributor_id UUID,
  p_activity_type TEXT,
  p_amount NUMERIC DEFAULT NULL,
  p_message TEXT DEFAULT '',
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  activity_id UUID;
BEGIN
  INSERT INTO public.fund_activities (
    fund_id, 
    contributor_id, 
    activity_type, 
    amount, 
    message, 
    metadata
  ) VALUES (
    p_fund_id, 
    p_contributor_id, 
    p_activity_type, 
    p_amount, 
    p_message, 
    p_metadata
  ) RETURNING id INTO activity_id;
  
  RETURN activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;