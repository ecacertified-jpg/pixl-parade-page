-- ============================================
-- QUICK FIX: Fusion des comptes dupliqués
-- Date: 2026-01-12
-- ============================================

-- ============================================
-- 1. CAS CRITIQUE: Eca (avec données à transférer)
-- Primary: 2fbdc7e0-7426-4dab-8147-c50d113d5da1 (Google)
-- Secondary: 18190696-a87e-4c74-a8c8-a9968884e1cb (Phone)
-- ============================================

-- Transférer les collective_funds
UPDATE public.collective_funds 
SET creator_id = '2fbdc7e0-7426-4dab-8147-c50d113d5da1'
WHERE creator_id = '18190696-a87e-4c74-a8c8-a9968884e1cb';

-- Transférer les contributions
UPDATE public.fund_contributions 
SET contributor_id = '2fbdc7e0-7426-4dab-8147-c50d113d5da1'
WHERE contributor_id = '18190696-a87e-4c74-a8c8-a9968884e1cb';

-- Transférer les notifications
UPDATE public.notifications 
SET user_id = '2fbdc7e0-7426-4dab-8147-c50d113d5da1'
WHERE user_id = '18190696-a87e-4c74-a8c8-a9968884e1cb';

-- Enregistrer la fusion d'Eca
INSERT INTO public.user_account_merges (primary_user_id, secondary_user_id, merged_by, data_transferred)
VALUES (
  '2fbdc7e0-7426-4dab-8147-c50d113d5da1',
  '18190696-a87e-4c74-a8c8-a9968884e1cb',
  '2fbdc7e0-7426-4dab-8147-c50d113d5da1', -- Self-merge via admin
  '{"collective_funds": 1, "fund_contributions": 1, "notifications": "transferred"}'::jsonb
);

-- Suspendre le compte secondaire d'Eca
UPDATE public.profiles 
SET is_suspended = true, 
    bio = 'Compte fusionné avec le compte principal (2fbdc7e0-7426-4dab-8147-c50d113d5da1)'
WHERE user_id = '18190696-a87e-4c74-a8c8-a9968884e1cb';

-- ============================================
-- 2. Marie Grâce
-- Primary: b958c839-dc26-492c-b80a-d4b42818c271 (Google)
-- Secondary: 952ed2e7-e1ef-49ba-ac71-84096569b4c2 (Phone)
-- ============================================

INSERT INTO public.user_account_merges (primary_user_id, secondary_user_id, merged_by, data_transferred)
VALUES (
  'b958c839-dc26-492c-b80a-d4b42818c271',
  '952ed2e7-e1ef-49ba-ac71-84096569b4c2',
  'b958c839-dc26-492c-b80a-d4b42818c271',
  '{"note": "Aucune donnée à transférer"}'::jsonb
);

UPDATE public.profiles 
SET is_suspended = true, 
    bio = 'Compte fusionné avec le compte principal (b958c839-dc26-492c-b80a-d4b42818c271)'
WHERE user_id = '952ed2e7-e1ef-49ba-ac71-84096569b4c2';

-- ============================================
-- 3. Ange-alida
-- Primary: 1f643629-1fc5-4229-a82a-9a72bd988699 (Google)
-- Secondary: a32483b3-8fae-420a-8997-c6ba094f107e (Phone)
-- ============================================

INSERT INTO public.user_account_merges (primary_user_id, secondary_user_id, merged_by, data_transferred)
VALUES (
  '1f643629-1fc5-4229-a82a-9a72bd988699',
  'a32483b3-8fae-420a-8997-c6ba094f107e',
  '1f643629-1fc5-4229-a82a-9a72bd988699',
  '{"note": "Aucune donnée à transférer"}'::jsonb
);

UPDATE public.profiles 
SET is_suspended = true, 
    bio = 'Compte fusionné avec le compte principal (1f643629-1fc5-4229-a82a-9a72bd988699)'
