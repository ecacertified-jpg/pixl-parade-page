-- Créer une politique RLS pour permettre aux utilisateurs de voir les contacts
-- associés aux cagnottes publiques ou accessibles

CREATE POLICY "Users can view contacts linked to accessible funds"
ON public.contacts 
FOR SELECT
USING (
  -- Propres contacts (politique existante maintenue)
  auth.uid() = user_id
  OR
  -- Contacts liés à des cagnottes publiques
  EXISTS (
    SELECT 1 FROM public.collective_funds cf
    WHERE cf.beneficiary_contact_id = contacts.id
    AND (
      cf.is_public = true
      OR cf.creator_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.fund_contributions fc
        WHERE fc.fund_id = cf.id
        AND fc.contributor_id = auth.uid()
      )
    )
  )
);