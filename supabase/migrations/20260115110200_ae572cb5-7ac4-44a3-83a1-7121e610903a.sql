-- Ajouter la colonne country_code à monthly_objectives (NULL = objectif global)
ALTER TABLE monthly_objectives
ADD COLUMN IF NOT EXISTS country_code TEXT;

-- Supprimer l'ancienne contrainte d'unicité si elle existe
ALTER TABLE monthly_objectives
DROP CONSTRAINT IF EXISTS monthly_objectives_year_month_metric_type_key;

-- Créer une nouvelle contrainte incluant country_code
-- Utiliser COALESCE pour gérer NULL comme valeur distincte
ALTER TABLE monthly_objectives
ADD CONSTRAINT monthly_objectives_unique_key 
UNIQUE NULLS NOT DISTINCT (year, month, metric_type, country_code);

-- Index pour les requêtes par pays
CREATE INDEX IF NOT EXISTS idx_monthly_objectives_country 
ON monthly_objectives(country_code);

-- Commentaire sur la colonne
COMMENT ON COLUMN monthly_objectives.country_code IS 'Code pays ISO (CI, SN, BJ, etc.) - NULL pour objectifs globaux';