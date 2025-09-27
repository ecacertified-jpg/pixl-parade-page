-- Fix the trigger that's causing the bio update error
-- The handle_new_user trigger is being triggered on profiles table updates
-- We need to make sure it only triggers on auth.users inserts, not profiles updates

-- First, let's check what triggers exist on profiles table
-- We need to make sure the handle_new_user trigger is only on auth.users

-- Drop any incorrect trigger on profiles table if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON public.profiles;

-- The trigger should only be on auth.users table, let's recreate it properly
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();