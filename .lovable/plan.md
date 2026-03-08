

## Plan: Filtre par type de fichier dans Assets

### Modification

**Fichier** : `src/components/admin/AssetUploader.tsx`

1. **State** : Ajouter `fileFilter: 'all' | 'images' | 'videos' | 'others'` (defaut `'all'`)

2. **Filtrage** : Creer une variable `filteredFiles` derivee de `files` qui filtre selon le mimetype :
   - `images` → `mimetype.startsWith('image/')`
   - `videos` → `mimetype.startsWith('video/')`
   - `others` → ni image ni video

3. **UI** : Ajouter un groupe de `Tabs` (shadcn) au-dessus de la liste des fichiers avec 4 onglets : Tous, Images, Videos, Autres — avec un compteur entre parentheses pour chaque type

4. **Rendu** : Remplacer `files.map(...)` par `filteredFiles.map(...)`

### Imports a ajouter
- `Tabs, TabsList, TabsTrigger` depuis `@/components/ui/tabs`

