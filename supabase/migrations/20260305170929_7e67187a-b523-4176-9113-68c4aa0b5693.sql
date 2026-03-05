
-- Table for tracking user sessions
CREATE TABLE public.user_session_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL DEFAULT now(),
  last_active_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  duration_minutes numeric GENERATED ALWAYS AS (
    EXTRACT(EPOCH FROM (COALESCE(ended_at, last_active_at) - started_at)) / 60
  ) STORED,
  ip_address text,
  user_agent text
);

-- Indexes
CREATE INDEX idx_user_session_logs_user_id ON public.user_session_logs(user_id);
CREATE INDEX idx_user_session_logs_started_at ON public.user_session_logs(started_at DESC);

-- Enable RLS
ALTER TABLE public.user_session_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own sessions
CREATE POLICY "Users can view own sessions"
ON public.user_session_logs FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own sessions
CREATE POLICY "Users can insert own sessions"
ON public.user_session_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own sessions
CREATE POLICY "Users can update own sessions"
ON public.user_session_logs FOR UPDATE
USING (auth.uid() = user_id);

-- Admins can view all sessions
CREATE POLICY "Admins can view all sessions"
ON public.user_session_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid()
    AND is_active = true
  )
);
