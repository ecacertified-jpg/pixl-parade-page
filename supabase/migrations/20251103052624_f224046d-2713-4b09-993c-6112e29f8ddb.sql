-- Fix ERROR-level security issues - Part 1: Contacts RLS

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can view contacts linked to accessible funds" ON public.contacts;

-- Create a secure view that only exposes minimal contact information
CREATE OR REPLACE VIEW public.contacts_limited AS
SELECT 
  c.id,
  c.name,
  c.birthday,
  c.user_id
FROM public.contacts c;

-- Grant access to the view
GRANT SELECT ON public.contacts_limited TO authenticated;

-- Create a new restrictive policy - users can only see their OWN contacts
CREATE POLICY "Users can only view their own contacts"
ON public.contacts 
FOR SELECT
USING (auth.uid() = user_id);