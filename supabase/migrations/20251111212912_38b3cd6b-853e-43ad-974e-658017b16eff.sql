-- Add notification preference columns to user_reciprocity_preferences table
ALTER TABLE user_reciprocity_preferences 
ADD COLUMN IF NOT EXISTS notify_on_friend_fund BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS min_reciprocity_score INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS notify_high_priority_only BOOLEAN DEFAULT true;

-- Add check constraint to ensure min_reciprocity_score is between 0 and 100
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_min_reciprocity_score'
  ) THEN
    ALTER TABLE user_reciprocity_preferences 
    ADD CONSTRAINT check_min_reciprocity_score 
    CHECK (min_reciprocity_score >= 0 AND min_reciprocity_score <= 100);
  END IF;
END $$;

-- Add helpful comment
COMMENT ON COLUMN user_reciprocity_preferences.notify_on_friend_fund IS 'Enable notifications when friends with high reciprocity create funds';
COMMENT ON COLUMN user_reciprocity_preferences.min_reciprocity_score IS 'Minimum reciprocity score threshold for notifications (0-100)';
COMMENT ON COLUMN user_reciprocity_preferences.notify_high_priority_only IS 'Only notify for high-priority reciprocity opportunities';