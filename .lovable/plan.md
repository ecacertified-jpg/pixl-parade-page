

# Plan : Retry automatique et indicateur de chargement amélioré pour les affectations

## Modifications

### 1. `src/pages/Admin/MyAssignments.tsx`

- Ajouter un state `error` (boolean) et `retryCount` (number, max 3)
- Dans `loadAssignments` : en cas d'erreur, incrémenter `retryCount` et relancer automatiquement après un délai exponentiel (`1s, 2s, 4s`) tant que `retryCount < 3`
- Après 3 échecs : afficher un état d'erreur explicite (icône AlertTriangle, message, bouton "Réessayer") à la place du spinner
- Remplacer le spinner basique par un indicateur plus informatif avec texte "Chargement des affectations..." et une barre de progression indéterminée
- Réinitialiser `error` et `retryCount` lors d'un retry manuel

### 2. `src/components/admin/ViewAdminAssignmentsModal.tsx`

- Même logique de retry automatique (3 tentatives avec backoff exponentiel)
- Même état d'erreur explicite avec bouton "Réessayer" dans la modale
- Même indicateur de chargement amélioré

### Fichiers impactés

| Fichier | Changement |
|---------|-----------|
| `src/pages/Admin/MyAssignments.tsx` | Retry auto (3x backoff), état d'erreur visuel, loader amélioré |
| `src/components/admin/ViewAdminAssignmentsModal.tsx` | Idem |

