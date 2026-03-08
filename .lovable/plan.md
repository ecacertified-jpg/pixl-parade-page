

## Plan: Thumbnail preview for image assets

### Modification

**Fichier** : `src/components/admin/AssetUploader.tsx`

1. **State** : Ajouter `previewFile: string | null` pour tracker le fichier dont on affiche la preview

2. **Helper** : Fonction `getPublicUrl(fileName)` → construit l'URL publique du fichier

3. **Icone cliquable** : Pour les fichiers image (`mimetype.startsWith('image/')`), rendre l'icone `FileImage` cliquable pour toggle la preview. Ajouter aussi un tooltip au survol avec une mini-thumbnail via un `HoverCard` de Radix UI

4. **Preview inline** : Quand `previewFile === file.name`, afficher une ligne supplémentaire sous le fichier avec l'image en thumbnail (max-h-48, rounded, object-contain). Clic dessus ou bouton X pour fermer

5. **Imports** : Ajouter `HoverCard, HoverCardTrigger, HoverCardContent` depuis shadcn, et `Eye, EyeOff` depuis lucide-react

### UX
- Survol de l'icone image → mini preview en popover (200x200)
- Clic sur l'icone image → preview plus grande inline sous la ligne du fichier
- Seuls les fichiers image ont cette fonctionnalité (pas vidéo/pdf)

