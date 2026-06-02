-- ============================================================
-- Module Organisation : tables privées pour préparer les pages
-- ============================================================

-- Enums
DO $$ BEGIN
  CREATE TYPE public.organization_page_type AS ENUM ('birthday', 'event');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.organizer_role AS ENUM ('admin', 'tasks', 'budget', 'guests', 'vendors');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.organizer_status AS ENUM ('pending', 'accepted', 'revoked');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.event_task_status AS ENUM ('todo', 'in_progress', 'done');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.event_guest_status AS ENUM ('invited', 'confirmed', 'declined', 'pending');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- Table : event_organizers (co-organisateurs, hybride)
-- ============================================================
CREATE TABLE public.event_organizers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_type public.organization_page_type NOT NULL,
  page_id uuid NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_name text,
  invited_phone text,
  invited_email text,
  role public.organizer_role NOT NULL DEFAULT 'admin',
  status public.organizer_status NOT NULL DEFAULT 'pending',
  invite_token text UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_event_organizers_page ON public.event_organizers (page_type, page_id);
CREATE INDEX idx_event_organizers_user ON public.event_organizers (user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_event_organizers_token ON public.event_organizers (invite_token) WHERE status = 'pending';

GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_organizers TO authenticated;
GRANT ALL ON public.event_organizers TO service_role;
ALTER TABLE public.event_organizers ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Helper SECURITY DEFINER : peut-on gérer cette page ?
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_page_owner(_user_id uuid, _page_type public.organization_page_type, _page_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE _page_type
    WHEN 'birthday' THEN EXISTS (SELECT 1 FROM public.birthday_pages WHERE id = _page_id AND user_id = _user_id)
    WHEN 'event'    THEN EXISTS (SELECT 1 FROM public.event_pages    WHERE id = _page_id AND creator_id = _user_id)
  END;
$$;

CREATE OR REPLACE FUNCTION public.can_manage_page(
  _user_id uuid,
  _page_type public.organization_page_type,
  _page_id uuid,
  _required_role public.organizer_role DEFAULT NULL
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.is_page_owner(_user_id, _page_type, _page_id)
    OR EXISTS (
      SELECT 1 FROM public.event_organizers eo
      WHERE eo.page_type = _page_type
        AND eo.page_id = _page_id
        AND eo.user_id = _user_id
        AND eo.status = 'accepted'
        AND (_required_role IS NULL OR eo.role = 'admin' OR eo.role = _required_role)
    );
$$;

-- RLS event_organizers
CREATE POLICY "Managers can view organizers"
  ON public.event_organizers FOR SELECT
  USING (public.can_manage_page(auth.uid(), page_type, page_id));

CREATE POLICY "Invitee can view own pending invite by token"
  ON public.event_organizers FOR SELECT
  USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "Owners can add organizers"
  ON public.event_organizers FOR INSERT
  WITH CHECK (
    public.is_page_owner(auth.uid(), page_type, page_id)
    AND invited_by = auth.uid()
  );

CREATE POLICY "Owners can update organizers"
  ON public.event_organizers FOR UPDATE
  USING (public.is_page_owner(auth.uid(), page_type, page_id));

CREATE POLICY "Invitee can accept own invite"
  ON public.event_organizers FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Owners can revoke organizers"
  ON public.event_organizers FOR DELETE
  USING (public.is_page_owner(auth.uid(), page_type, page_id));

-- ============================================================
-- Trigger générique updated_at (réutilise update_updated_at_column si présent)
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER trg_event_organizers_updated
  BEFORE UPDATE ON public.event_organizers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- Table : event_tasks
-- ============================================================
CREATE TABLE public.event_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_type public.organization_page_type NOT NULL,
  page_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  due_date date,
  status public.event_task_status NOT NULL DEFAULT 'todo',
  assigned_to uuid REFERENCES public.event_organizers(id) ON DELETE SET NULL,
  position integer NOT NULL DEFAULT 0,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_event_tasks_page ON public.event_tasks (page_type, page_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_tasks TO authenticated;
GRANT ALL ON public.event_tasks TO service_role;
ALTER TABLE public.event_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Managers can read tasks"
  ON public.event_tasks FOR SELECT
  USING (public.can_manage_page(auth.uid(), page_type, page_id));
CREATE POLICY "Tasks managers can insert"
  ON public.event_tasks FOR INSERT
  WITH CHECK (public.can_manage_page(auth.uid(), page_type, page_id, 'tasks'));
CREATE POLICY "Tasks managers can update"
  ON public.event_tasks FOR UPDATE
  USING (public.can_manage_page(auth.uid(), page_type, page_id, 'tasks'));
CREATE POLICY "Tasks managers can delete"
  ON public.event_tasks FOR DELETE
  USING (public.can_manage_page(auth.uid(), page_type, page_id, 'tasks'));

CREATE TRIGGER trg_event_tasks_updated
  BEFORE UPDATE ON public.event_tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- Table : event_vendors
-- ============================================================
CREATE TABLE public.event_vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_type public.organization_page_type NOT NULL,
  page_id uuid NOT NULL,
  category text NOT NULL,
  name text NOT NULL,
  phone text,
  notes text,
  business_account_id uuid,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_event_vendors_page ON public.event_vendors (page_type, page_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_vendors TO authenticated;
GRANT ALL ON public.event_vendors TO service_role;
ALTER TABLE public.event_vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Managers can read vendors"
  ON public.event_vendors FOR SELECT
  USING (public.can_manage_page(auth.uid(), page_type, page_id));
CREATE POLICY "Vendors managers can insert"
  ON public.event_vendors FOR INSERT
  WITH CHECK (public.can_manage_page(auth.uid(), page_type, page_id, 'vendors'));
CREATE POLICY "Vendors managers can update"
  ON public.event_vendors FOR UPDATE
  USING (public.can_manage_page(auth.uid(), page_type, page_id, 'vendors'));
CREATE POLICY "Vendors managers can delete"
  ON public.event_vendors FOR DELETE
  USING (public.can_manage_page(auth.uid(), page_type, page_id, 'vendors'));

CREATE TRIGGER trg_event_vendors_updated
  BEFORE UPDATE ON public.event_vendors
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- Table : event_budget_items
-- ============================================================
CREATE TABLE public.event_budget_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_type public.organization_page_type NOT NULL,
  page_id uuid NOT NULL,
  category text NOT NULL,
  label text,
  planned_amount numeric(12,2) NOT NULL DEFAULT 0,
  spent_amount numeric(12,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'XOF',
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_event_budget_items_page ON public.event_budget_items (page_type, page_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_budget_items TO authenticated;
GRANT ALL ON public.event_budget_items TO service_role;
ALTER TABLE public.event_budget_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Managers can read budget"
  ON public.event_budget_items FOR SELECT
  USING (public.can_manage_page(auth.uid(), page_type, page_id));
CREATE POLICY "Budget managers can insert"
  ON public.event_budget_items FOR INSERT
  WITH CHECK (public.can_manage_page(auth.uid(), page_type, page_id, 'budget'));
CREATE POLICY "Budget managers can update"
  ON public.event_budget_items FOR UPDATE
  USING (public.can_manage_page(auth.uid(), page_type, page_id, 'budget'));
CREATE POLICY "Budget managers can delete"
  ON public.event_budget_items FOR DELETE
  USING (public.can_manage_page(auth.uid(), page_type, page_id, 'budget'));

CREATE TRIGGER trg_event_budget_items_updated
  BEFORE UPDATE ON public.event_budget_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- Table : event_guests
-- ============================================================
CREATE TABLE public.event_guests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_type public.organization_page_type NOT NULL,
  page_id uuid NOT NULL,
  name text NOT NULL,
  phone text,
  email text,
  contact_id uuid,
  status public.event_guest_status NOT NULL DEFAULT 'invited',
  note text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_event_guests_page ON public.event_guests (page_type, page_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_guests TO authenticated;
GRANT ALL ON public.event_guests TO service_role;
ALTER TABLE public.event_guests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Managers can read guests"
  ON public.event_guests FOR SELECT
  USING (public.can_manage_page(auth.uid(), page_type, page_id));
CREATE POLICY "Guests managers can insert"
  ON public.event_guests FOR INSERT
  WITH CHECK (public.can_manage_page(auth.uid(), page_type, page_id, 'guests'));
CREATE POLICY "Guests managers can update"
  ON public.event_guests FOR UPDATE
  USING (public.can_manage_page(auth.uid(), page_type, page_id, 'guests'));
CREATE POLICY "Guests managers can delete"
  ON public.event_guests FOR DELETE
  USING (public.can_manage_page(auth.uid(), page_type, page_id, 'guests'));

CREATE TRIGGER trg_event_guests_updated
  BEFORE UPDATE ON public.event_guests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
