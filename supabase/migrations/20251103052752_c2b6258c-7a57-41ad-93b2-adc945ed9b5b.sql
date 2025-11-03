-- Fix ERROR-level security issues - Part 3: Security Definer Views and Constraints

-- Drop any security definer views that may exist
DROP VIEW IF EXISTS public.fund_activities_secure CASCADE;

-- Add unique constraints to prevent duplicate reports (prevents spam)
ALTER TABLE public.reported_posts 
DROP CONSTRAINT IF EXISTS unique_user_post_report;

ALTER TABLE public.reported_posts 
ADD CONSTRAINT unique_user_post_report 
UNIQUE (reporter_id, post_id);

-- Check if reported_comments table exists before adding constraint
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'reported_comments') THEN
    ALTER TABLE public.reported_comments 
    DROP CONSTRAINT IF EXISTS unique_user_comment_report;
    
    ALTER TABLE public.reported_comments 
    ADD CONSTRAINT unique_user_comment_report 
    UNIQUE (reporter_id, comment_id);
  END IF;
END $$;