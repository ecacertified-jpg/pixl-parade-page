-- Create businesses table to allow multiple businesses per user
CREATE TABLE public.businesses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  business_name TEXT NOT NULL,
  business_type TEXT,
  phone TEXT,
  address TEXT,
  description TEXT,
  logo_url TEXT,
  website_url TEXT,
  email TEXT,
  opening_hours JSONB DEFAULT '{"lundi": {"open": "09:00", "close": "18:00"}, "mardi": {"open": "09:00", "close": "18:00"}, "mercredi": {"open": "09:00", "close": "18:00"}, "jeudi": {"open": "09:00", "close": "18:00"}, "vendredi": {"open": "09:00", "close": "18:00"}, "samedi": {"open": "09:00", "close": "18:00"}, "dimanche": {"open": "09:00", "close": "18:00", "closed": true}}'::JSONB,
  delivery_zones JSONB DEFAULT '[{"name": "Zone standard", "radius": 15, "cost": 2000}]'::JSONB,
  payment_info JSONB DEFAULT '{"mobile_money": "", "account_holder": ""}'::JSONB,
  delivery_settings JSONB DEFAULT '{"free_delivery_threshold": 25000, "standard_cost": 2000}'::JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own businesses" 
ON public.businesses 
FOR ALL 
USING (auth.uid() = user_id);

-- Add business_id to products table
ALTER TABLE public.products ADD COLUMN business_id UUID REFERENCES public.businesses(id);

-- Create trigger for updated_at
CREATE TRIGGER update_businesses_updated_at
  BEFORE UPDATE ON public.businesses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();