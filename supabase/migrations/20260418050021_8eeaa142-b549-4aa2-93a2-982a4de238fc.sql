CREATE TABLE public.admin_fund_notif_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fund_id uuid NOT NULL,
  admin_user_id uuid NOT NULL,
  channel text NOT NULL DEFAULT 'whatsapp',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(fund_id, admin_user_id, channel)
);

CREATE INDEX idx_admin_fund_notif_log_fund ON public.admin_fund_notif_log(fund_id);
CREATE INDEX idx_admin_fund_notif_log_admin ON public.admin_fund_notif_log(admin_user_id);

ALTER TABLE public.admin_fund_notif_log ENABLE ROW LEVEL SECURITY;