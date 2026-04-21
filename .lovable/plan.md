

## Diagnostic

### Problème 1 — Bouton "Ouvrir le dashboard" → 404

Le template WhatsApp `joiedevivre_admin_fund_created` envoie l'admin vers `/admin/funds/<fund_id>` (cf. `notify-admins-fund-created/index.ts:183`), mais **cette route n'existe pas** dans `App.tsx`. Les seules routes "funds" admin sont :
- `/admin/countries/:code/funds` (liste par pays)
- Aucune fiche cagnotte unitaire `/admin/funds/:id`

D'où le 404 affiché dans WhatsApp après clic.

### Problème 2 — Visibilité onboarding utilisateurs

État actuel : la table `profiles` stocke `onboarding_completed` (bool) + `onboarding_furthest_step` (0–6), mais :
- **38 utilisateurs sont bloqués** (DB) : 23 à l'étape 2 (Goûts), 13 à l'étape 1 (Anniv), 2 ailleurs.
- Aucune page admin ne montre **où** chaque utilisateur s'est arrêté ni **quels champs** lui manquent.
- `ProfileCompletionDashboard` existe mais n'analyse que la complétion du **profil** (avatar, bio, ville…), pas la **progression onboarding** (anniv → goûts → souhaits → amis → page → partages).

## Plan

### Correctif 1 — Créer la fiche cagnotte admin `/admin/funds/:fundId`

**Nouvelle route** dans `App.tsx` : `/admin/funds/:fundId` → nouveau composant `AdminFundDetail`.

**Nouvelle page** `src/pages/Admin/AdminFundDetail.tsx` :
- Charge `collective_funds` + créateur (profil) + bénéficiaire (contact) + contributions (`fund_contributions` joint à profils contributeurs) + business associé si applicable.
- Affiche : titre, occasion, montants (objectif / collecté / restant), barre de progression, deadline, statut, créateur (nom + pays + tel), bénéficiaire, message surprise, share_token, liste des contributeurs avec montants/dates/messages.
- Actions admin (selon permissions) : voir page publique `/f/:share_token`, marquer note interne, contacter créateur (WhatsApp), historique notifications envoyées (`whatsapp_template_logs` filtré sur fund_id).
- Filtrage régional : un regional_admin ne voit que les funds de ses pays affectés (réutilise `useAdmin().canAccessCountry`). Sinon redirect vers `/admin/countries`.

**Aucune migration nécessaire** : tout existe déjà côté DB.

**Bonus** : ajouter dans `CountryFundsPage` un lien `Voir la fiche` qui navigue vers `/admin/funds/:id` (cohérence UX).

### Correctif 2 — Tableau de bord "Progression Onboarding" `/admin/onboarding`

**Nouvelle entrée sidebar** (`AdminLayout.tsx`, juste sous "Complétion Profils") : `Onboarding` (icône `ListChecks`).

**Nouvelle page** `src/pages/Admin/OnboardingProgressDashboard.tsx` :

**KPIs en haut** (cartes) :
- Total utilisateurs / Onboarding terminé / En cours / Abandonnés (>7j sans progression)
- Taux de complétion global + par étape (entonnoir)

**Entonnoir 6 étapes** (visualisation) :
```text
Étape 1 Anniv     ████████████████ 1042
Étape 2 Goûts     ███████████████  1019
Étape 3 Souhaits  ██████████████   980
Étape 4 Amis      ████████████     850
Étape 5 Page      ███████████      810
Étape 6 Partages  ██████████       760  → terminés
```
Chaque barre cliquable → filtre la liste sur les utilisateurs bloqués à cette étape.

**Tableau utilisateurs** :
- Colonnes : Nom complet, Téléphone, Email, Ville, Pays, Date inscription, **Étape atteinte** (badge), **Étape bloquante** (badge rouge), Dernière activité, Actions.
- Calcul de l'étape réelle via la même logique que `useOnboarding.fetchOnboardingStatus` (côté hook React Query) ou via une nouvelle Edge function `admin-onboarding-progress` qui fait l'agrégation côté serveur (plus rapide pour 1000+ users).
- Filtres : étape bloquante (1–6), pays, période d'inscription, recherche nom/tel/email.
- Actions par ligne : 
  - **Relancer** (envoie un WhatsApp template `joiedevivre_onboarding_reminder` — à créer côté Meta plus tard, en attendant utilise `joiedevivre_join_reminder`)
  - **Voir profil** → `/admin/users` filtré
  - **Affecter à un admin** (réutilise modal existant)
- Export CSV pour relances marketing offline.

**Filtrage régional** : regional_admins voient uniquement leurs pays affectés (utilise `getAccessibleCountries`).

**Optimisation** : nouvelle Edge function `admin-onboarding-progress` (GET, JWT super_admin/regional) qui :
1. Charge tous les profils (filtrés par pays si regional)
2. Pour chaque user, calcule le statut onboarding en batch (1 requête par table : favorites, friend_circles, birthday_pages, funds, shares)
3. Retourne `{ users: [...], stats: { byStep: {...}, total, completed } }`
4. Cache 5 min côté React Query.

**Petit fix DB** (migration légère) : arrêter de réinitialiser `onboarding_furthest_step` à 0 quand `onboarding_completed=true`. Conserver la valeur `6` pour pouvoir faire des stats historiques. Backfill : `UPDATE profiles SET onboarding_furthest_step = 6 WHERE onboarding_completed = true AND onboarding_furthest_step = 0;`

### Mémoires à mettre à jour

- `mem://auth/onboarding-experience-and-logic` : ajouter section "Visibilité admin" → page `/admin/onboarding` avec entonnoir + relances ciblées.
- Nouvelle entrée `mem://admin/fund-detail-page` : décrire `/admin/funds/:fundId` comme cible de notification template + composant Edge fund detail.

## Résultat attendu

1. ✅ Le bouton WhatsApp "Ouvrir le dashboard" ouvre la fiche détaillée de la cagnotte concernée (plus de 404).
2. ✅ Les admins disposent d'un tableau de bord clair montrant **où** chaque utilisateur est bloqué dans l'onboarding, avec actions ciblées (relance, affectation, contact direct) pour pousser à la finalisation.

