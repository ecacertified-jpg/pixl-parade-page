-- Ajouter la colonne video_uploaded_at pour le SEO VideoSchema
ALTER TABLE products 
ADD COLUMN video_uploaded_at TIMESTAMP WITH TIME ZONE;

-- Migrer les données existantes : utiliser created_at pour les produits qui ont déjà une vidéo
UPDATE products 
SET video_uploaded_at = created_at 
WHERE video_url IS NOT NULL AND video_uploaded_at IS NULL;

-- Ajouter un commentaire pour la documentation
COMMENT ON COLUMN products.video_uploaded_at IS 'Date de publication de la vidéo pour le SEO (VideoSchema uploadDate)';