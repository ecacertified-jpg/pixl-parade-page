CREATE POLICY "Users can delete their own invitations"
ON public.invitations FOR DELETE
USING (inviter_id = auth.uid());