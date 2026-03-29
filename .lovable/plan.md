

# Plan : Tester l'envoi du template `joiedevivre_birthday_countdown_invite`

## Constat

Le template Meta a cette structure :
- **Header** : Image dynamique (doit etre fournie a chaque envoi)
- **Body** : `Salut {{1}}, Ton anniversaire arrive dans {{2}} jour(s) !...`
  - `{{1}}` = nom du contact
  - `{{2}}` = nombre de jours
- **Bouton CTA** : "Creer mon compte" — URL statique (`https://joiedevivre-africa.com/auth?utm_source=whatsapp&utm_medium=birthday_countdown`)
- **Footer** : "JOIE DE VIVRE - Celebrons ensemble"

## Probleme

La fonction `test-whatsapp-send` ne supporte pas le **header image**, requis par ce template. Un envoi sans image echouera avec une erreur de parametres.

## Modifications

### 1. Enrichir `test-whatsapp-send` pour supporter le header image

Ajouter un parametre `header_image_url` au body JSON. Si present, ajouter un composant `header` au payload template.

### 2. Tester l'envoi avec des donnees reelles

Utiliser `supabase--curl_edge_functions` pour appeler `test-whatsapp-send` avec :
- Un contact reel de la base (nom + telephone)
- L'image du header depuis le storage Supabase
- Les 2 body params corrects

### 3. Bug potentiel identifie

Dans `birthday-wishes/index.ts` (ligne 345), le code fait :
```ts
const channel = getPreferredChannel(contact.phone);
if (channel === 'whatsapp') { ... }
```

Or `getPreferredChannel` retourne `'sms'` pour les numeros `+225` (Cote d'Ivoire). Resultat : **aucun utilisateur ivoirien ne recoit ce template**. Ce template est une invitation pour des non-inscrits — le SMS fallback n'envoie pas le meme message. Il faudrait toujours tenter WhatsApp pour ce template d'invitation.

## Fichiers concernes

| Fichier | Action |
|---------|--------|
| `supabase/functions/test-whatsapp-send/index.ts` | Ajouter support `header_image_url` |
| `supabase/functions/birthday-wishes/index.ts` (ligne 345) | Supprimer la condition `getPreferredChannel` pour toujours envoyer via WhatsApp |

