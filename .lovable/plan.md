

# Plan : Cagnotte réelle via modal + persistance de la route utilisateur

## Problème 1 — La cagnotte est "créée" sans vraiment l'être

Actuellement, le bouton "Créer" à l'étape 6 appelle `handleCreateFund` qui insère directement une cagnotte générique (titre par défaut, target_amount 50000) sans demander à l'utilisateur de choisir un article de sa wishlist. La vraie création de cagnotte passe par le modal `WishlistFundPickerModal` qui affiche les favoris et lance le flow panier/checkout.

### Solution

1. **Dans `OnboardingExperience.tsx`** :
   - Ajouter un état `showFundPickerModal` (boolean)
   - Le bouton "Créer" de la sous-étape 2 ouvre le `WishlistFundPickerModal` au lieu d'appeler `handleCreateFund`
   - Supprimer la fonction `handleCreateFund` actuelle (insertion directe)
   - Quand le modal se ferme, re-vérifier en DB si une cagnotte active existe (`collective_funds` avec `occasion: 'birthday'`). Si oui → `setHasFund(true)`
   - Importer `WishlistFundPickerModal` et le rendre dans le JSX

2. **Modifier `WishlistFundPickerModal`** :
   - Ajouter un prop optionnel `onFundCreated?: () => void`
   - Appeler ce callback après `addItem` + `onClose`, pour que l'onboarding puisse rafraîchir l'état

3. **Polling de la cagnotte** : Après fermeture du modal, ajouter un polling léger (toutes les 5s, max 60s) qui vérifie si une cagnotte `birthday` active existe pour le user. Dès qu'elle est détectée → `setHasFund(true)`. Ceci couvre le cas où l'utilisateur revient du checkout après avoir finalisé la cagnotte.

## Problème 2 — L'utilisateur ne retrouve pas sa position après déconnexion/fermeture

Le système `returnUrl` dans `ProtectedRoute` ne sauvegarde la route que lors d'une déconnexion forcée (user non authentifié tentant d'accéder à une route protégée). Si l'utilisateur ferme simplement l'app, rien n'est sauvegardé.

### Solution

1. **Sauvegarder la route courante en continu** dans `ProtectedRoute.tsx` :
   - À chaque changement de `location.pathname + location.search`, écrire dans `localStorage` : `last_visited_route`
   - Exclure les routes triviales (`/`, `/auth`)

2. **Restaurer la route au login** dans `Auth.tsx` :
   - Après les checks `returnUrl` et `redirectParam`, avant le `handleSmartRedirect`, vérifier `localStorage.getItem('last_visited_route')`
   - Si présent, naviguer vers cette route et la supprimer du storage
   - Cela couvre le cas "fermeture d'app + retour"

## Fichiers concernés

| Fichier | Action |
|---------|--------|
| `src/components/OnboardingExperience.tsx` | Ouvrir le modal wishlist au lieu de créer directement, ajouter polling cagnotte |
| `src/components/WishlistFundPickerModal.tsx` | Ajouter prop `onFundCreated` callback |
| `src/components/ProtectedRoute.tsx` | Sauvegarder `last_visited_route` en continu |
| `src/pages/Auth.tsx` | Restaurer `last_visited_route` au login si pas d'autre redirect |

