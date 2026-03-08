INSERT INTO public.payment_methods (code, name, display_name, currency, is_active, config)
VALUES ('wave', 'Wave', 'Wave', 'XOF', true, '{"supported_countries": ["CI", "SN"]}')
ON CONFLICT (code) DO NOTHING;