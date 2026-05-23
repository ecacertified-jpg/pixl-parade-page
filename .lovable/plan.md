## Problèmes identifiés

**1. Upload de la photo de profil échoue**
La console révèle : `StorageApiError: mime type image/svg+xml is not supported`. Le bucket `avatars` n'accepte que les formats raster, mais l'input accepte `image/*` (donc SVG). De plus le message d'erreur générique ne dit pas pourquoi.

**2. Chevauchement des boutons sur la cover**
- `🎬 Vidéos` est rendu via `overlay` en `absolute top-[-3rem] right-3` (donc en bas à droite de la vidéo).
- La pilule `Activer le son` est en `absolute bottom-24 right-3` dans `CoverVideoCarousel`.
- Sur mobile (758×628 et plus petit), les deux se superposent visiblement.

## Modifications

### A. `src/pages/BirthdayPage.tsx`
1. **Input avatar** : restreindre `accept` à `image/png,image/jpeg,image/jpg,image/webp` (pas de SVG/GIF).
2. **`handleAvatarUpload`** :
   - Avant upload, vérifier `file.type` ; si non supporté → toast clair : « Format non supporté. Utilise JPG, PNG ou WebP. »
   - Garder un message d'erreur d'upload plus informatif (afficher `err.message` quand dispo).
3. **Bouton `🎬 Vidéos`** : le déplacer hors de l'overlay bas (qui le force en `top-[-3rem]`) et le rendre en overlay haut, à **gauche** des contrôles son/agrandir, pour éviter toute collision :
   - Position : `absolute top-3 left-3 z-20` (au même niveau que la barre de progression mais à gauche).
   - Style compact icône+label : `h-9 rounded-full bg-black/45 backdrop-blur text-white px-3 text-xs gap-1` cohérent avec les boutons rond son/expand.
   - Sur mobile (`<sm`) : afficher uniquement l'icône 🎬 ; sur `sm+` : icône + « Vidéos ».

### B. `src/components/birthday/CoverVideoCarousel.tsx`
4. **Pilule « Activer le son »** : la repositionner pour ne plus toucher la zone de l'overlay bas (avatar/titre) et rester sous les contrôles haut-droite :
   - Passer de `bottom-24 right-3` à `top-16 right-3` (juste sous les boutons rond son/expand), z-20.
   - Auto-masquage après 4 s via un `useEffect` (timer) pour qu'elle ne gêne pas durablement.
5. Garder les contrôles haut-droite tels quels (son + agrandir), inchangés.

### Récap visuel cible
```
┌──────────────────────────────────────┐
│ ▰▰▰▰▰▰  (progress)                   │
│ [🎬 Vidéos]            [🔊] [⛶]      │  ← haut
│                        [Activer son] │  ← juste sous, auto-hide
│                                      │
│                                      │
│  (Avatar+📷)  Prénom · 30 ans        │  ← bas, plus rien au-dessus
└──────────────────────────────────────┘
```

## Hors scope
- Aucun changement de schéma DB / RLS (le bucket `avatars` est correctement configuré).
- Aucun changement aux fonctionnalités souvenirs/commentaires.
