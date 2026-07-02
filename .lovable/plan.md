
## Objectif

Chaque message "Passe à un plan supérieur" doit devenir un CTA cliquable qui ouvre la modale d'upgrade (ou `/pricing`) en conservant l'URL d'origine, pour ramener l'utilisateur exactement là où il était après paiement.

## Rappel de l'infra existante (à réutiliser, ne pas dupliquer)

- `useUpgradePrompt()` → ouvre `UpgradePromptModal`, qui construit déjà un lien vers `/pricing?from={feature}&return_to={pathname+search}`.
- `Pricing.tsx` gère déjà `return_to` : après succès `WaveCheckoutModal`, il fait `navigate(decodeURIComponent(return_to), { replace: true })`. ✅ Rien à changer côté paiement.
- Il manque juste : appeler cette infra partout où l'on affiche encore un simple toast/label statique.

## Changements

### 1. `src/pages/CreateEventPage.tsx` — quota événements
- Remplacer le `toast.error("Quota d'événements atteint...")` (ligne 59) par `upgrade.open({ feature: 'event_pages', reason: "Ton plan inclut déjà toutes tes pages actives." })`.
- Dans le bloc "Quota atteint" (ligne 105-118), remplacer le `<Link to="/pricing">Voir les plans</Link>` par un bouton qui appelle `upgrade.open({ feature: 'event_pages' })` — cohérence + `return_to` auto.
- Ajouter `const upgrade = useUpgradePrompt();`.

### 2. `src/features/subscription/FeatureGate.tsx` — carte lock générique
- Le `<Link to="/pricing">` (ligne 72) perd le contexte. Le remplacer par `to={`/pricing?return_to=${encodeURIComponent(location.pathname + location.search)}`}` via `useLocation()`.
- Si la prop `feature` (FeatureId) est fournie, ajouter aussi `from=<feature>` pour afficher la bannière contextuelle sur `/pricing`. Ajouter une prop optionnelle `featureId?: FeatureId` (non-cassante) pour le passage explicite.

### 3. `src/pages/Subscription.tsx` (lignes 82, 91) & `src/pages/Invoices.tsx` (ligne 92)
- Remplacer les `<Link to="/pricing">` par `<Link to={`/pricing?return_to=${encodeURIComponent(location.pathname)}`}>` pour un retour cohérent.

### 4. `src/features/subscription/PremiumTrialBanner.tsx` (ligne 56) & `PostEventConversionCard.tsx` (ligne 77) & `PremiumTrialUnlockModal.tsx` (ligne 106)
- Idem : ajouter `?return_to=` à partir de `useLocation()` pour ramener sur la page d'origine (banner ou page événement).

### 5. `src/components/souvenirs/SouvenirBookCard.tsx` (ligne 68 "Débloquer avec Premium")
- Le rendre CTA : `onClick` → `useUpgradePrompt().open({ feature: 'souvenirs_premium' })` (ou lien `/pricing?from=souvenirs_premium&return_to=...`).

### 6. Audit final
- Rechercher tout autre `toast.*plan` ou label statique "Passe à un plan" restant et les convertir de la même manière (`useUpgradePrompt` si dans un flux d'action, sinon Link avec `from` + `return_to`).

## Détails techniques

- Le param `return_to` est déjà lu ligne 402 de `Pricing.tsx`. Aucune modif de `Pricing` ni de `WaveCheckoutModal` nécessaire.
- Utiliser `window.location.pathname + window.location.search` (comme dans `UpgradePromptModal` ligne 84) ou `useLocation()` selon le composant.
- Ne pas ajouter `return_to` sur les Links depuis `/pricing` lui-même (éviter boucle).

## Hors scope

- Aucun changement backend, RPC ou schéma DB.
- Pas de refonte visuelle de `/pricing` ni de `UpgradePromptModal`.
