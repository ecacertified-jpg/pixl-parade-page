
-- Désactiver les anciens codes (garder seulement le plus récent par admin)
WITH ranked AS (
  SELECT id, admin_user_id,
    ROW_NUMBER() OVER (PARTITION BY admin_user_id ORDER BY created_at DESC) as rn
  FROM admin_share_codes
  WHERE is_active = true
)
UPDATE admin_share_codes SET is_active = false
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

-- Index unique partiel pour garantir un seul code actif par admin
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_code_per_admin
ON admin_share_codes (admin_user_id) WHERE is_active = true;
