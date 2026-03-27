

# Plan : Mettre à jour l'URL CTA du template birthday_countdown vers /wishlist-catalog

## Contexte

L'URL du CTA dans Meta est modifiée de `/favorites` à `/wishlist-catalog`. Il faut synchroniser le code et la documentation.

## Changements

### 1. `supabase/functions/birthday-wishes/index.ts`

Deux modifications identiques :
- **Ligne 253** : `['favorites']` → `['wishlist-catalog']`
- **Ligne 349** : `['favorites']` → `['wishlist-catalog']`

### 2. `.lovable/memory/features/birthday-celebration-flow.md`

Mettre à jour la référence CTA de `/favorites` à `/wishlist-catalog` dans la section Template WhatsApp.

## Fichiers modifiés

- `supabase/functions/birthday-wishes/index.ts`
- `.lovable/memory/features/birthday-celebration-flow.md`

