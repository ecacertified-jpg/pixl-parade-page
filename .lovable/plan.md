

## Correction du pop-up "Bravo ! Votre cercle est prêt"

### Probleme

Le pop-up de celebration se re-affiche a chaque chargement de page car :
- `prevContactsCount` demarre a `0` (etat initial du hook avant le fetch)
- Quand le fetch termine, `contactsCount` passe de `0` a `2` (ou plus)
- La condition `prevContactsCount < 2 && contactsCount >= 2` est satisfaite a chaque fois

### Solution

Modifier `FriendsCircleReminderCard.tsx` pour :

1. **Ignorer la transition initiale** : Ne pas declencher la celebration quand `contactsCount` passe de `0` (etat initial) a sa vraie valeur apres le chargement
2. **Persister l'etat de celebration** : Utiliser `localStorage` pour enregistrer que la celebration a deja ete montree, et ne plus jamais la re-afficher

### Detail technique

Dans `src/components/FriendsCircleReminderCard.tsx` :

- Ajouter une cle localStorage `friends_circle_celebrated_{userId}` pour marquer que la celebration a ete vue
- Ajouter un flag `hasInitiallyLoaded` (ref) pour ignorer le premier changement de `contactsCount` (qui vient du fetch initial, pas d'une action utilisateur)
- La celebration ne se declenche que si :
  1. Le composant a deja fini son chargement initial (`hasInitiallyLoaded === true`)
  2. `contactsCount` passe de `< 2` a `>= 2` via une action utilisateur (ajout d'ami)
  3. La celebration n'a pas deja ete marquee dans localStorage

### Fichier a modifier

| Fichier | Modification |
|---------|-------------|
| `src/components/FriendsCircleReminderCard.tsx` | Ajouter un ref `hasInitiallyLoaded`, un check localStorage pour eviter les re-celebrations, et ne declencher la celebration que sur des changements reels post-chargement |

