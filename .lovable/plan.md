

# Plan : Numérotation des pages, compteurs et filtres de complétion de profil

## Contexte

La pagination actuelle n'affiche que "Précédent/Suivant". Il manque des numéros de pages cliquables, un affichage clair du total d'utilisateurs via lien vs affectés, et des filtres par taux de complétion de profil.

## Modifications

### 1. `src/pages/Admin/MyAssignments.tsx`

**Numérotation des pages :**
- Remplacer les boutons Précédent/Suivant par une barre de pagination complète avec numéros de pages cliquables (1, 2, 3... avec ellipsis si > 7 pages)
- Utiliser les composants `Pagination*` de `src/components/ui/pagination.tsx` déjà existants

**Compteurs dans le header :**
- Afficher sous le titre "Mes utilisateurs" deux badges : "X inscrits via lien" (comptés depuis `assigned_via === 'share_link'` dans `aggregatedStats.total_signups` du hook `useAdminShareCode`) et "Y affectés" (= `totalUsers` de la pagination)
- Importer `useAdminShareCode` pour accéder aux stats agrégées

**Filtre par complétion de profil :**
- Ajouter un state `completionFilter: number | null` (null = tous, sinon 15, 30, 45, 60, 75, 100)
- Ajouter une rangée de boutons/badges cliquables au-dessus du tableau : "Tous", "15%", "30%", "45%", "60%", "75%", "100%"
- Filtrer côté client `sortedUserAssignments` selon le pourcentage de complétion (filtre exact : afficher ceux dont le % === valeur sélectionnée)
- Note : le filtrage est côté client car on a déjà les profils chargés par page

### 2. `src/components/admin/ViewAdminAssignmentsModal.tsx`

- Appliquer la même numérotation de pages cliquable
- Appliquer le même filtre par complétion de profil
- Afficher les compteurs "inscrits via lien" vs "affectés" dans la section stats existante

### Fichiers impactés

| Fichier | Changement |
|---------|-----------|
| `src/pages/Admin/MyAssignments.tsx` | Pagination numérotée, compteurs, filtre complétion |
| `src/components/admin/ViewAdminAssignmentsModal.tsx` | Idem pagination + filtre |

