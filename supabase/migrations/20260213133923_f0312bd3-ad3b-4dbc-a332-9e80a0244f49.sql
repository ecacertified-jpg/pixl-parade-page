
-- Table: admin_user_assignments
CREATE TABLE public.admin_user_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES public.admin_users(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(admin_user_id, user_id)
);

ALTER TABLE public.admin_user_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active admins can view user assignments"
ON public.admin_user_assignments FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "Super admins can manage user assignments"
ON public.admin_user_assignments FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid() AND is_active = true AND role = 'super_admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid() AND is_active = true AND role = 'super_admin'
  )
);

-- Table: admin_business_assignments
CREATE TABLE public.admin_business_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES public.admin_users(id) ON DELETE CASCADE,
  business_account_id UUID NOT NULL REFERENCES public.business_accounts(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(admin_user_id, business_account_id)
);

ALTER TABLE public.admin_business_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active admins can view business assignments"
ON public.admin_business_assignments FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "Super admins can manage business assignments"
ON public.admin_business_assignments FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid() AND is_active = true AND role = 'super_admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid() AND is_active = true AND role = 'super_admin'
  )
);

-- Indexes for performance
CREATE INDEX idx_admin_user_assignments_admin ON public.admin_user_assignments(admin_user_id);
CREATE INDEX idx_admin_user_assignments_user ON public.admin_user_assignments(user_id);
CREATE INDEX idx_admin_business_assignments_admin ON public.admin_business_assignments(admin_user_id);
CREATE INDEX idx_admin_business_assignments_business ON public.admin_business_assignments(business_account_id);
