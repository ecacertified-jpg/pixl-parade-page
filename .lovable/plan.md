

## Upload de l'image birthday-friend-alert dans Storage

### Constat

1. Le bucket `assets` **n'existe pas encore** — il faut le créer (public, pour que l'URL soit accessible depuis les Edge Functions).
2. Le code dans `birthday-reminder-with-suggestions/index.ts` (ligne 343) référence `birthday-friend-alert.png` mais l'image est en **JPG**.

### Plan

#### 1. Créer le bucket `assets` (migration SQL)
```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('assets', 'assets', true);

-- Politique de lecture publique
CREATE POLICY "Public read access on assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'assets');
```

#### 2. Corriger la référence dans le code
Dans `supabase/functions/birthday-reminder-with-suggestions/index.ts` ligne 343, changer l'extension de `.png` à `.jpg` :
```
birthday-friend-alert.png → birthday-friend-alert.jpg
```

#### 3. Upload manuel de l'image
Après création du bucket, vous devrez uploader le fichier JPG via le dashboard Supabase Storage (le nommer `birthday-friend-alert.jpg`).

### Fichiers

| Ressource | Action |
|-----------|--------|
| Migration SQL | Créer bucket `assets` + politique RLS |
| `supabase/functions/birthday-reminder-with-suggestions/index.ts` | Modifier ligne 343 : `.png` → `.jpg` |

