-- Create a database trigger to call the edge function when a new order is created

-- First, create the http extension if not exists (needed for pg_net)
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create the trigger function to notify business owner on new order
CREATE OR REPLACE FUNCTION public.notify_business_on_new_order()
RETURNS TRIGGER AS $$
DECLARE
  payload jsonb;
BEGIN
  -- Build the payload
  payload := jsonb_build_object(
    'type', 'INSERT',
    'table', 'business_orders',
    'record', jsonb_build_object(
      'id', NEW.id,
      'business_account_id', NEW.business_account_id,
      'total_amount', NEW.total_amount,
      'currency', NEW.currency,
      'status', NEW.status,
      'order_summary', NEW.order_summary,
      'delivery_address', NEW.delivery_address,
      'beneficiary_phone', NEW.beneficiary_phone,
      'donor_phone', NEW.donor_phone,
      'created_at', NEW.created_at
    ),
    'old_record', NULL
  );
  
  -- Call the edge function asynchronously using pg_net
  PERFORM net.http_post(
    url := 'https://vaimfeurvzokepqqqrsl.supabase.co/functions/v1/notify-business-order',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key', true)
    ),
    body := payload
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the transaction
    RAISE WARNING 'Failed to send order notification: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create the trigger on business_orders table
DROP TRIGGER IF EXISTS trigger_notify_business_on_new_order ON public.business_orders;

CREATE TRIGGER trigger_notify_business_on_new_order
  AFTER INSERT ON public.business_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_business_on_new_order();