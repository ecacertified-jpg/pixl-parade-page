ALTER TABLE public.whatsapp_conversations 
  ADD COLUMN IF NOT EXISTS mode TEXT NOT NULL DEFAULT 'ai' CHECK (mode IN ('ai', 'human')),
  ADD COLUMN IF NOT EXISTS assigned_admin_id UUID REFERENCES auth.users(id);