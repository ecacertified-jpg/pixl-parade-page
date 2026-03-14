

# Plan : Corriger la colonne "Relation" pour afficher le type de relation

## Problème

La colonne "Relation" affiche actuellement la méthode d'affectation ("Via lien" / "Manuel") au lieu du type de relation réel (ami, sœur, famille, etc.) comme dans l'onglet Anniversaires. C'est incohérent et trompeur.

## Modifications

### 1. `src/pages/Admin/MyAssignments.tsx` et `ViewAdminAssignmentsModal.tsx`

**Renommer et réaffecter les colonnes :**
- Renommer la colonne actuelle "Relation" → **"Source"** pour la méthode d'affectation (Via lien / Manuel)
- Ajouter une vraie colonne **"Relation"** qui affiche le type de relation (ami, sœur, famille, etc.) avec les mêmes badges colorés que l'onglet Anniversaires

**Données relationnelles :**
- Pour les utilisateurs affectés : récupérer la relation depuis `contacts` ou `contact_relationships` liés à l'admin. Si pas de relation trouvée, afficher "—"
- Utiliser le même mapping `RELATIONSHIP_LABELS` que dans `AdminBirthdaysContent.tsx` (Famille, Père, Mère, Sœur, Frère, Ami(e), Collègue, etc.)

### 2. Edge function `admin-manage-assignments/index.ts`

- Enrichir la réponse avec les données de relation : pour chaque `user_id` affecté, chercher dans `contacts` (où `user_id` = admin et `linked_user_id` = assigned user) le champ `relationship`
- Ajouter `relationship: string | null` à chaque entrée utilisateur retournée

### Fichiers impactés

| Fichier | Changement |
|---------|-----------|
| `supabase/functions/admin-manage-assignments/index.ts` | Ajouter jointure `contacts.relationship` |
| `src/pages/Admin/MyAssignments.tsx` | Colonne "Relation" = type de relation, colonne "Source" = méthode |
| `src/components/admin/ViewAdminAssignmentsModal.tsx` | Idem |

