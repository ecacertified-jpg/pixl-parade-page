## 1. Cartographie des fonctionnalités par plan (vision émotionnelle JDV)

Les 3 plans (`free` / `essentiel` / `premium`) existent déjà en DB avec `limits` + `features`. Je propose de **les enrichir** pour couvrir tout le spectre émotionnel JDV et de **les lier aux usages réels** dans le code (gates).

### Plan Gratuit — "Je commence à célébrer"
Émotion : découvrir la magie sans friction.
- **Pages** : 1 page anniversaire + 1 page événement actives
- **Album photos** : 20 photos / page, vidéo de couverture **standard** (bibliothèque JDV, non personnalisable)
- **Cagnottes** : 1 cagnotte active, commission 5%
- **Invités & RSVP** : 30 invités max, RSVP simple
- **Souhaits affichés** : 50 max
- **Coulisses (Mes coulisses)** : onglets de base — Invités, Souhaits, Album
- **IA** : 5 suggestions / mois (cadeaux, messages)
- **Partage** : boutons standards
- **Branding JDV** visible (filigrane discret sur exports)

### Plan Essentiel — "Je veux préparer en grand"
Émotion : organiser sereinement un beau moment.
- **Pages** : 5 pages actives (mix anniversaire + événement)
- **Album** : 100 photos / page + **export PDF souvenir**
- **Vidéo de couverture personnalisable** (upload, trim, musique) 720p
- **Cagnottes** : 3 actives, commission 3%
- **Invités & RSVP avancé** (questions custom, +1, régime alimentaire) : 150 invités
- **Coulisses complètes** : + Plan de table, Checklist, Budget, Tâches, Prestataires, Messages urgents
- **Co-organisateurs** : 2
- **IA** : 30 suggestions / mois
- **Badge public Essentiel** + thèmes additionnels
- **Support email** sous 48 h

### Plan Premium — "Je vis ma joie sans limite"
Émotion : célébration premium, souvenirs éternels.
- **Tout illimité** : pages, cagnottes, photos, invités, souhaits, IA
- **Vidéo HD 1080p** + animations célébration premium
- **Cagnottes 0% commission**
- **Album** : export PDF + **vidéo souvenir** automatique
- **Coulisses Premium** : Capsules souvenirs, Rétrospective, Plan de table avancé, Livestream LiveKit, Assistant IA conversationnel illimité
- **Co-organisateurs** : 10
- **Thèmes émotionnels exclusifs** + **halo doré** sur profil + **badge Premium gold**
- **Sans publicité ni filigrane**, prestataires prioritaires
- **Support WhatsApp prioritaire** sous 24 h

---

## 2 & 3. Liaison fonctionnalité ↔ plan dans le code

Chaque fonctionnalité sera gardée par un `<FeatureGate>` (UI) + un check serveur quand pertinent. Tableau de correspondance (sera ajouté dans `src/features/subscription/featureCatalog.ts`) :

| Fonctionnalité | Clé limit/feature | Gratuit | Essentiel | Premium |
|---|---|---|---|---|
| Pages actives (anniv + event) | `event_pages` | 1+1 | 5 | ∞ |
| Vidéo de couverture personnalisée | `cover_video_custom` (nouveau) | ❌ standard | ✅ 720p | ✅ 1080p |
| Photos / album | `album_photos_per_page` | 20 | 100 | ∞ |
| Export album PDF | `album_export` | ❌ | ✅ pdf | ✅ pdf+vidéo |
| Cagnottes actives | `active_funds` | 1 | 3 | ∞ |
| Commission cagnotte | `fund_commission_rate` | 5% | 3% | 0% |
| Invités / page | `guests_per_page` | 30 | 150 | ∞ |
| RSVP avancé | `rsvp_advanced` | ❌ | ✅ | ✅ |
| Plan de table | `plan_de_table` (nouveau) | ❌ | ✅ | ✅ avancé |
| Checklist / Budget / Tâches / Prestataires | `expense_management` | ❌ | ✅ | ✅ |
| Co-organisateurs | `co_organizers` | 0 | 2 | 10 |
| Capsules souvenirs + Rétrospective | `souvenirs_premium` (nouveau) | ❌ | ❌ | ✅ |
| Livestream Live | `livestream` (nouveau) | ❌ | ❌ | ✅ |
| Assistant IA conversationnel | `ai_assistant` | ❌ | ❌ | ✅ |
| Suggestions IA / mois | `ai_recommendations` | 5 | 30 | ∞ |
| Thèmes premium / halo | `premium_themes`, `profile_halo` | ❌ | partiel | ✅ |
| Badge public | `public_badge` | ❌ | essentiel | premium_gold |
| Sans pub / filigrane | `ad_free` | ❌ | partiel | ✅ |
| Support prioritaire | `priority_support` | communauté | email 48 h | WA 24 h |

### Vérification (point 3)
- Une **migration** ajoute les nouvelles clés (`cover_video_custom`, `plan_de_table`, `souvenirs_premium`, `livestream`) aux 3 lignes `subscription_plans`.
- Le fichier `featureCatalog.ts` exporte un dictionnaire `FEATURE_CATALOG: Record<FeatureId, { label, requires: PlanTier, kind: 'limit'|'flag' }>` — source unique de vérité.
- Un **test léger** (`featureCatalog.test.ts`) garantit que chaque entrée du catalogue a bien une valeur dans les 3 plans en DB (audit au montage en dev via `usePlan`).
- Audit code : grep des appels existants (`Souvenirs.tsx`, `CreateEventPage.tsx`, `SouvenirBookCard.tsx`, etc.) pour remplacer les redirections manuelles `navigate('/pricing')` par `<FeatureGate>` ou `useUpgradePrompt()`.

