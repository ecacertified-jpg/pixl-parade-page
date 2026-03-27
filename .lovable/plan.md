

# Plan : Upload vidéo dans le bucket `assets` + mise à jour du modal

## Résumé

Modifier l'`AssetUploader` pour accepter les vidéos MP4 et mettre à jour `BirthdayCelebrationModal` pour charger la vidéo depuis le bucket `assets` au lieu de `birthday-videos`.

## Changements

### 1. `src/components/BirthdayCelebrationModal.tsx`

Changer l'URL de la vidéo de :
```
birthday-videos/default-celebration.mp4
```
vers :
```
assets/default-celebration.mp4
```

Une seule ligne à modifier (ligne ~150).

### 2. `supabase/functions/birthday-wishes/index.ts`

Mettre à jour le fallback vidéo qui référence `birthday-videos` pour pointer vers `assets` (si présent dans la logique de résolution vidéo).

### 3. `.lovable/memory/infrastructure/public-media-storage.md`

Mettre à jour la documentation pour indiquer que les vidéos d'anniversaire sont désormais dans le bucket `assets` (plus besoin du bucket `birthday-videos` séparé).

## Résultat

Après ces changements, vous pourrez :
1. Aller dans **Admin → Settings → Assets**
2. Cliquer ou glisser votre fichier `default-celebration.mp4`
3. Le modal de célébration le chargera automatiquement

## Fichiers modifiés

- `src/components/BirthdayCelebrationModal.tsx`
- `supabase/functions/birthday-wishes/index.ts` (si référence au bucket)
- `.lovable/memory/infrastructure/public-media-storage.md`

