
-- 1. client_accounts: client placeholders created by organizers
CREATE TABLE public.client_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_page_id uuid REFERENCES public.event_pages(id) ON DELETE SET NULL,
  claim_token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  first_name text NOT NULL,
  last_name text,
  phone text,
  email text,
  birthday date,
  birthday_page_id uuid REFERENCES public.birthday_pages(id) ON DELETE SET NULL,
  created_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  claimed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_client_accounts_organizer ON public.client_accounts(organizer_user_id);
CREATE INDEX idx_client_accounts_event ON public.client_accounts(event_page_id);
CREATE INDEX idx_client_accounts_token ON public.client_accounts(claim_token);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_accounts TO authenticated;
GRANT ALL ON public.client_accounts TO service_role;

ALTER TABLE public.client_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizer manages own client accounts"
  ON public.client_accounts FOR ALL
  TO authenticated
  USING (auth.uid() = organizer_user_id)
  WITH CHECK (auth.uid() = organizer_user_id);

CREATE POLICY "Claimed user can read own client account"
  ON public.client_accounts FOR SELECT
  TO authenticated
  USING (auth.uid() = created_user_id);

-- 2. client_admins: granted admin rights post-claim
CREATE TABLE public.client_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  granted_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  UNIQUE(client_user_id, admin_user_id)
);

CREATE INDEX idx_client_admins_admin ON public.client_admins(admin_user_id) WHERE revoked_at IS NULL;
CREATE INDEX idx_client_admins_client ON public.client_admins(client_user_id) WHERE revoked_at IS NULL;

GRANT SELECT ON public.client_admins TO authenticated;
GRANT ALL ON public.client_admins TO service_role;

ALTER TABLE public.client_admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin or client can read link"
  ON public.client_admins FOR SELECT
  TO authenticated
  USING (auth.uid() = admin_user_id OR auth.uid() = client_user_id);

-- 3. Helper: is_client_admin
CREATE OR REPLACE FUNCTION public.is_client_admin(_admin uuid, _client uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.client_admins
    WHERE admin_user_id = _admin
      AND client_user_id = _client
      AND revoked_at IS NULL
  );
$$;

-- 4. Allow organizer/admin to manage delegated birthday_pages
CREATE POLICY "Client admin manages delegated birthday pages"
  ON public.birthday_pages FOR ALL
  TO authenticated
  USING (public.is_client_admin(auth.uid(), user_id))
  WITH CHECK (public.is_client_admin(auth.uid(), user_id));

-- 5. updated_at trigger reuse
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_client_accounts_updated_at
  BEFORE UPDATE ON public.client_accounts
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
