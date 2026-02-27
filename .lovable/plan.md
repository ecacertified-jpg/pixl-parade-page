

## Ajouter un indicateur visuel de wishlist active sur le badge "Sur l'app"

### Objectif

Afficher un petit point colore (dot) a cote du badge "Sur l'app" lorsque le contact lie possede au moins un article dans sa liste de souhaits. Cela permet a l'utilisateur de savoir d'un coup d'oeil quels contacts ont des idees cadeaux disponibles.

### Approche technique

**1. Charger les IDs des contacts avec wishlist active**

Dans `loadFriendsFromSupabase()`, apres avoir recupere les contacts, faire une requete supplementaire pour les contacts lies :

```ts
// Recuperer les linked_user_ids
const linkedUserIds = contacts
  .filter(c => c.linked_user_id)
  .map(c => c.linked_user_id!);

if (linkedUserIds.length > 0) {
  const { data: wishlistData } = await supabase
    .from('user_favorites')
    .select('user_id')
    .in('user_id', linkedUserIds);

  const usersWithWishlist = new Set(
    wishlistData?.map(w => w.user_id) || []
  );
  // Stocker dans un nouveau state
  setFriendsWithWishlist(usersWithWishlist);
}
```

**2. Nouveau state**

Ajouter un `useState<Set<string>>` pour stocker les IDs des utilisateurs ayant une wishlist :

```ts
const [friendsWithWishlist, setFriendsWithWishlist] = useState<Set<string>>(new Set());
```

**3. Indicateur visuel sur le badge**

Ajouter un petit point anime (pulse) en position relative a droite du texte "Sur l'app" quand `friendsWithWishlist.has(friend.linked_user_id)` :

```text
[CheckCircle] Sur l'app [point violet pulsant]
```

Le point utilisera les classes :
- `w-1.5 h-1.5 rounded-full bg-celebration animate-pulse` pour un petit cercle violet avec animation douce
- Le tooltip sera enrichi : "Voir les souhaits de {nom}" devient "{nom} a des souhaits !" quand la wishlist est active

### Rendu visuel

- **Contact lie AVEC wishlist** : badge vert + petit point violet pulsant + tooltip "{nom} a des souhaits !"
- **Contact lie SANS wishlist** : badge vert normal (inchange) + tooltip "Voir les souhaits de {nom}"

### Fichiers modifies

| Fichier | Modification |
|---------|-------------|
| `src/pages/Dashboard.tsx` | Ajout du state `friendsWithWishlist`, requete supplementaire dans `loadFriendsFromSupabase`, point anime conditionnel sur le badge |

