-- Add linked_user_id to contacts to link a contact to a registered user
ALTER TABLE public.contacts
ADD COLUMN linked_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Index for efficient lookups
CREATE INDEX idx_contacts_linked_user_id ON public.contacts(linked_user_id) WHERE linked_user_id IS NOT NULL;