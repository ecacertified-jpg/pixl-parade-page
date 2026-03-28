ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;

UPDATE profiles SET onboarding_completed = true WHERE created_at < NOW() - INTERVAL '1 hour';