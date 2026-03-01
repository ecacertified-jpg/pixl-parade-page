ALTER TABLE whatsapp_otp_codes
  ADD COLUMN IF NOT EXISTS whatsapp_message_id TEXT,
  ADD COLUMN IF NOT EXISTS delivery_status TEXT DEFAULT 'accepted',
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS failed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS delivery_error TEXT;

CREATE INDEX IF NOT EXISTS idx_whatsapp_otp_message_id
  ON whatsapp_otp_codes (whatsapp_message_id)
  WHERE whatsapp_message_id IS NOT NULL;