
ALTER TABLE public.admin_user_assignments ADD COLUMN assigned_via TEXT DEFAULT 'manual';
ALTER TABLE public.admin_business_assignments ADD COLUMN assigned_via TEXT DEFAULT 'manual';
