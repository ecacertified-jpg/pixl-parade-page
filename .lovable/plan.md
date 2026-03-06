

# Ajouter un bouton "Voir les affectations" visible dans la liste des admins

## Problème

Actuellement, "Voir les affectations" est caché dans le menu déroulant (⋮) des actions. Il faut le rendre plus visible directement dans le tableau et les cartes mobiles.

## Solution

Ajouter un **bouton explicite** "Voir les affectations" à côté du menu d'actions existant, visible dans :
- **Desktop (tableau)** : un bouton `outline` avec icône `ClipboardList` dans la colonne Actions, avant le menu ⋮
- **Mobile (cartes)** : un bouton compact en bas de chaque carte admin

Le bouton restera aussi dans le dropdown pour la cohérence.

## Fichier modifié

| Fichier | Modification |
|---------|-------------|
| `src/pages/Admin/AdminManagement.tsx` | Ajouter un `Button` visible dans la cellule Actions (desktop) et dans les cartes (mobile) qui ouvre le `ViewAdminAssignmentsModal` |

### Détails

**Desktop** (ligne ~401, colonne Actions) : ajouter avant `renderAdminActions(admin)` :
```tsx
<Button variant="outline" size="sm" onClick={() => { setSelectedAdminId(admin.id); setSelectedAdminName(getDisplayName(admin)); setViewAssignmentsOpen(true); }}>
  <ClipboardList className="h-3.5 w-3.5 mr-1.5" />
  Affectations
</Button>
```

**Mobile** (cartes, vers ligne ~305) : ajouter un bouton similaire en bas de chaque carte, avant la date.

