
# PRD — Joie de Vivre Africa : système d'abonnements SaaS

## 1. Vision produit

JDV est un réseau social émotionnel africain qui aide à **préparer, célébrer et préserver** les moments heureux (anniversaires, mariages, baptêmes, réussites, naissances, promotions, fêtes communautaires).

Le système d'abonnement doit :
- garder un **freemium pur** (gratuit utile à vie, conversion volontaire),
- rendre le Premium **émotionnellement désirable** (badges publics, thèmes exclusifs, souvenirs illimités),
- supporter **multi-devises** (EUR, XOF, USD) via Stripe + un fallback **Wave** (renouvellement manuel) pour l'Afrique de l'Ouest.

## 2. Grille tarifaire

| Plan | Prix | Cible | Promesse émotionnelle |
|---|---|---|---|
| **Gratuit** | 0 | Découverte, invités | "Célèbre les tiens, simplement." |
| **Essentiel** | 4,99 € / mois (≈ 3 200 FCFA) | Utilisateurs réguliers | "Crée des célébrations qui marquent." |
| **Premium** | 12,99 € / mois (≈ 8 500 FCFA) | Organisateurs, familles, leaders communautaires | "Inoubliable. Sans limite. Reconnu." |

Annuel : -20 % (49 € / 129 €). Multi-devises gérées par Stripe (Price IDs par devise).

## 3. Matrice de fonctionnalités (feature gating)

| Capacité | Gratuit | Essentiel | Premium |
|---|---|---|---|
| Pages événement actives | **1** | 5 | **Illimitées** |
| Vidéo de couverture HD (>1080p) | ❌ | 720p | **HD 1080p + animations** |
| Album souvenirs / photos par page | 20 | 100 | **Illimitées** |
| Export album (PDF / vidéo souvenir) | ❌ | PDF | **PDF + vidéo MP4** |
| Cagnottes collectives | ✅ (commission 5 %) | commission 3 % | **0 % commission JDV** |
| Cagnottes simultanées actives | 1 | 3 | **Illimitées** |
| Thèmes de page | 3 basiques | 10 | **Tous + exclusifs Premium** |
| Messages de vœux affichés | 50 | 200 | **Illimités** |
| Badge public Premium 💜 | ❌ | Badge "Essentiel" | **Badge "Premium" doré + halo profil** |
| Invités max par page | 30 | 150 | **Illimités** |
| Stockage cloud media | 500 Mo | 5 Go | **50 Go** |
| Co-organisateurs par événement | 0 | 2 | **10** |
| Publicité / sponsoring | ✅ | Réduite | **Aucune** |
| Support | Communautaire | Email 48 h | **WhatsApp prioritaire 24 h** |
| AI gift recommendations / mois | 5 | 30 | **Illimitées** |

> Règle : un utilisateur Gratuit ne peut **jamais** accéder à une ressource Premium, même via URL directe (vérif côté RLS + edge function).

## 4. User flows clés

### 4.1 Upgrade (Stripe)
```text
Profile/Settings → "Passer Premium"
  → Page pricing (3 cartes)
  → Clic plan → edge fn `create-checkout-session`
  → Stripe Checkout (hosted, multi-devises)
  → Webhook `stripe-webhook` → upsert user_subscriptions
  → Redirect /subscription/success → Confetti + badge déverrouillé
```

### 4.2 Upgrade (Wave – CI/SN/BJ)
```text
Pricing → "Payer avec Wave"
  → Modal : montant en XOF pré-rempli, lien wave.com/checkout généré
  → Création `pending_subscription` (status='awaiting_wave')
  → Utilisateur paie → preuve TX optionnelle
  → Cron `wave-subscription-reconcile` (admin valide manuellement OU API Wave)
  → Activation 30 jours + relance WhatsApp J-3 avant expiration
```

### 4.3 Downgrade / cancel
```text
Settings → "Gérer abonnement" → Stripe Customer Portal (ou bouton cancel Wave)
  → Webhook → status='canceled', current_period_end conservé
  → À expiration : trigger SQL rétrograde plan='free' + soft-archive ressources premium (jamais supprimées)
```

### 4.4 Hit d'un quota (ex. 2ᵉ page événement en Gratuit)
```text
Action bloquée → Modal émotionnelle "Tu as déjà 1 célébration en cours 💛
  Passe Premium pour ne jamais avoir à choisir."
  → CTA Upgrade + lien "voir tous les avantages"
```

## 5. Rôles & permissions

| Rôle | Source | Capacités |
|---|---|---|
| `free_user` | défaut | Quotas Gratuit |
| `essentiel_user` | `user_subscriptions.plan='essentiel' AND status='active'` | Quotas Essentiel |
| `premium_user` | idem `'premium'` | Quotas Premium + badge public |
| `business_user` | table `business_accounts` | inchangé |
| `admin` / `super_admin` | `admin_users` | + dashboard abonnements, refunds, override plan |

Helper SQL : `public.get_user_plan(uid)` → `'free'|'essentiel'|'premium'` (SECURITY DEFINER, stable).
Helper TS : `usePlan()` hook + `<FeatureGate feature="unlimited_pages">`.

## 6. États UI

