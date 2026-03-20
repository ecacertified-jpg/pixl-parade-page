

# Plan : Transition vers la wishlist après 3 amis + amélioration du bouton de partage

## 1. Scroll automatique vers la wishlist après complétion du cercle (`FriendsCircleReminderCard.tsx`)

Dans le `useEffect` qui détecte la complétion (ligne 63-81), après le confetti et le `setTimeout` de 3s, ajouter un scroll fluide vers la section wishlist :

- Utiliser `document.querySelector` pour trouver la section `FavoriteArticlesSection` (ajouter un `id="wishlist-section"` dans `FavoriteArticlesSection.tsx`)
- Après le délai de célébration (3s), appeler `scrollIntoView({ behavior: 'smooth', block: 'center' })` pour amener l'utilisateur à sa liste de souhaits

**Fichiers :**
- `src/components/FriendsCircleReminderCard.tsx` — ajouter scroll après celebration timeout
- `src/components/FavoriteArticlesSection.tsx` — ajouter `id="wishlist-section"` au conteneur racine

## 2. Améliorer l'affichage du bouton "Envoyer à un proche" (`AddFriendModal.tsx`)

Le bouton est trop long et le texte déborde sur mobile. Corrections :

- Réduire le texte du bouton : utiliser `text-xs` au lieu de `text-sm`, et raccourcir légèrement en wrap
- Ajouter `whitespace-nowrap` ou réduire le padding pour que le bouton tienne sur une ligne
- Ajuster la hauteur `h-10` au lieu de `h-11` et le `p-3` au lieu de `p-4` sur le conteneur pour un affichage plus compact

**Fichier :** `src/components/AddFriendModal.tsx`

