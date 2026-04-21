-- Backfill onboarding_furthest_step to 6 for completed users
UPDATE profiles 
SET onboarding_furthest_step = 6 
WHERE onboarding_completed = true AND COALESCE(onboarding_furthest_step, 0) < 6;