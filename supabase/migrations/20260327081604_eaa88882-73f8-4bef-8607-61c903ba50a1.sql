-- Table for birthday wishes messages from friends
CREATE TABLE public.birthday_wishes_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  birthday_user_id UUID NOT NULL,
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  sender_name TEXT,
  message_text TEXT NOT NULL,
  is_from_fund BOOLEAN DEFAULT false,
  fund_id UUID REFERENCES public.collective_funds(id) ON DELETE SET NULL,
  celebration_year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM now()),
  thanks_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookup
CREATE INDEX idx_birthday_wishes_user_year ON public.birthday_wishes_messages(birthday_user_id, celebration_year);

-- Enable RLS
ALTER TABLE public.birthday_wishes_messages ENABLE ROW LEVEL SECURITY;

-- Birthday person can read their messages
CREATE POLICY "Birthday user can read their messages"
ON public.birthday_wishes_messages FOR SELECT
TO authenticated
USING (birthday_user_id = auth.uid());

-- Authenticated users can insert messages
CREATE POLICY "Authenticated users can insert messages"
ON public.birthday_wishes_messages FOR INSERT
TO authenticated
WITH CHECK (true);

-- Sender can update their own message
CREATE POLICY "Sender can update own message"
ON public.birthday_wishes_messages FOR UPDATE
TO authenticated
USING (sender_id = auth.uid());