-- Add video duration limits setting to platform_settings
INSERT INTO platform_settings (
  setting_key, 
  setting_value, 
  setting_category, 
  description
) VALUES (
  'video_duration_limits',
  '{
    "default_seconds": 180,
    "experience_seconds": 300,
    "product_seconds": 120,
    "enabled": true
  }'::jsonb,
  'general',
  'Limites de durée des vidéos par type de produit (expériences vs produits physiques)'
) ON CONFLICT (setting_key) DO NOTHING;