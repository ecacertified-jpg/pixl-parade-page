-- Add suspension columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS suspension_reason TEXT;

-- Create index for better performance on suspended users queries
CREATE INDEX IF NOT EXISTS idx_profiles_suspended ON profiles(is_suspended) WHERE is_suspended = true;

-- Create reported_posts table for content moderation
CREATE TABLE IF NOT EXISTS reported_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES admin_users(user_id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create reported_comments table
CREATE TABLE IF NOT EXISTS reported_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES post_comments(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES admin_users(user_id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE reported_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE reported_comments ENABLE ROW LEVEL SECURITY;

-- Users can report posts
CREATE POLICY "Users can report posts" ON reported_posts 
FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = reporter_id);

-- Users can report comments
CREATE POLICY "Users can report comments" ON reported_comments 
FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = reporter_id);

-- Admins can view reported posts
CREATE POLICY "Admins can view reported posts" ON reported_posts 
FOR SELECT TO authenticated 
USING (EXISTS (
  SELECT 1 FROM admin_users 
  WHERE user_id = auth.uid() AND is_active = true
));

-- Admins can update reported posts
CREATE POLICY "Admins can update reported posts" ON reported_posts 
FOR UPDATE TO authenticated 
USING (EXISTS (
  SELECT 1 FROM admin_users 
  WHERE user_id = auth.uid() AND is_active = true
));

-- Admins can view reported comments
CREATE POLICY "Admins can view reported comments" ON reported_comments 
FOR SELECT TO authenticated 
USING (EXISTS (
  SELECT 1 FROM admin_users 
  WHERE user_id = auth.uid() AND is_active = true
));

-- Admins can update reported comments
CREATE POLICY "Admins can update reported comments" ON reported_comments 
FOR UPDATE TO authenticated 
USING (EXISTS (
  SELECT 1 FROM admin_users 
  WHERE user_id = auth.uid() AND is_active = true
));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_reported_posts_status ON reported_posts(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_reported_comments_status ON reported_comments(status) WHERE status = 'pending';