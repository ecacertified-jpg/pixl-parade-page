

# Plan : Synchroniser joiedevivre_birthday_countdown (image header + URL corrigée)

## Deux corrections à appliquer

### 1. Ajouter le header image dans l'appel WhatsApp

Le template dans Meta a maintenant un **header image** (exemple de contenu multimédia ajouté). Il faut passer l'URL de l'image dans `sendWhatsAppTemplate` via le paramètre `headerImageUrl`, comme le font déjà `birthday-reminder-with-suggestions` et `notify-fund-ready`.

**Dans `supabase/functions/birthday-wishes/index.ts`** :
- Ajouter une constante pour l'image header du countdown (via env var `BIRTHDAY_COUNTDOWN_IMAGE_URL` avec fallback sur le bucket `assets`)
- Passer cette URL comme 6e paramètre de `sendWhatsAppTemplate` aux deux endroits d'appel (profils ligne ~244 et contacts ligne ~339)

### 2. Corriger l'URL du CTA

L'URL `/wishlist` n'existe pas. Les routes correctes sont :
- **`/favorites`** — "Ma Liste de Souhaits" (articles déjà ajoutés par l'utilisateur)
- **`/wishlist-catalog`** — "Catalogue de souhaits" (parcourir et cocher des articles)

Pour le CTA "Mettre à jour ma wishlist", la route pertinente est **`/favorites`** car on invite l'utilisateur à consulter/enrichir sa liste existante.

**URL correcte pour Meta** : `https://joiedevivre-africa.com/favorites`
**Exemple d'URL** : `https://joiedevivre-africa.com/favorites`

**Dans le code** : Mettre à jour le paramètre de bouton CTA passé à `sendWhatsAppTemplate` de `['wishlist']` à `['favorites']` (si le CTA est dynamique) ou ne rien changer si le CTA est statique dans Meta.

**Important** : Si le bouton CTA dans Meta est configuré en **URL statique** (`https://joiedevivre-africa.com/favorites`), alors le paramètre `buttonParameters` dans le code n'est pas utilisé et peut rester vide. Si c'est un CTA dynamique avec suffixe, il faut passer `['favorites']`.

### 3. Retirer `needsMetaCreation: true` dans l'inventaire

Le template existe maintenant dans Meta, retirer le flag dans `useWhatsAppTemplateInventory.ts`.

### 4. Mettre à jour la mémoire

Mettre à jour `.lovable/memory/features/birthday-celebration-flow.md` avec le header image et l'URL corrigée.

## Guide pour Meta

**Modification du CTA dans Meta** (si pas encore fait) :
- Aller dans le template `joiedevivre_birthday_countdown`
- Modifier l'URL du bouton CTA de `https://joiedevivre-africa.com/wishlist` à `https://joiedevivre-africa.com/favorites`
- Champ "Ajoutez un exemple d'URL" : `https://joiedevivre-africa.com/favorites`

## Fichiers modifiés

- `supabase/functions/birthday-wishes/index.ts` (header image + URL CTA)
- `src/hooks/useWhatsAppTemplateInventory.ts` (retirer `needsMetaCreation`)
- `.lovable/memory/features/birthday-celebration-flow.md` (mise à jour)

