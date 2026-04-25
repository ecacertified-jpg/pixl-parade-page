-- 1) Update can_contribute_to_fund to allow any authenticated user on public funds
CREATE OR REPLACE FUNCTION public.can_contribute_to_fund(fund_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_user_id uuid;
  fund_creator_id uuid;
  fund_status text;
  fund_is_public boolean;
  beneficiary_user_id uuid;
BEGIN
  current_user_id := auth.uid();

  IF current_user_id IS NULL THEN
    RETURN false;
  END IF;

  SELECT cf.creator_id, cf.status, cf.is_public, c.user_id
  INTO fund_creator_id, fund_status, fund_is_public, beneficiary_user_id
  FROM public.collective_funds cf
  LEFT JOIN public.contacts c ON c.id = cf.beneficiary_contact_id
  WHERE cf.id = fund_uuid;

  IF fund_creator_id IS NULL THEN
    RETURN false;
  END IF;

  IF fund_status != 'active' THEN
    RETURN false;
  END IF;

  -- Public funds: any authenticated user can contribute
  IF fund_is_public = true THEN
    RETURN true;
  END IF;

  -- Creator can always contribute
  IF fund_creator_id = current_user_id THEN
    RETURN true;
  END IF;

  -- Friends of the creator with permission can contribute
  IF EXISTS (
    SELECT 1 FROM public.contact_relationships
    WHERE ((user_a = current_user_id AND user_b = fund_creator_id) OR
           (user_a = fund_creator_id AND user_b = current_user_id))
    AND can_see_funds = true
  ) THEN
    RETURN true;
  END IF;

  -- Friends of the beneficiary can contribute
  IF beneficiary_user_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.contact_relationships
    WHERE (user_a = current_user_id AND user_b = beneficiary_user_id)
       OR (user_b = current_user_id AND user_a = beneficiary_user_id)
  ) THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$function$;

-- 2) Add guest contribution columns
ALTER TABLE public.fund_contributions
  ADD COLUMN IF NOT EXISTS guest_name text,
  ADD COLUMN IF NOT EXISTS guest_phone text,
  ADD COLUMN IF NOT EXISTS guest_email text,
  ADD COLUMN IF NOT EXISTS is_guest boolean NOT NULL DEFAULT false;

-- Allow contributor_id to be NULL for guest contributions
ALTER TABLE public.fund_contributions
  ALTER COLUMN contributor_id DROP NOT NULL;

-- Constraint: either authenticated contributor OR guest with name + phone
ALTER TABLE public.fund_contributions
  DROP CONSTRAINT IF EXISTS fund_contributions_contributor_or_guest_chk;

ALTER TABLE public.fund_contributions
  ADD CONSTRAINT fund_contributions_contributor_or_guest_chk
  CHECK (
    (contributor_id IS NOT NULL AND is_guest = false)
    OR (is_guest = true AND guest_name IS NOT NULL AND guest_phone IS NOT NULL)
  );
