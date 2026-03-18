

# Plan : Corriger la preuve sociale sur la landing page

## Problème

La table `contacts` a des politiques RLS qui limitent l'accès aux contacts de l'utilisateur authentifié. Les visiteurs non connectés (landing page) ne peuvent pas compter les lignes → le compteur reste invisible.

## Solution

1. **Créer une fonction SQL `security definer`** qui retourne le count total des contacts, accessible sans authentification :

```sql
CREATE OR REPLACE FUNCTION public.get_birthday_count()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)::integer FROM contacts;
$$;
```

2. **Modifier `Landing.tsx`** — remplacer la requête `.from('contacts').select(...)` par un appel RPC :

```typescript
const { data } = await supabase.rpc('get_birthday_count');
if (data !== null) setBirthdayCount(data);
```

## Fichiers modifiés
- Nouvelle migration SQL (1 fonction)
- `src/pages/Landing.tsx` (1 ligne de requête modifiée)

