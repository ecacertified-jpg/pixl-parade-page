-- Create business waitlist table
CREATE TABLE public.business_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  business_name TEXT NOT NULL,
  business_type TEXT,
  phone TEXT,
  contact_first_name TEXT NOT NULL,
  contact_last_name TEXT NOT NULL,
  motivation TEXT,
  city TEXT,
  position SERIAL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'invited', 'converted', 'rejected')),
  invited_at TIMESTAMPTZ,
  invitation_token TEXT UNIQUE,
  invitation_expires_at TIMESTAMPTZ,
  converted_to_business_id UUID REFERENCES business_accounts(id),
  processed_by UUID,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create unique index on email (case insensitive)
CREATE UNIQUE INDEX business_waitlist_email_unique ON public.business_waitlist (LOWER(email));

-- Enable RLS
ALTER TABLE public.business_waitlist ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert (public registration)
CREATE POLICY "Anyone can register to waitlist"
ON public.business_waitlist
FOR INSERT
WITH CHECK (true);

-- Policy: Users can view their own waitlist entry by email
CREATE POLICY "Users can view own waitlist entry"
ON public.business_waitlist
FOR SELECT
USING (true);

-- Policy: Admins can manage all entries
CREATE POLICY "Admins can manage waitlist"
ON public.business_waitlist
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid()
    AND is_active = true
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_business_waitlist_updated_at
BEFORE UPDATE ON public.business_waitlist
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_business_waitlist_status ON public.business_waitlist(status);
CREATE INDEX idx_business_waitlist_position ON public.business_waitlist(position);
CREATE INDEX idx_business_waitlist_invitation_token ON public.business_waitlist(invitation_token) WHERE invitation_token IS NOT NULL;