- **Pricing page** : 3 cartes responsive, toggle Mensuel/Annuel, sélecteur devise auto-détectée, badge "Le plus choisi" sur Premium, comparatif scrollable.
- **Subscription dashboard** : plan actuel, prochain prélèvement, historique factures (Stripe), boutons upgrade/cancel, jauge quotas (X/Y pages, X/Y Mo).
- **Quota gauges** : `<QuotaBar used={X} max={Y} feature="storage" />` avec passage en rouge à 90 %.
- **Locked feature** : composant `<PremiumLock title="..." reason="..."/>` flouté + CTA.
- **Public badge** : pastille dorée à côté du nom partout (profil, posts, messages d'anniversaire, cagnottes).
- **Admin Plans** : table users avec filtre plan/statut, action "Override plan" (avec audit log), MRR/ARR, churn, conversion funnel.

## 7. Architecture technique

### 7.1 Tables Supabase (nouvelles)

```text
subscription_plans            -- catalogue (free, essentiel, premium) + features JSONB
user_subscriptions            -- 1 ligne active max par user_id
subscription_events           -- journal (created, upgraded, canceled, payment_failed)
subscription_invoices         -- miroir factures Stripe + paiements Wave
feature_usage_counters        -- compteurs mensuels (pages_created, ai_calls, storage_bytes)
wave_subscription_requests    -- demandes Wave en attente de validation
plan_overrides                -- override admin (gratuit promo, VIP)
```

### 7.2 Edge functions

- `create-checkout-session` (Stripe Checkout, multi-devises selon `country_code`)
- `stripe-webhook` (verifie signature, upsert subscription, trigger badge award)
- `create-wave-subscription` (génère lien + crée pending)
- `wave-subscription-confirm` (admin/cron valide paiement)
- `cancel-subscription`
- `check-feature-access` (RPC appelée par RLS pour endpoints sensibles)
- `monthly-quota-reset` (cron 1ᵉʳ du mois)
- `subscription-expiry-reminder` (cron J-3, J-1, WhatsApp)

### 7.3 RLS (extraits)

```sql
-- Pages événement : créer ssi quota OK
CREATE POLICY "Insert event_pages within plan limit"
ON event_pages FOR INSERT TO authenticated
WITH CHECK (
  public.can_create_resource(auth.uid(), 'event_page')
);

-- Album premium : voir export ssi premium
CREATE POLICY "Read premium video export"
ON event_page_exports FOR SELECT TO authenticated
USING (
  public.get_user_plan(auth.uid()) = 'premium'
  OR owner_id = auth.uid()  -- propriétaire toujours OK pour ses propres exports passés
);
```

Fonctions security definer : `get_user_plan`, `get_plan_limit(plan, feature)`, `can_create_resource(uid, feature)`, `increment_usage(uid, feature)`.

### 7.4 Frontend

```text
src/
  features/subscription/
    PricingPage.tsx
    SubscriptionDashboard.tsx
    UpgradeModal.tsx
    WaveCheckoutModal.tsx
    PremiumBadge.tsx
    QuotaBar.tsx
    FeatureGate.tsx
  hooks/
    usePlan.ts              -- plan + features
    useQuota.ts             -- conso vs limite
    useUpgrade.ts           -- launch Stripe checkout
  pages/Admin/
    SubscriptionsAdmin.tsx  -- MRR, churn, override
```

### 7.5 Sécurité

- Stripe webhook : vérif signature obligatoire, secret en `STRIPE_WEBHOOK_SECRET`.
- Jamais de `plan` writable depuis le client (RLS `UPDATE` interdit sur `user_subscriptions` côté `authenticated`, seulement `service_role`).
- Override admin → audit log obligatoire (`admin_audit_logs`).
- Gating doublé : UI (UX) + RLS/edge (sécurité). Jamais l'UI seule.

## 8. Métriques produit

- MRR, ARR, ARPU par pays
- Taux de conversion Free → Essentiel / Premium
- Churn mensuel par plan
- Top features qui déclenchent l'upgrade (event `upgrade_triggered_by`)
- Conso médiane des quotas (détecter sous/sur-tarification)

## 9. Roadmap d'implémentation (build par lots)

1. **Lot 1 — Fondations** : tables + RLS + helpers SQL + seed des 3 plans + `usePlan` + `FeatureGate`.
2. **Lot 2 — Stripe** : produits/prix multi-devises, `create-checkout-session`, webhook, dashboard abonnement, Customer Portal.
3. **Lot 3 — Wave** : flow manuel, dashboard admin de validation, relances WhatsApp.
4. **Lot 4 — Gating** : appliquer quotas sur pages événement, albums, cagnottes (commission dynamique), AI reco, stockage.
5. **Lot 5 — Premium visible** : badges publics, thèmes exclusifs, halo profil, modals émotionnelles, export PDF/vidéo souvenir.
6. **Lot 6 — Admin & analytics** : MRR/ARR, churn, override plan, audit, alertes.

## 10. Hors périmètre V1
- Plans famille / multi-sièges.
- Crédits à l'unité (one-shot) — possible V2.
- Facturation B2B vendeurs (existe déjà via `business_accounts`, séparé).

---

**Prochaine étape** : si tu valides ce plan, je passe en build mode et j'attaque **Lot 1 (fondations DB + hooks + FeatureGate)** en premier, puis on enchaîne lot par lot pour garder un contrôle propre des migrations Stripe.
