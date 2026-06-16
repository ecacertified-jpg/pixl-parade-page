---
name: Premium Trial offert (1 événement Premium)
description: Premium émotionnel auto-attribué sur le 1er birthday_page / event_page / collective_fund — couvre l'item jusqu'au jour J, puis souvenirs (J+7), limité (J+30), archivé
type: feature
---

## Concept
Pas d'essai SaaS générique. Chaque utilisateur reçoit AUTOMATIQUEMENT un Premium offert sur SON PREMIER événement créé (birthday page, event page, ou collective fund — au plus une fois à vie).

## Backend
- Table `premium_trial_grants` (UNIQUE user_id) : target_type, target_id, event_date, premium_until, memories_until (J+7), archived_at (J+30), converted_to_premium.
- Triggers AFTER INSERT sur `birthday_pages`, `event_pages`, `collective_funds` → `_grant_premium_trial()` SECURITY DEFINER. Idempotent (no-op si grant existe).
- Birthday : event_date dérivée de `profiles.birthday` + `celebration_year`.
- RPC `get_premium_trial_status()` retourne phase calculée : `active | memories | limited | archived | none`.
- RPC `log_premium_trial_event(_event_type, _metadata)` pour analytics (table `premium_trial_events`).
- Aucun INSERT/UPDATE/DELETE direct côté client.

## États utilisateur
- `free` : aucun trial ou trial archivé
- `free_with_premium_event` : trial en phase active ou memories
- `premium` : abonnement payant actif (Wave)

## Frontend
- `usePlan` étendu : `state`, `baseTier`, `trial`, `trialPhase`, `isTrialCoveredItem(type,id)`. Le trial NE bascule PAS le tier global — il déverrouille seulement l'item ciblé via `FeatureGate trialContext={{targetType, targetId}}`.
- `usePremiumTrial({ targetType, targetId })` : helpers contextuels + `log()`.
- `<PremiumTrialUnlockModal>` : modal émotionnelle "cadeau" affichée une fois (localStorage) sur la page de l'item offert.
- `<PostEventConversionCard>` : carte affichée APRÈS la date de l'événement, déclinée selon phase (memories / limited / archived).
- `<PremiumTrialBanner>` : bandeau global discret sur Dashboard avec compte à rebours.
- CTA pointent vers `/pricing` avec log `upgrade_clicked`.

## Sécurité
- UNIQUE constraint sur `user_id` = impossible de réutiliser le trial.
- Triggers SECURITY DEFINER = pas de bypass client.
- RLS lecture only sur les deux tables.