WHERE user_id = 'a32483b3-8fae-420a-8997-c6ba094f107e';

-- ============================================
-- 4. Atsé Eliel
-- Primary: e901e8da-fc14-4f34-80fd-2f1541da79fb (Email)
-- Secondary: c0999c96-9bb7-4152-8fb9-361123c278b1 (Phone)
-- ============================================

INSERT INTO public.user_account_merges (primary_user_id, secondary_user_id, merged_by, data_transferred)
VALUES (
  'e901e8da-fc14-4f34-80fd-2f1541da79fb',
  'c0999c96-9bb7-4152-8fb9-361123c278b1',
  'e901e8da-fc14-4f34-80fd-2f1541da79fb',
  '{"note": "Aucune donnée à transférer"}'::jsonb
);

UPDATE public.profiles 
SET is_suspended = true, 
    bio = 'Compte fusionné avec le compte principal (e901e8da-fc14-4f34-80fd-2f1541da79fb)'
WHERE user_id = 'c0999c96-9bb7-4152-8fb9-361123c278b1';

-- ============================================
-- 5. Marc
-- Primary: b535e820-4509-47de-b249-7cd62d002887 (Google)
-- Secondary: 7aae244e-be2a-46b7-8e98-9391721f9553 (Phone)
-- ============================================

INSERT INTO public.user_account_merges (primary_user_id, secondary_user_id, merged_by, data_transferred)
VALUES (
  'b535e820-4509-47de-b249-7cd62d002887',
  '7aae244e-be2a-46b7-8e98-9391721f9553',
  'b535e820-4509-47de-b249-7cd62d002887',
  '{"note": "Aucune donnée à transférer"}'::jsonb
);

UPDATE public.profiles 
SET is_suspended = true, 
    bio = 'Compte fusionné avec le compte principal (b535e820-4509-47de-b249-7cd62d002887)'
WHERE user_id = '7aae244e-be2a-46b7-8e98-9391721f9553';

-- ============================================
-- 6. N'guessan Maurice
-- Primary: 22087ee9-401e-4681-8f7c-6f7a9f0644c0 (Email)
-- Secondary: a715d011-48c4-4af8-8462-aef850bdf261 (Phone)
-- ============================================

INSERT INTO public.user_account_merges (primary_user_id, secondary_user_id, merged_by, data_transferred)
VALUES (
  '22087ee9-401e-4681-8f7c-6f7a9f0644c0',
  'a715d011-48c4-4af8-8462-aef850bdf261',
  '22087ee9-401e-4681-8f7c-6f7a9f0644c0',
  '{"note": "Aucune donnée à transférer"}'::jsonb
);

UPDATE public.profiles 
SET is_suspended = true, 
    bio = 'Compte fusionné avec le compte principal (22087ee9-401e-4681-8f7c-6f7a9f0644c0)'
WHERE user_id = 'a715d011-48c4-4af8-8462-aef850bdf261';

-- ============================================
-- 7. Reine
-- Primary: b24cef5c-40b7-44fe-932c-bb6787d90fb3 (Google)
-- Secondary: 8a7b3e43-18fa-4a31-8694-8e4b50f7d244 (Phone)
-- ============================================

INSERT INTO public.user_account_merges (primary_user_id, secondary_user_id, merged_by, data_transferred)
VALUES (
  'b24cef5c-40b7-44fe-932c-bb6787d90fb3',
  '8a7b3e43-18fa-4a31-8694-8e4b50f7d244',
  'b24cef5c-40b7-44fe-932c-bb6787d90fb3',
  '{"note": "Aucune donnée à transférer"}'::jsonb
);

UPDATE public.profiles 
SET is_suspended = true, 
    bio = 'Compte fusionné avec le compte principal (b24cef5c-40b7-44fe-932c-bb6787d90fb3)'
WHERE user_id = '8a7b3e43-18fa-4a31-8694-8e4b50f7d244';