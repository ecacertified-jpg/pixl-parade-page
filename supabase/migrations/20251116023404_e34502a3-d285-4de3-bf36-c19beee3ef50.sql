-- Enable realtime for business_orders table
ALTER TABLE public.business_orders REPLICA IDENTITY FULL;

-- Add table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE business_orders;