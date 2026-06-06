
# Lot 3 — Abonnements via Wave (paiement manuel + validation admin)

Mise en place du paiement d'abonnement par Wave pour les utilisateurs d'Afrique de l'Ouest (CI, SN, BJ, TG, ML, BF), avec validation manuelle par l'admin et relances WhatsApp avant expiration. S'appuie sur la table `wave_subscription_requests` déjà créée au Lot 1.

## 1. Flow utilisateur

```text
/pricing → Clic "Payer avec Wave" sur Essentiel ou Premium
  → WaveCheckoutModal (XOF pré-rempli selon plan + cycle)
      • Affiche montant en FCFA, plan, durée (mensuel/annuel)
      • Bouton "Ouvrir Wave" → lien wave.com/checkout?amount=...&recipient=...
      • Champ optionnel : "Référence transaction Wave" (collable après paiement)
      • Bouton "J'ai payé" → crée wave_subscription_request (status='pending')
  → Écran de confirmation : "Ton paiement est en cours de vérification (≤ 24h).
       Tu recevras une notification WhatsApp dès activation."
  → Dashboard /subscription : carte "En attente de validation" + bouton "Annuler la demande"
```

Cycle de vie : `pending` → (admin valide) `confirmed` + activation `user_subscriptions` 30j/365j → relance J-3, J-1, J0 → expiration → retour `free` + soft-archive.

## 2. Composants frontend

| Fichier | Rôle |
|---|---|
| `src/features/subscription/WaveCheckoutModal.tsx` | Modal de paiement Wave (montant XOF, lien, "J'ai payé") |
| `src/features/subscription/WavePendingCard.tsx` | Carte d'état "en attente" sur le dashboard abonnement |
| `src/features/subscription/SubscriptionDashboard.tsx` | Page `/subscription` : plan actuel, prochain prélèvement, historique, demandes en attente |
| `src/features/subscription/useWaveCheckout.ts` | Hook : create request, cancel request, poll status |
| `src/pages/Subscription.tsx` | Route `/subscription` (et alias `/abonnement`) |
| Mise à jour `src/pages/Pricing.tsx` | Ajout bouton "Payer avec Wave" sur cartes Essentiel/Premium pour pays XOF |

## 3. Edge functions

| Fonction | Rôle |
|---|---|
| `create-wave-subscription` | Crée `wave_subscription_requests` (status='pending'), retourne le lien wave.com pré-rempli + l'ID de la demande. JWT requis. |
| `cancel-wave-subscription` | L'utilisateur annule sa demande tant que `status='pending'`. |
| `confirm-wave-subscription` | Admin uniquement. Marque `confirmed`, crée/upsert `user_subscriptions` (period_start = now, period_end = +30j ou +365j selon cycle), log `subscription_events`, crée `subscription_invoices`, notifie l'utilisateur via WhatsApp + in-app. |
| `reject-wave-subscription` | Admin uniquement. Marque `rejected` + raison, notifie l'utilisateur. |
| `wave-subscription-expiry-reminder` (cron quotidien 9h) | Scanne `user_subscriptions` actifs provider='wave'. Envoie WhatsApp J-3, J-1, J0. Logge dans `subscription_events`. |
| `wave-subscription-expire` (cron quotidien 2h) | Pour tout abonnement Wave dont `current_period_end < now()` : rétrograde plan→free, log event, notifie. |

Toutes utilisent : `Authorization: Bearer <jwt>` extrait + `getUser(token)`, CORS restreint, validation Zod.

## 4. Dashboard admin

| Fichier | Rôle |
|---|---|
| `src/pages/Admin/WaveSubscriptionsAdmin.tsx` | Liste filtrable des `wave_subscription_requests` (pending / confirmed / rejected / expired) |
| Colonnes affichées | User (nom, phone, pays), plan demandé, montant XOF, cycle, référence TX saisie, date demande, actions |
| Actions admin | "Confirmer le paiement" (modal de confirmation avec champ réf TX optionnel) / "Rejeter" (modal avec raison) |
| Filtres | Pays (CI/SN/BJ/TG/ML/BF), statut, plan, période |
| Route | `/admin/abonnements-wave` (rôle admin/super_admin requis) |
| Stats en haut | Demandes en attente, MRR Wave estimé, taux de confirmation, délai moyen de validation |

