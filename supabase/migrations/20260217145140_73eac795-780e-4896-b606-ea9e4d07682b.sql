UPDATE admin_users 
SET permissions = '{"manage_users": true, "manage_admins": true, "manage_businesses": true, "manage_content": true, "manage_finances": true, "view_analytics": true, "manage_settings": true}'::jsonb 
WHERE user_id = 'aa658506-36fd-474e-a956-67504ce16c3f';