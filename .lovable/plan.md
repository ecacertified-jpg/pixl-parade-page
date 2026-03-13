

# Plan : Onglet "Anniversaires" dans Mes affectations

## Objectif

Ajouter un troisième onglet "Anniversaires" dans la page Mes affectations, réutilisant le contenu de la page `AdminBirthdays` (KPI cards, filtres par période/mois, tableau des résultats avec détails).

## Modifications

### 1. Extraire le contenu de `AdminBirthdays` dans un composant réutilisable

Créer `src/components/admin/AdminBirthdaysContent.tsx` qui contient tout le JSX actuel de `AdminBirthdays.tsx` **sans** le wrapper `AdminLayout`. Ce composant autonome inclut :
- Les KPI cards (Aujourd'hui, Cette semaine, Ce mois)
- Les filtres par période et par mois
- Le tableau des résultats avec le `BirthdayDetailSheet`

### 2. Modifier `AdminBirthdays.tsx`

Simplifier pour importer et rendre `AdminBirthdaysContent` dans `AdminLayout`.

### 3. Modifier `MyAssignments.tsx`

- Ajouter un 3e `TabsTrigger` "Anniversaires" avec l'icône `Cake`
- Ajouter un `TabsContent` qui rend `AdminBirthdaysContent`

### Fichiers impactés

| Fichier | Changement |
|---------|-----------|
| `src/components/admin/AdminBirthdaysContent.tsx` | Nouveau — contenu extrait de AdminBirthdays |
| `src/pages/Admin/AdminBirthdays.tsx` | Simplifié — utilise AdminBirthdaysContent |
| `src/pages/Admin/MyAssignments.tsx` | Ajout onglet "Anniversaires" |

