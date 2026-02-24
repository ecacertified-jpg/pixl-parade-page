
-- Drop the old trigger first
DROP TRIGGER IF EXISTS on_business_order_created ON business_orders;

-- Replace the trigger function to use pg_net instead of extensions.http_post
CREATE OR REPLACE FUNCTION notify_business_on_new_order()
RETURNS TRIGGER AS $$
DECLARE
  request_id bigint;
BEGIN
  SELECT net.http_post(
    url := 'https://vaimfeurvzokepqqqrsl.supabase.co/functions/v1/notify-business-order',
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
        'donor_phone', NEW.donor_phone,
        'customer_id', NEW.customer_id
      )
    ),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'X-Source', 'db-trigger'
    )
  ) INTO request_id;

  RAISE LOG 'notify-business-order HTTP request queued via pg_net: %', request_id;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error calling notify-business-order via pg_net: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_business_order_created
  AFTER INSERT ON business_orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_business_on_new_order();
