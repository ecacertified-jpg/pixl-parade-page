
# Ajouter un badge "Via lien de partage" dans Mes Affectations

## Contexte

Les tables `admin_user_assignments` et `admin_business_assignments` n'ont pas de colonne pour distinguer les affectations manuelles des affectations automatiques via lien de partage. Il faut ajouter cette information a la source, puis l'afficher dans l'interface.

## Modifications

### 1. Migration SQL : ajouter une colonne `assigned_via`

Ajouter une colonne `assigned_via TEXT DEFAULT 'manual'` aux deux tables :
- `admin_user_assignments`
- `admin_business_assignments`

Valeurs possibles : `'manual'` (defaut, pour les affectations existantes et futures manuelles) et `'share_link'` (pour les auto-affectations via lien de partage).

### 2. Edge Function `admin-auto-assign/index.ts`

Modifier les deux `INSERT` (lignes 95-99 et 115-119) pour ajouter `assigned_via: 'share_link'` dans les donnees inserees.

### 3. Edge Function `admin-manage-assignments/index.ts`

Modifier les requetes SELECT du GET (lignes 187 et 191) pour inclure `assigned_via` dans les champs retournes :
- `select('id, user_id, created_at, assigned_via')` 
- `select('id, business_account_id, created_at, assigned_via')`

### 4. Frontend `src/pages/Admin/MyAssignments.tsx`

- Ajouter `assigned_via?: string` aux interfaces `UserAssignment` et `BusinessAssignment`
- Apres le nom de l'utilisateur (ligne ~241) et le nom de l'entreprise (ligne ~349), ajouter conditionnellement :

```text
{a.assigned_via === 'share_link' && (
  <Badge className="bg-blue-500/15 text-blue-700 border-blue-200 text-[10px] px-1.5 py-0 h-4">
    Via lien de partage
  </Badge>
)}
```

Le badge apparaitra en bleu, compact, juste a cote du nom, uniquement pour les affectations faites via un lien de partage.

## Fichiers modifies

1. **Nouvelle migration SQL** : ajout colonne `assigned_via` aux deux tables
2. **`supabase/functions/admin-auto-assign/index.ts`** : ajout `assigned_via: 'share_link'` dans les INSERT
3. **`supabase/functions/admin-manage-assignments/index.ts`** : ajout `assigned_via` dans les SELECT
4. **`src/pages/Admin/MyAssignments.tsx`** : interfaces + affichage conditionnel du badge
