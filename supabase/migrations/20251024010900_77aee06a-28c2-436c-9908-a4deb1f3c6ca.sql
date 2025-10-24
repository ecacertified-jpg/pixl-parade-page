-- Add constraint for valid category names on products table
ALTER TABLE products 
ADD CONSTRAINT valid_category_name 
CHECK (
  category_name IN (
    -- Product categories
    'Bijoux & Accessoires',
    'Parfums & Beauté',
    'Tech & Électronique',
    'Mode & Vêtements',
    'Artisanat Ivoirien',
    'Gastronomie & Délices',
    'Décoration & Maison',
    'Loisirs & Divertissement',
    'Bébé & Enfants',
    'Affaires & Bureau',
    -- Experience categories
    'Restaurants & Gastronomie',
    'Bien-être & Spa',
    'Séjours & Hébergement',
    'Événements & Célébrations',
    'Formation & Développement',
    'Expériences VIP',
    'Souvenirs & Photographie',
    'Culture & Loisirs',
    'Mariage & Fiançailles',
    'Occasions Spéciales'
  ) OR category_name IS NULL
);

-- Add comment explaining the categories
COMMENT ON COLUMN products.category_name IS 'Category name must match one of the 20 predefined categories (10 product categories and 10 experience categories)';

-- Create index for better performance on category filtering
CREATE INDEX IF NOT EXISTS idx_products_category_name ON products(category_name);
CREATE INDEX IF NOT EXISTS idx_products_is_experience ON products(is_experience);
CREATE INDEX IF NOT EXISTS idx_products_category_experience ON products(category_name, is_experience);