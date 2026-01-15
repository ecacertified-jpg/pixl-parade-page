-- Add assigned_countries column to admin_users table
ALTER TABLE admin_users
ADD COLUMN IF NOT EXISTS assigned_countries TEXT[] DEFAULT NULL;

-- Create index for efficient country-based queries
CREATE INDEX IF NOT EXISTS idx_admin_users_assigned_countries 
ON admin_users USING GIN(assigned_countries);

-- Add comment for documentation
COMMENT ON COLUMN admin_users.assigned_countries IS 
  'Array of country codes the admin can manage. NULL means all countries (Super Admin only). Example: ["CI", "SN"]';

-- Create a security definer function to check if admin can access a country
CREATE OR REPLACE FUNCTION public.admin_can_access_country(admin_user_id uuid, country_code text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM admin_users
    WHERE user_id = admin_user_id
      AND is_active = true
      AND (
        -- Super admin (no country restriction) or country is in assigned list
        assigned_countries IS NULL
        OR country_code = ANY(assigned_countries)
      )
  )
$$;

-- Create function to get admin's accessible countries
CREATE OR REPLACE FUNCTION public.get_admin_countries(admin_user_id uuid)
RETURNS TEXT[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT assigned_countries
  FROM admin_users
  WHERE user_id = admin_user_id
    AND is_active = true
$$;