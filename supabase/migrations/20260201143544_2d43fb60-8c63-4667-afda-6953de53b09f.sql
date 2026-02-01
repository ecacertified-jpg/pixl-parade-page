-- Add neighborhood, latitude, longitude columns to profiles table for enhanced location tracking
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS neighborhood text,
ADD COLUMN IF NOT EXISTS latitude double precision,
ADD COLUMN IF NOT EXISTS longitude double precision;

-- Add index for location-based queries
CREATE INDEX IF NOT EXISTS idx_profiles_location ON public.profiles (city, neighborhood);
CREATE INDEX IF NOT EXISTS idx_profiles_coordinates ON public.profiles (latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.neighborhood IS 'User neighborhood within their city for more precise delivery';
COMMENT ON COLUMN public.profiles.latitude IS 'GPS latitude coordinate for proximity-based features';
COMMENT ON COLUMN public.profiles.longitude IS 'GPS longitude coordinate for proximity-based features';