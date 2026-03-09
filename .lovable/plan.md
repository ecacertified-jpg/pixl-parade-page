

## Analyse et Plan

### Reponse aux questions

**Les demandes d'amitie proviennent-elles d'utilisateurs avec des relations en commun ?**
Non, pas necessairement. Le systeme actuel (`contact_requests`) permet a n'importe quel utilisateur de la plateforme d'envoyer une demande via la recherche. Il n'y a pas de filtre "amis en commun" sur les demandes recues. Cependant, le systeme de suggestions (`useUserSuggestions`) utilise deja un scoring qui favorise les utilisateurs avec des amis communs (x3), meme ville (x2), et occasions similaires.

**Propositions pour renforcer l'interet des demandes d'amitie :**

1. **Afficher le nombre d'amis en commun** sur chaque demande recue — cela cree un signal de confiance et motive l'acceptation
2. **Afficher la raison/contexte** ("3 amis en commun", "Meme ville: Abidjan") directement dans le carousel
3. **Conditionner l'acces aux wishlists et cagnottes** a une relation d'amitie acceptee — c'est deja partiellement le cas via `can_see_funds` dans `contact_relationships`
4. **Notifications de rappel** pour les demandes non traitees apres X jours

### Plan d'implementation : Carousel des demandes d'amitie + amis en commun

**Composant `FriendRequestsCarousel.tsx`** (remplace la liste verticale actuelle)

- Carousel horizontal swipeable (Embla via shadcn Carousel, comme `UserSuggestionsSection`)
- Chaque carte affiche : avatar, nom, nombre d'amis en commun (calcule), boutons Accepter/Refuser
- Indicateur de pagination (dots) sous le carousel
- Animation de sortie quand une demande est traitee
- Se masque automatiquement si 0 demandes

**Hook `useFriendRequests.ts`** — enrichir les donnees

- Apres avoir recupere les demandes recues, calculer pour chaque requester le nombre d'amis en commun :
  - Recuperer les relations du user courant (`contact_relationships`)
  - Recuperer les relations de chaque requester
  - Compter l'intersection
- Ajouter `mutualFriendsCount: number` au type `FriendRequest`

**Dashboard.tsx**

- Remplacer `<FriendRequestsNotification>` par `<FriendRequestsCarousel>`

### Fichiers concernes
- Creer `src/components/FriendRequestsCarousel.tsx`
- Modifier `src/hooks/useFriendRequests.ts` (ajouter calcul amis en commun)
- Modifier `src/pages/Dashboard.tsx` (swap composant)
- Supprimer ou deprecier `src/components/FriendRequestsNotification.tsx`

