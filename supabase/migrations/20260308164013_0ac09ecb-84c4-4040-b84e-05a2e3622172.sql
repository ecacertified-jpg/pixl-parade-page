
DROP POLICY IF EXISTS "Users can create contact requests" ON contact_requests;
CREATE POLICY "Users can create contact requests" ON contact_requests
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = requester_id 
  AND requester_id <> target_id
  AND NOT EXISTS (
    SELECT 1 FROM contact_requests cr
    WHERE cr.requester_id = auth.uid()
    AND cr.target_id = contact_requests.target_id
    AND cr.status = 'pending'
    AND cr.expires_at > now()
  )
);
