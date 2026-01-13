-- Add soft delete columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deleted_by UUID,
ADD COLUMN IF NOT EXISTS deletion_reason TEXT;

-- Create index for efficient queries on deleted accounts
CREATE INDEX IF NOT EXISTS idx_profiles_deleted ON profiles(is_deleted, deleted_at)
WHERE is_deleted = TRUE;

-- Create archive table for deleted clients (similar to business archives)
CREATE TABLE IF NOT EXISTS deleted_client_archives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL,
  user_id UUID NOT NULL,
  archived_data JSONB NOT NULL DEFAULT '{}',
  deleted_by UUID,
  deleted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for archive table
ALTER TABLE deleted_client_archives ENABLE ROW LEVEL SECURITY;

-- Only admins can view deleted client archives
CREATE POLICY "Admins can view deleted client archives"
ON deleted_client_archives
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- Only admins can insert into archives
CREATE POLICY "Admins can insert deleted client archives"
ON deleted_client_archives
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- Only admins can delete archives
CREATE POLICY "Admins can delete client archives"
ON deleted_client_archives
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- Update RLS on profiles to hide deleted users from normal queries
DROP POLICY IF EXISTS "Users can view profiles based on privacy" ON profiles;

CREATE POLICY "Users can view profiles based on privacy"
ON profiles FOR SELECT
USING (
  (is_deleted IS NULL OR is_deleted = false) AND (
    auth.uid() = user_id
    OR privacy_setting = 'public'
    OR (privacy_setting = 'friends' AND EXISTS (
      SELECT 1 FROM user_follows
      WHERE follower_id = auth.uid()
      AND following_id = user_id
    ))
    OR EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid() AND is_active = true
    )
  )
);