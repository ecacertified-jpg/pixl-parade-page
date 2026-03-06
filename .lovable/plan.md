

# Affichage détaillé des affectations d'un admin (vue Super Admin)

## Problème actuel

Le `ViewAdminAssignmentsModal` affiche uniquement les tableaux d'utilisateurs et entreprises assignés, sans le lien de partage ni les statistiques. Le Super Admin ne voit pas la même richesse d'information que ce que l'admin voit sur sa propre page "Mes affectations" (screenshot).

## Solution

Enrichir `ViewAdminAssignmentsModal` pour inclure :
1. **Le lien de partage de l'admin consulté** avec ses stats (clics, inscriptions, affectations)
2. **Les onglets Utilisateurs / Entreprises** avec les memes colonnes et badges "Via lien de partage"

## Modifications

### 1. `ViewAdminAssignmentsModal.tsx`

- Ajouter un fetch des `admin_share_codes` de l'admin consulté (via query directe avec `admin_user_id`)
- Afficher une section "Lien de partage" en haut du modal avec :
  - L'URL du lien actif (`joiedevivre-africa.com/join/{code}`)
  - Les stats agrégées (clics, inscriptions, affectations)
- Ajouter le badge "Via lien de partage" sur les assignments (le champ `assigned_via` est déjà renvoyé par l'edge function)
- Le tout en lecture seule (pas de bouton Partager/Régénérer)

### 2. Aucune modification backend nécessaire

Les `admin_share_codes` sont déjà accessibles aux admins via RLS. Les stats sont des colonnes directes de la table.

## Fichiers modifiés

| Fichier | Modification |
|---------|-------------|
| `src/components/admin/ViewAdminAssignmentsModal.tsx` | Ajouter section lien de partage + stats + badges "Via lien de partage" |

