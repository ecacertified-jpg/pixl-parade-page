-- Add foreign key constraint between user_favorites and products
ALTER TABLE user_favorites
ADD CONSTRAINT user_favorites_product_id_fkey
FOREIGN KEY (product_id)
REFERENCES products(id)
ON DELETE CASCADE;