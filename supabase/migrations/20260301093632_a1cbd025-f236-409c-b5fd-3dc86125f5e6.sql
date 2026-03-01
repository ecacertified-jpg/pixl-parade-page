-- Step 1: Clean phone from merged/suspended secondary accounts
UPDATE profiles SET phone = NULL
WHERE user_id IN (
  '2f635847-3aa1-4758-b26d-4fcab43afdea',
  '447fb553-5da7-4d31-83a8-91eb425a9901',
  'd5d3b39d-4bee-45ee-985b-8bd46e8659f6',
  'a4132bbc-b23b-4d99-8fca-c09ca66b1ec2',
  'aae8fedd-8b84-4434-bf18-a7b8e78ffab5',
  '2fbdc7e0-7426-4dab-8147-c50d113d5da1',
  '3b8297f4-4817-49ed-9971-ab50e8ba9c34'
);

-- Step 2: Create partial unique index on phone for active accounts only
CREATE UNIQUE INDEX idx_profiles_phone_unique
ON profiles (phone)
WHERE phone IS NOT NULL AND phone != '' AND is_suspended = false;