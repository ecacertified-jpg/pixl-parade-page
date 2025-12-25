-- Set default value for is_active to true in admin_users table
ALTER TABLE admin_users 
ALTER COLUMN is_active SET DEFAULT true;