Ajout d'une **alerte admin** (banner dans `AdminDashboard` existant) : "X demandes Wave en attente depuis > 24h".

## 5. Notifications WhatsApp

Réutilise l'infra WhatsApp existante (`send-whatsapp-otp` pattern, templates Meta approuvés). Nouveaux messages texte libre (hors templates car non-OTP) :

| Événement | Message |
|---|---|
| Demande créée | "Ta demande d'abonnement {plan} JDV est en cours de vérification. On t'active sous 24h max. 💛" |
| Confirmation admin | "🎉 Ton abonnement {plan} JDV est activé jusqu'au {date}. Bienvenue dans la célébration sans limite !" |
| Rejet | "Ta demande {plan} JDV n'a pas pu être validée : {raison}. Réessaie ou contacte le support." |
| J-3 expiration | "Ton abonnement {plan} expire dans 3 jours. Renouvelle avec Wave pour ne rien perdre : {lien}" |
| J-1 expiration | "⏰ Plus que 24h ! Renouvelle ton {plan} maintenant : {lien}" |
| Expiration (J0) | "Ton abonnement {plan} a expiré. Tu repasses en Gratuit mais tes données restent intactes. Reviens quand tu veux : {lien}" |

## 6. Base de données

**Aucune nouvelle table** — `wave_subscription_requests` et `user_subscriptions` existent depuis Lot 1.

**Ajouts SQL nécessaires :**
- Index `wave_subscription_requests(status, created_at)` pour le dashboard admin
- Index `user_subscriptions(provider, current_period_end)` pour le cron d'expiration
- RLS sur `wave_subscription_requests` : user lit/insère/cancel ses propres demandes, admins lisent tout et update statut
- Trigger ou fonction `process_wave_confirmation(request_id)` (SECURITY DEFINER) qui upsert `user_subscriptions` + log event atomiquement
- Cron `pg_cron` pour les 2 nouvelles fonctions edge (rappel J-3/J-1 et expiration)

## 7. Hors périmètre Lot 3

- Pas d'API Wave Business (réconciliation auto) — V2 si volume justifie
- Pas de paiement CB internationale (Paddle reporté en Lot 7)
- Pas de remboursement automatique (admin manuel via `subscription_events`)
- Pas de Customer Portal (annulation = bouton "Ne pas renouveler" qui désactive le rappel)

## 8. Critères d'acceptation

- Un user CI/SN clique "Payer avec Wave" → reçoit un lien wave.com prérempli en XOF correct selon plan et cycle
- L'admin voit la demande dans `/admin/abonnements-wave` ≤ 1 min après création
- Confirmation admin → user reçoit WhatsApp + voit son plan actif dans `/subscription`
- Cron quotidien envoie bien J-3/J-1/J0
- À expiration : plan repasse à `free` automatiquement, ressources premium soft-archivées (pas supprimées)
- RLS : un user ne peut pas voir/modifier les demandes d'un autre user
- Tous les events tracés dans `subscription_events`

## 9. Découpage de livraison (à l'intérieur du Lot 3)

1. **3.1** Migration index + RLS + fonction `process_wave_confirmation`
2. **3.2** Edge functions `create-wave-subscription` + `cancel-wave-subscription` + hook `useWaveCheckout` + `WaveCheckoutModal`
3. **3.3** Page `/subscription` (`SubscriptionDashboard` + `WavePendingCard`) + bouton Wave dans Pricing
4. **3.4** Edge functions admin `confirm-wave-subscription` + `reject-wave-subscription` + page `WaveSubscriptionsAdmin`
5. **3.5** Crons `wave-subscription-expiry-reminder` + `wave-subscription-expire` + templates WhatsApp
6. **3.6** Tests end-to-end + alerte admin "demandes > 24h"

Si tu valides, j'attaque **3.1 (migration)** en premier en build mode, puis on enchaîne sous-lot par sous-lot.
