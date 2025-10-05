-- Add visibility column to posts table
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'public' 
CHECK (visibility IN ('public', 'friends'));