-- Update the fund_activities constraint to include 'fund_created' activity type
ALTER TABLE public.fund_activities 
DROP CONSTRAINT fund_activities_activity_type_check;

ALTER TABLE public.fund_activities 
ADD CONSTRAINT fund_activities_activity_type_check 
CHECK (activity_type = ANY (ARRAY['contribution'::text, 'target_reached'::text, 'deadline_extended'::text, 'fund_completed'::text, 'fund_created'::text]));