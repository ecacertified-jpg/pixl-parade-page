-- Create table for business locations
CREATE TABLE public.business_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  commune TEXT,
  created_by UUID,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.business_locations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Business locations are viewable by everyone"
ON public.business_locations
FOR SELECT
USING (true);

CREATE POLICY "Users can create business locations"
ON public.business_locations
FOR INSERT
WITH CHECK (auth.uid() = created_by OR created_by IS NULL);

-- Add some default locations for Côte d'Ivoire
INSERT INTO public.business_locations (name, commune, is_public) VALUES
('Cocody', 'Cocody', true),
('Marcory', 'Marcory', true),
('Koumassi', 'Koumassi', true),
('Port-Bouët', 'Port-Bouët', true),
('Treichville', 'Treichville', true),
('Adjamé', 'Adjamé', true),
('Yopougon', 'Yopougon', true),
('Abobo', 'Abobo', true),
('Plateau', 'Plateau', true),
('Attécoubé', 'Attécoubé', true),
('Bingerville', 'Bingerville', true),
('Anyama', 'Anyama', true),
('Songon', 'Songon', true);