-- Activate the super_admin user
UPDATE admin_users 
SET is_active = true 
WHERE user_id = '3fc4a030-46ca-44f7-92d8-eb2d70e1610e';