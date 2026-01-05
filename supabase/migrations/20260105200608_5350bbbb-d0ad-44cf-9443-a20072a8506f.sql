-- Enable required extensions for HTTP calls
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Function to notify business when a new order is created
CREATE OR REPLACE FUNCTION public.notify_business_on_new_order()
RETURNS TRIGGER AS $$
DECLARE
  supabase_url TEXT;
  anon_key TEXT;
BEGIN
  -- Get the Supabase URL and anon key from environment
  supabase_url := 'https://vaimfeurvzokepqqqrsl.supabase.co';
  anon_key := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhaW1mZXVydnpva2VwcXFxcnNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyNzgwMjYsImV4cCI6MjA2ODg1NDAyNn0.qX-5TcAzGZ4bk8trpEKbtQql9w0VxvnAvZfMBEkZ504';

  -- Call the edge function to send push notification
  PERFORM extensions.http_post(
    url := supabase_url || '/functions/v1/notify-business-order',
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', 'business_orders',
      'record', jsonb_build_object(
        'id', NEW.id,
        'business_account_id', NEW.business_account_id,
        'total_amount', NEW.total_amount,
        'currency', NEW.currency,
        'status', NEW.status,
        'created_at', NEW.created_at,
        'order_summary', NEW.order_summary,
        'delivery_address', NEW.delivery_address,
        'beneficiary_phone', NEW.beneficiary_phone,
        'donor_phone', NEW.donor_phone
      )
    )::text,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || anon_key
    )::text
  );
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail the transaction
  RAISE WARNING 'Error calling notify-business-order: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on business_orders for INSERT
DROP TRIGGER IF EXISTS on_business_order_created ON public.business_orders;
CREATE TRIGGER on_business_order_created
  AFTER INSERT ON public.business_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_business_on_new_order();

-- Add comment for documentation
COMMENT ON FUNCTION public.notify_business_on_new_order() IS 'Sends push notification to business owner when a new order is created';