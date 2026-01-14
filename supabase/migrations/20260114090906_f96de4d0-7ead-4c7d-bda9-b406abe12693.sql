-- Add country_code column to business_locations table
ALTER TABLE public.business_locations 
ADD COLUMN IF NOT EXISTS country_code TEXT DEFAULT 'CI';

-- Create index for country filtering
CREATE INDEX IF NOT EXISTS idx_business_locations_country 
ON public.business_locations(country_code);

-- Insert Benin cities
INSERT INTO public.business_locations (name, commune, country_code, is_public) VALUES
('Cotonou', 'Cotonou', 'BJ', true),
('Porto-Novo', 'Porto-Novo', 'BJ', true),
('Abomey-Calavi', 'Abomey-Calavi', 'BJ', true),
('Parakou', 'Parakou', 'BJ', true),
('Djougou', 'Djougou', 'BJ', true),
('Bohicon', 'Bohicon', 'BJ', true),
('Natitingou', 'Natitingou', 'BJ', true),
('Lokossa', 'Lokossa', 'BJ', true),
('Ouidah', 'Ouidah', 'BJ', true),
('Kandi', 'Kandi', 'BJ', true)
ON CONFLICT DO NOTHING;