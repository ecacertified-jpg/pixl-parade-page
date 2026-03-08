INSERT INTO platform_settings (setting_key, setting_value, setting_category, description)
VALUES ('platform_mobile_money_phone', '{"value": ""}', 'finance', 'Numéro Mobile Money JDV pour recevoir les commissions Orange/MTN')
ON CONFLICT (setting_key) DO NOTHING;