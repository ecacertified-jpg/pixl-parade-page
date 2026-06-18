
-- ============================================================
-- Family Vault (coffre familial privé)
-- ============================================================
CREATE TABLE public.family_vault_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL,
  memory_source text NOT NULL CHECK (memory_source IN ('birthday','event')),
  memory_id uuid NOT NULL,
  caption text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_user_id, memory_source, memory_id)
);

CREATE INDEX idx_family_vault_owner ON public.family_vault_shares(owner_user_id);
CREATE INDEX idx_family_vault_memory ON public.family_vault_shares(memory_source, memory_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.family_vault_shares TO authenticated;
GRANT ALL ON public.family_vault_shares TO service_role;

ALTER TABLE public.family_vault_shares ENABLE ROW LEVEL SECURITY;

-- Owner full access
CREATE POLICY "Owner manages their family vault shares"
ON public.family_vault_shares
FOR ALL
TO authenticated
USING (auth.uid() = owner_user_id)
WITH CHECK (auth.uid() = owner_user_id);

-- Family members can view shares from people whose 'Famille' circle they belong to
CREATE POLICY "Family members can view shares"
ON public.family_vault_shares
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.friend_circles fc
    JOIN public.friend_circle_members fcm ON fcm.circle_id = fc.id
    JOIN public.contacts c ON c.id = fcm.contact_id
    WHERE fc.user_id = family_vault_shares.owner_user_id
      AND lower(fc.name) IN ('famille','family')
      AND c.linked_user_id = auth.uid()
  )
);

-- ============================================================
-- Souvenir Books (livres souvenirs PDF annuels)
-- ============================================================
CREATE TABLE public.souvenir_books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  year integer NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','generating','ready','failed')),
  pdf_url text,
  page_count integer,
  memory_count integer,
  error_message text,
  generated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, year)
);

CREATE INDEX idx_souvenir_books_user ON public.souvenir_books(user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.souvenir_books TO authenticated;
GRANT ALL ON public.souvenir_books TO service_role;

ALTER TABLE public.souvenir_books ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own souvenir books"
ON public.souvenir_books
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_souvenir_books_updated_at
BEFORE UPDATE ON public.souvenir_books
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
