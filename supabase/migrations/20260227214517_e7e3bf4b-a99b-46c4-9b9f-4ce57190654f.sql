
-- Add deliverability tracking columns to whatsapp_template_logs
ALTER TABLE public.whatsapp_template_logs
  ADD COLUMN IF NOT EXISTS whatsapp_message_id text,
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz,
  ADD COLUMN IF NOT EXISTS read_at timestamptz,
  ADD COLUMN IF NOT EXISTS failed_at timestamptz;

-- Index for fast lookup during webhook callbacks
CREATE INDEX IF NOT EXISTS idx_whatsapp_template_logs_message_id
  ON public.whatsapp_template_logs (whatsapp_message_id)
  WHERE whatsapp_message_id IS NOT NULL;
