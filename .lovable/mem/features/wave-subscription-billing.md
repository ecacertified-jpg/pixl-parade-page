---
name: Wave subscription billing (plans, upgrade, downgrade, invoices, auto-renew)
description: Complete Wave subscription system — 3 plans (Free/Essentiel/Premium), monthly/yearly, free trial via Premium offert, upgrade/downgrade/cancel/auto-renew flows, invoices history page
type: feature
---

## Plans (table `subscription_plans`)
- `free` / `essentiel` / `premium`, monthly+yearly prices in EUR & XOF.
- One row per user in `user_subscriptions` (UNIQUE user_id).

## Free trial
- Pas d'essai SaaS classique. Cf. `premium-trial-offert.md` — Premium auto-attribué sur le 1er événement.

## Checkout (Wave manual)
- `WaveCheckoutModal` → edge `create-wave-subscription` → row in `wave_subscription_requests`.
- Admin valide via `confirm-wave-subscription` → RPC `process_wave_confirmation`:
  - Upsert `user_subscriptions` (period +30j/+365j)
  - Insère `subscription_events` (`created` | `renewed` | `upgraded`)
  - Insère `subscription_invoices` (status=`paid`, period, amount XOF)

## Upgrade
- Sur `/pricing`, si tier visé > tier courant → bouton "Upgrader vers …" qui ouvre `WaveCheckoutModal`.
- À la validation admin, `process_wave_confirmation` détecte `from_plan < to_plan` et log `upgraded`.

## Downgrade
- Edge `schedule-plan-downgrade` (authentifié): set `cancel_at_period_end=true` + `metadata.pending_downgrade_tier`.
- Effectif à `current_period_end` (le user garde son plan jusque-là). Log `downgrade_scheduled`.
- UI: AlertDialog de confirmation sur `/pricing`.

## Cancel
- `cancel-wave-subscription` (annule une demande pending) ou `cancel_at_period_end=true` côté UI.
- À l'expiration, `wave-subscription-expire` (RPC `expire_wave_subscriptions`) repasse en Free.

## Auto-renew (J-1)
- Cron `wave-subscription-auto-renew-daily` (jobid 37, `30 6 * * *`) appelle `wave-subscription-auto-renew`:
  - Cible `provider='wave' AND status='active' AND cancel_at_period_end=false AND current_period_end <= now+24h`.
  - Skip si une `wave_subscription_request` pending existe déjà.
  - Crée une nouvelle request avec le bon montant XOF + WhatsApp `🔁 ton abonnement expire demain… {APP_URL}/subscription`.
  - Idempotent via `metadata.auto_renew_attempted = YYYY-MM-DD`.
  - Log `subscription_events` type `auto_renew_attempted`.

## Reminders J-3 / J-1
- `wave-subscription-expiry-reminder` (existant) — WhatsApp message générique.

## Invoices
- Page `/invoices` (alias `/factures`): lit `subscription_invoices` filtré par RLS owner.
- Bouton "Reçu" → ouvre une fenêtre imprimable HTML (pas de PDF backend).
- Lien depuis `/subscription`.

## Edge functions
- `create-wave-subscription`, `cancel-wave-subscription`, `confirm-wave-subscription`, `reject-wave-subscription`
- `wave-subscription-expiry-reminder` (J-3/J-1 rappel)
- `wave-subscription-expire` (RPC expire + WhatsApp)
- `wave-subscription-auto-renew` (cron J-1, crée la request automatiquement)
- `schedule-plan-downgrade` (utilisateur programme un downgrade)

## Tables
- `subscription_plans`, `user_subscriptions`, `wave_subscription_requests`, `subscription_invoices`, `subscription_events`, `plan_overrides`.