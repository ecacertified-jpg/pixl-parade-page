

# Plan : Pagination côté serveur pour les affectations utilisateurs

## Problème

L'edge function `admin-manage-assignments` charge tous les profils en une seule requête `.in('user_id', userIds)`. Avec 394+ utilisateurs, cela dépasse les limites de taille d'URL/payload et cause des timeouts ou données manquantes.

## Modifications

### 1. Edge function `supabase/functions/admin-manage-assignments/index.ts`

Ajouter des paramètres de pagination au GET quand `admin_id` est fourni (pas pour `all_assignments`) :

- `page` (défaut: 1), `page_size` (défaut: 50, max: 100)
- Paginer `admin_user_assignments` avec `.range(offset, offset + pageSize - 1)` et `{ count: 'exact' }`
- Paginer la requête profiles en conséquence (seulement les user_ids de la page courante)
- Retourner `{ user_assignments, business_assignments, total_users, page, page_size }` — les entreprises restent non paginées (volume faible)

### 2. Frontend `src/pages/Admin/MyAssignments.tsx`

- Ajouter state `userPage` (défaut 1) et `totalUsers`
- Modifier `loadAssignments` pour passer `&page=${userPage}&page_size=50`
- Ajouter des contrôles de pagination (Précédent/Suivant) sous le tableau utilisateurs
- Mettre à jour le compteur de l'onglet pour afficher `totalUsers` au lieu de `userAssignments.length`
- Recharger quand `userPage` change via `useEffect`

### 3. `src/components/admin/ViewAdminAssignmentsModal.tsx`

Appliquer la même logique de pagination pour la modale de visualisation des affectations d'un autre admin.

### Fichiers impactés

| Fichier | Changement |
|---------|-----------|
| `supabase/functions/admin-manage-assignments/index.ts` | Ajouter pagination au GET (page, page_size, count) |
| `src/pages/Admin/MyAssignments.tsx` | State pagination, contrôles Précédent/Suivant, rechargement par page |
| `src/components/admin/ViewAdminAssignmentsModal.tsx` | Même pagination pour la modale |

