-- Fix rate_limit_buckets table security
ALTER TABLE public.rate_limit_buckets ENABLE ROW LEVEL SECURITY;

-- Create policy for rate_limit_buckets (system use only)
CREATE POLICY "System can manage rate limit buckets" 
ON public.rate_limit_buckets 
FOR ALL 
USING (false) 
WITH CHECK (false);

-- Fix database functions search_path security
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, first_name, last_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'first_name', NEW.raw_user_meta_data ->> 'last_name');
  RETURN NEW;
END;
$function$;

-- Create trigger for automatic profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();