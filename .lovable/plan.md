

## Plan: Ajouter le renommage de fichiers dans Assets

### Contexte
Supabase Storage n'a pas de fonction `rename` native. Le renommage se fait en 3 etapes : copier le fichier vers le nouveau nom, supprimer l'ancien, rafraichir la liste.

### Modification

**Fichier** : `src/components/admin/AssetUploader.tsx`

1. **Ajouter un state** pour tracker le fichier en cours de renommage (`renamingFile: string | null`) et le nouveau nom (`newName: string`)

2. **Ajouter une fonction `handleRename`** :
   - Telecharge le fichier existant via `supabase.storage.from('assets').download(oldName)`
   - Upload sous le nouveau nom via `.upload(newName, blob, { upsert: true })`
   - Supprime l'ancien via `.remove([oldName])`
   - Rafraichit la liste

3. **Ajouter un bouton Pencil (rename)** a cote du bouton Copy dans chaque ligne de fichier

4. **Mode edition inline** : quand `renamingFile === file.name`, remplacer le `<span>` du nom par un `<Input>` avec boutons Valider/Annuler

5. **Import** : ajouter `Pencil`, `Check`, `X` depuis lucide-react et `Input` depuis shadcn

### UX
- Clic sur le crayon → le nom devient editable (sans l'extension)
- L'extension est preservee automatiquement
- Enter ou bouton check valide, Escape ou X annule
- Toast de succes/erreur

