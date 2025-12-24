-- Table pour stocker les objectifs mensuels
CREATE TABLE public.monthly_objectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  metric_type TEXT NOT NULL, -- 'users', 'businesses', 'revenue', 'orders', 'funds'
  target_value NUMERIC NOT NULL,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT month_range CHECK (month BETWEEN 1 AND 12),
  CONSTRAINT unique_objective UNIQUE(year, month, metric_type)
);

-- Enable RLS
ALTER TABLE public.monthly_objectives ENABLE ROW LEVEL SECURITY;

-- Policy for admins to manage objectives
CREATE POLICY "Admins can view objectives"
ON public.monthly_objectives FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "Admins can insert objectives"
ON public.monthly_objectives FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "Admins can update objectives"
ON public.monthly_objectives FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "Admins can delete objectives"
ON public.monthly_objectives FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- Index for faster queries
CREATE INDEX idx_monthly_objectives_year_month ON public.monthly_objectives(year, month);
CREATE INDEX idx_monthly_objectives_metric ON public.monthly_objectives(metric_type);

-- Trigger for updated_at
CREATE TRIGGER update_monthly_objectives_updated_at
BEFORE UPDATE ON public.monthly_objectives
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();