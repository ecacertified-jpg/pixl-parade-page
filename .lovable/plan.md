

# Plan : Corriger et tester le template `joiedevivre_join_reminder`

## Diagnostic

### Erreur Meta #132012 : "Parameter format does not match format in the created template"

Le template Meta `joiedevivre_join_reminder` a un **header image** configurable (visible dans les captures). Le code dans `notify-contacts-join-reminder/index.ts` (ligne 87-91) appelle `sendWhatsAppTemplate` avec seulement les `bodyParameters` -- **sans passer de `headerImageUrl`**. Meta rejette l'envoi car le template attend un composant header image.

De plus, le bouton CTA est **statique** (visible dans la capture : Type d'URL = Statique), donc aucun `buttonParameters` ne doit etre passe.

### 7/7 echecs confirmes dans les logs

Tous les envois echouent avec `#132012` ou `#131009` (meme cause racine).

## Corrections

### 1. Ajouter l'image header dans `notify-contacts-join-reminder/index.ts`

Ligne 87-91, modifier l'appel a `sendWhatsAppTemplate` pour passer une image header (URL de l'image Joie de Vivre depuis Supabase Storage ou variable d'environnement) :

```typescript
const JOIN_REMINDER_IMAGE_URL = Deno.env.get('JOIN_REMINDER_IMAGE_URL')
  || 'https://vaimfeurvzokepqqqrsl.supabase.co/storage/v1/object/public/assets/join-reminder-header.jpg';

const waResult = await sendWhatsAppTemplate(
  contact.phone,
  'joiedevivre_join_reminder',
  'fr',
  [ownerName],
  undefined,          // pas de buttonParameters (bouton statique)
  JOIN_REMINDER_IMAGE_URL  // header image requis par Meta
);
```

### 2. Supprimer la condition `channel === 'whatsapp'`

Ligne 85, le code verifie `if (channel === 'whatsapp')` ce qui exclut les numeros ivoiriens (+225). Appliquer la strategie WhatsApp-first : toujours tenter WhatsApp, puis SMS en fallback.

### 3. Tester via `test-whatsapp-send`

Apres deploiement, envoyer un test au numero verifie `+2250708895257` :
- `template`: `joiedevivre_join_reminder`
- `body_params`: `["Aboutou"]`
- `header_image_url`: URL de l'image header
- Pas de `button_params` (bouton statique)

## Fichier concerne

| Fichier | Action |
|---------|--------|
| `supabase/functions/notify-contacts-join-reminder/index.ts` | Ajouter header image + WhatsApp-first |