---

## 4. UX upgrade : quotas atteints / fonctionnalité verrouillée

Deux composants centralisés, esprit doux et émotionnel (pas agressif) :

### a) `<UpgradePromptModal>` (nouveau)
Modale légère ouverte par `useUpgradePrompt({ feature, requires })`. Contenu :
- Titre émotionnel contextuel : *"Tu mérites d'aller plus loin 💛"*
- 1 phrase qui décrit ce que le plan supérieur débloque pour CETTE feature
- Mini-comparatif **2 colonnes** (plan actuel vs plan recommandé) — pas les 3 plans
- CTA principal : **"Découvrir le plan {Essentiel|Premium}"** → `/pricing?from={feature}`
- Lien discret : *"Plus tard"*
- Si trial Premium offert disponible et inutilisé : badge *"Ou utilise ton événement Premium offert"*

### b) `<QuotaReachedToast>` 
Pour les compteurs (cagnottes, pages, photos, invités) : toast non bloquant *"Tu as atteint X/Y. Passe Essentiel pour ajouter sans limite ✨"* avec bouton *"Voir"* qui ouvre la modale ci-dessus.

### c) `<FeatureGate>` (déjà existant)
Reste en place pour les zones entières (sections de page). Restera l'overlay floutée premium.

Choix d'affichage automatique selon contexte :
- **Clic sur action bloquée** → modale
- **Saisie qui dépasse un quota** → toast
- **Section entière non accessible** → overlay FeatureGate

---

## 5. Page Pricing — accès discret + badge expiration

### Accès discret (philosophie émotionnelle)
- **Ne pas afficher** "Pricing" dans la nav principale.
- Présent uniquement :
  - Dans le **menu profil** (item discret "Mes plans")
  - Dans la page `/subscription` (bouton "Changer de plan")
  - Au **moment du besoin** via `UpgradePromptModal`
  - Footer (lien texte)
- `/pricing` reste public et SEO-indexé (catch crawlers).

### Badge d'expiration (rouge)
- Composant `<PlanExpiredBadge>` rouge "Plan expiré" affiché en haut des pages d'événement & anniversaire **uniquement pour le propriétaire** quand :
  - `subscription.plan_tier ≠ 'free'` ET `status ∈ ('expired','past_due')` OU `current_period_end < now()`
  - OU `cancel_at_period_end=true` ET `current_period_end < now()`
- Tap → ouvre directement `WaveCheckoutModal` pour renouveler (même plan).
- Variante orange "Expire dans X jours" (J-3 / J-1) déjà couverte par `wave-subscription-expiry-reminder` côté WhatsApp ; on ajoute la version UI.
- Badge visible UNIQUEMENT au propriétaire (pas aux visiteurs) — préserve la dimension émotionnelle de la page pour les invités.

---

## 6. Onglet Admin "Confirmation paiements mobiles"

Le code existe déjà (`WaveSubscriptionsAdmin.tsx`, route `/admin/abonnements-wave`, edge functions `confirm-wave-subscription` + `reject-wave-subscription`) mais **n'est pas lié depuis le dashboard admin**.

Actions :
- **Ajouter une carte / lien** "💳 Paiements Wave abonnements" dans `AdminDashboard.tsx` (section Financier) avec compteur de demandes pending en temps réel (already exposed by `useWaveRequests('pending')`).
- **Renommer l'onglet** dans la page : "Confirmation paiements mobiles" (plus parlant que "Abonnements Wave"), avec sous-titre *"Valide les paiements Wave Essentiel / Premium reçus des utilisateurs"*.
- **Ajouter une bannière de notification admin** quand une nouvelle demande arrive (canal realtime `wave_subscription_requests` INSERT).
- Conserver les 4 tabs : En attente / Confirmées / Rejetées / Expirées.
- Bonus UX : afficher dans la carte demande le **lien Wave attendu** (montant + devise) pour faciliter le rapprochement bancaire.

---

## Récapitulatif technique des changements

### Migrations
- Ajouter clés `cover_video_custom`, `plan_de_table`, `souvenirs_premium`, `livestream` dans `subscription_plans.limits`/`features` pour les 3 tiers.

### Fichiers à créer
- `src/features/subscription/featureCatalog.ts` — source unique fonctionnalités/plans
- `src/features/subscription/UpgradePromptModal.tsx` + `useUpgradePrompt.ts`
- `src/features/subscription/PlanExpiredBadge.tsx`
- `src/features/subscription/QuotaReachedToast.ts` (helper)

### Fichiers à modifier
- `src/features/subscription/types.ts` — étendre `FeatureFlag` / `FeatureKey`
- `src/features/subscription/usePlan.ts` — helpers `requireFeature(feature)` + `isExpired`
- `src/pages/BirthdayPage.tsx`, `src/pages/EventPage.tsx` — afficher `<PlanExpiredBadge>` (propriétaire only) + brancher les actions verrouillées sur `useUpgradePrompt`
- `src/pages/Pricing.tsx` — accepter `?from=feature` pour contextualiser le hero
- `src/pages/Admin/AdminDashboard.tsx` — ajouter carte "Paiements Wave" avec badge pending
- `src/pages/Admin/WaveSubscriptionsAdmin.tsx` — renommer header, ajouter realtime + bannière nouvelle demande
- Composants existants qui font `navigate('/pricing')` brut (Souvenirs, CreateEventPage, SouvenirBookCard, etc.) → passer par `useUpgradePrompt` pour cohérence
- Retirer "Pricing" éventuel des navs principales, l'ajouter au menu profil + footer
