-- Insert price_markup_rate setting
INSERT INTO platform_settings (setting_key, setting_value, setting_category, description)
VALUES ('price_markup_rate', '{"value": 0, "unit": "percent"}'::jsonb, 'finance', 'Taux de majoration appliqué aux prix des produits affichés aux clients')
ON CONFLICT (setting_key) DO NOTHING;