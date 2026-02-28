

## Corriger le lien d'invitation "Mon cercle d'amis"

### Probleme

Dans `Dashboard.tsx` (ligne 821), le bouton d'invitation envoie un message WhatsApp contenant le lien `https://joiedevivre-africa.com/go/register`. Or, cette route **n'existe pas** dans `App.tsx`. La bonne route est `/go/signup` (ligne 209), qui redirige vers `/auth?tab=signup`.

### Solution

**Fichier : `src/pages/Dashboard.tsx`** (ligne 821)

Remplacer :
```
https://joiedevivre-africa.com/go/register
```
par :
```
https://joiedevivre-africa.com/go/signup
```

### Detail technique

La route `/go/signup` est deja definie dans `App.tsx` et effectue un `Navigate` vers `/auth?tab=signup&utm_source=deep_link`. Le lien fonctionnera immediatement sans aucune autre modification.

