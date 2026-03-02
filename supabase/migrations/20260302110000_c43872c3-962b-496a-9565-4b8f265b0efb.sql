-- Allow contributors to update their own contributions (for increasing amount)
CREATE POLICY "Contributors can update their own contributions"
ON public.fund_contributions
FOR UPDATE
USING (contributor_id = auth.uid())
WITH CHECK (contributor_id = auth.uid());