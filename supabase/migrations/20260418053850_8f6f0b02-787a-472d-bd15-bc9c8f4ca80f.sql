ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS onboarding_furthest_step integer NOT NULL DEFAULT 0;