-- Add customer_review_text column to business_orders
ALTER TABLE public.business_orders 
ADD COLUMN IF NOT EXISTS customer_review_text text;