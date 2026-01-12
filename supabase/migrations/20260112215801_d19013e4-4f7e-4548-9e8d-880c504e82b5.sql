-- Ajouter une colonne calculée 'priority' basée sur priority_score pour compatibilité
-- Utiliser une colonne générée pour éviter les erreurs de référence

-- Vérifier si la colonne n'existe pas déjà
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'scheduled_notifications' 
    AND column_name = 'priority'
  ) THEN
    ALTER TABLE scheduled_notifications 
    ADD COLUMN priority TEXT GENERATED ALWAYS AS (
      CASE 
        WHEN priority_score >= 80 THEN 'high'
        WHEN priority_score >= 50 THEN 'medium'
        ELSE 'low' 
      END
    ) STORED;
  END IF;
END $$;