

## Permettre aux admins d'uploader dans le bucket `assets`

### Constat

Le bucket `assets` n'a qu'une politique SELECT (lecture publique). Il manque les politiques INSERT, UPDATE et DELETE pour que les admins puissent uploader/gérer des fichiers.

### Plan

#### 1. Migration SQL — Ajouter les politiques RLS d'upload pour admins

Ajouter 3 politiques sur `storage.objects` pour le bucket `assets` :

```sql
-- INSERT : admins actifs peuvent uploader
CREATE POLICY "Admins can upload to assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'assets'
  AND EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- UPDATE : admins peuvent modifier
CREATE POLICY "Admins can update assets"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'assets'
  AND EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- DELETE : admins peuvent supprimer
CREATE POLICY "Admins can delete assets"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'assets'
  AND EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid() AND is_active = true
  )
);
```

#### 2. Créer `src/components/admin/AssetUploader.tsx`

Composant simple avec :
- Zone de drop/click pour sélectionner un fichier (images, vidéos)
- Affichage du nom de fichier et taille avant upload
- Bouton "Uploader" qui utilise `supabase.storage.from('assets').upload(fileName, file)`
- Affichage de l'URL publique après upload réussi (avec bouton copier)
- Liste des fichiers existants dans le bucket avec possibilité de supprimer

#### 3. Intégrer dans `src/pages/Admin/Settings.tsx`

Ajouter un nouvel onglet "Assets / Médias" dans les Tabs existants, contenant le composant `AssetUploader`.

### Fichiers

| Fichier | Action |
|---------|--------|
| Migration SQL | Créer — politiques INSERT/UPDATE/DELETE pour admins |
| `src/components/admin/AssetUploader.tsx` | Créer — composant d'upload et gestion |
| `src/pages/Admin/Settings.tsx` | Modifier — ajouter onglet "Assets" |

