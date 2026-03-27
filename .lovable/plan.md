

# Plan : Corriger l'extension du fichier birthday-countdown

## Problème détecté

| Élément | Valeur |
|---------|--------|
| Fichier dans le bucket `assets` | `birthday-countdown.jpeg` |
| Référence dans le code (Edge Function) | `birthday-countdown.jpg` |
| Bucket public | ✅ Oui |

L'extension ne correspond pas → l'URL publique génère un 404.

## Solution

Renommer la référence dans le code de `.jpg` à `.jpeg` (plus simple que de renommer le fichier dans le bucket).

### Fichier modifié : `supabase/functions/birthday-wishes/index.ts`

**Ligne 205** : changer `birthday-countdown.jpg` → `birthday-countdown.jpeg`

### Fichier modifié : `.lovable/memory/infrastructure/public-media-storage.md`

Mettre à jour la référence avec l'extension correcte `.jpeg`.

## Résultat

L'URL publique `https://vaimfeurvzokepqqqrsl.supabase.co/storage/v1/object/public/assets/birthday-countdown.jpeg` sera correctement résolue et utilisée comme header image du template WhatsApp `joiedevivre_birthday_countdown`.

