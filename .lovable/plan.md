

# Plan : Corriger le renommage de fichiers dans Assets

## Problème identifié

La fonction `handleRename` utilise un cycle **download → upload → delete** pour renommer les fichiers. Pour un fichier de 28.9 MB comme `landing-video.mp4`, cela échoue silencieusement (timeout ou erreur réseau sans feedback). De plus, si le nom n'a pas changé, la fonction appelle `cancelRename()` sans aucun retour visuel.

## Solution

### `src/components/admin/AssetUploader.tsx`

1. **Remplacer download+upload+delete par `supabase.storage.move()`** — opération côté serveur, instantanée quelle que soit la taille du fichier
2. **Ajouter un état de chargement** (`renamingInProgress`) avec spinner sur le bouton de validation
3. **Ajouter un toast informatif** quand le nom n'a pas changé

```tsx
// Avant (problématique pour gros fichiers)
const { data: blob } = await supabase.storage.from('assets').download(renamingFile);
await supabase.storage.from('assets').upload(finalName, blob, { upsert: true });
await supabase.storage.from('assets').remove([renamingFile]);

// Après (opération serveur instantanée)
const { error } = await supabase.storage.from('assets').move(renamingFile, finalName);
```

## Fichier impacté

| Fichier | Changement |
|---------|-----------|
| `src/components/admin/AssetUploader.tsx` | `move()` au lieu de download/upload/delete + loading state + feedback |

