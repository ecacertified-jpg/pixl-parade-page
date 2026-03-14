

# Plan : Colonnes Échéance/Relation + KPIs anniversaires par type d'affectation

## Contexte

Le tableau des utilisateurs affectés a déjà une colonne "Anniversaire" avec la date et un badge d'échéance intégré. Il manque une colonne "Échéance" dédiée (jours restants) et une colonne "Relation" (mode d'affectation : via lien ou manuellement). Il faut aussi des KPIs anniversaires ventilés par type d'affectation.

## Problème pour les KPIs

Les données sont paginées (50/page). Pour des compteurs d'anniversaires exacts sur l'ensemble des utilisateurs, il faut compter côté serveur.

## Modifications

### 1. Edge function `admin-manage-assignments/index.ts`

Ajouter au GET (quand `admin_id` est fourni), une requête supplémentaire pour compter les anniversaires sur l'ensemble des affectations :

- Récupérer tous les `user_id` + `assigned_via` de `admin_user_assignments` pour cet admin (sans pagination)
- Joindre les `birthday` depuis `profiles`
- Calculer côté serveur les KPIs : `today`, `week` (7j), `month` (30j) — ventilés par `assigned_via` (`share_link` vs `manual`)
- Retourner un objet `birthday_stats: { via_link: { today, week, month }, manual: { today, week, month }, total: { today, week, month } }` dans la réponse

### 2. `src/pages/Admin/MyAssignments.tsx`

**Nouvelles colonnes dans le tableau :**
- "Échéance" : colonne dédiée affichant le nombre de jours restants avec badge coloré (Aujourd'hui, Demain, Xj) — extraire cette logique de la colonne Anniversaire actuelle
- "Relation" : afficher `Via lien` ou `Manuel` selon `assigned_via` avec un badge distinctif — retirer le mini-badge "Via lien de partage" de la cellule Utilisateur

**KPIs anniversaires :**
- Stocker `birthdayStats` depuis la réponse de l'edge function
- Afficher une rangée de cards/badges entre les compteurs existants et le tableau :
  - "Aujourd'hui : X (Y via lien, Z manuels)"
  - "Cette semaine : X (Y via lien, Z manuels)"
  - "Ce mois : X (Y via lien, Z manuels)"

### 3. `src/components/admin/ViewAdminAssignmentsModal.tsx`

Appliquer les mêmes colonnes (Échéance, Relation) et KPIs anniversaires dans la modale.

### Fichiers impactés

| Fichier | Changement |
|---------|-----------|
| `supabase/functions/admin-manage-assignments/index.ts` | Calcul birthday_stats côté serveur |
| `src/pages/Admin/MyAssignments.tsx` | Colonnes Échéance + Relation, KPIs anniversaires |
| `src/components/admin/ViewAdminAssignmentsModal.tsx` | Idem |

