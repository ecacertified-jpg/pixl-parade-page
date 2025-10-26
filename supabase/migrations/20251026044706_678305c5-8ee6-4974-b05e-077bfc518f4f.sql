-- Add collective_fund_id to gifts table if not exists
ALTER TABLE gifts ADD COLUMN IF NOT EXISTS collective_fund_id UUID REFERENCES collective_funds(id);

-- Create gift_thanks table to store thank you messages
CREATE TABLE IF NOT EXISTS gift_thanks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gift_id UUID REFERENCES gifts(id) ON DELETE CASCADE,
  collective_fund_id UUID REFERENCES collective_funds(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  message TEXT NOT NULL,
  emoji TEXT,
  is_group_message BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create gift_thanks_recipients table to track who received the thanks
CREATE TABLE IF NOT EXISTS gift_thanks_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thank_message_id UUID REFERENCES gift_thanks(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE gift_thanks ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_thanks_recipients ENABLE ROW LEVEL SECURITY;

-- RLS Policies for gift_thanks
CREATE POLICY "Users can create their own thank you messages"
  ON gift_thanks FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can view thank you messages they sent"
  ON gift_thanks FOR SELECT
  USING (auth.uid() = sender_id);

CREATE POLICY "Contributors can view thank you messages sent to them"
  ON gift_thanks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM gift_thanks_recipients gtr
      WHERE gtr.thank_message_id = gift_thanks.id
      AND gtr.recipient_id = auth.uid()
    )
  );

-- RLS Policies for gift_thanks_recipients
CREATE POLICY "Users can view their received thank you messages"
  ON gift_thanks_recipients FOR SELECT
  USING (auth.uid() = recipient_id);

CREATE POLICY "Senders can create thank you recipients"
  ON gift_thanks_recipients FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM gift_thanks gt
      WHERE gt.id = gift_thanks_recipients.thank_message_id
      AND gt.sender_id = auth.uid()
    )
  );

CREATE POLICY "Recipients can update read status"
  ON gift_thanks_recipients FOR UPDATE
  USING (auth.uid() = recipient_id);