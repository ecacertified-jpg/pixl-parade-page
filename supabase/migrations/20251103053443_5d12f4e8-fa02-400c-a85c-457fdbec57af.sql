-- Fix reported content tables security policies

-- Add DELETE policies for super admins
CREATE POLICY "Super admins can delete post reports"
ON reported_posts FOR DELETE
USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can delete comment reports"
ON reported_comments FOR DELETE
USING (public.is_super_admin(auth.uid()));

-- Add foreign key constraints for reviewed_by
ALTER TABLE reported_posts
ADD CONSTRAINT fk_post_reports_reviewed_by
FOREIGN KEY (reviewed_by) 
REFERENCES admin_users(id) 
ON DELETE SET NULL;

ALTER TABLE reported_comments
ADD CONSTRAINT fk_comment_reports_reviewed_by
FOREIGN KEY (reviewed_by) 
REFERENCES admin_users(id) 
ON DELETE SET NULL;

-- Add documentation comment about payment_info security
COMMENT ON COLUMN business_accounts.payment_info IS 
'SECURITY: Store only non-sensitive payment metadata. Never store actual credentials. Use payment processor tokens (Stripe customer IDs, etc.) instead of account numbers. For mobile money, store only masked references.';

COMMENT ON COLUMN business_accounts.delivery_settings IS
'JSON structure for delivery configuration including thresholds and standard costs. Non-sensitive operational data.';