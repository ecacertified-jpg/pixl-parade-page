-- Add Row Level Security policies for business_collective_funds table

-- Policy pour permettre aux propriétaires de business accounts de voir leurs fonds collectifs
CREATE POLICY "Business owners can view their collective funds"
ON public.business_collective_funds
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.business_accounts ba
    WHERE ba.id = business_collective_funds.business_id
    AND ba.user_id = auth.uid()
  )
  OR
  -- Also allow if the user is directly the business_id (fallback for direct user IDs)
  business_id = auth.uid()
);

-- Policy pour permettre aux propriétaires de business accounts de créer des fonds collectifs
CREATE POLICY "Business owners can create collective funds" 
ON public.business_collective_funds
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.business_accounts ba
    WHERE ba.id = business_collective_funds.business_id
    AND ba.user_id = auth.uid()
  )
  OR
  -- Also allow if the user is directly the business_id
  business_id = auth.uid()
);

-- Policy pour permettre aux propriétaires de business accounts de modifier leurs fonds collectifs
CREATE POLICY "Business owners can update their collective funds"
ON public.business_collective_funds
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.business_accounts ba
    WHERE ba.id = business_collective_funds.business_id
    AND ba.user_id = auth.uid()
  )
  OR
  business_id = auth.uid()
);

-- Policy pour permettre aux propriétaires de business accounts de supprimer leurs fonds collectifs
CREATE POLICY "Business owners can delete their collective funds"
ON public.business_collective_funds
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.business_accounts ba
    WHERE ba.id = business_collective_funds.business_id
    AND ba.user_id = auth.uid()
  )
  OR
  business_id = auth.uid()
);