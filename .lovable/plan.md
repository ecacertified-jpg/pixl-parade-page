

# Plan : Corriger "Cagnotte introuvable" depuis la page d'anniversaire

## Probleme

`BirthdayPage.tsx` navigue vers `/f/${fund.share_token}` (ligne 378), mais `FundPreview.tsx` fait `.eq("id", fundId)` (ligne 98) — il cherche par UUID. Le `share_token` n'est pas un UUID, donc la requete echoue systematiquement.

## Solution

Deux corrections complementaires :

### 1. `src/pages/BirthdayPage.tsx`
- Ligne 378 : remplacer `navigate('/f/${fund.share_token}')` par `navigate('/f/${fund.id}')`
- Le `fund.id` est le vrai UUID, coherent avec tous les autres endroits du code qui utilisent `/f/`

### 2. `src/pages/FundPreview.tsx`
- Ajouter un fallback : si `fundId` n'est pas un UUID valide (regex check), faire la requete sur `share_token` au lieu de `id`
- Cela rend la route `/f/:fundId` resiliente aux deux formats (UUID et share_token), utile si d'anciens liens partagés utilisent le share_token

```text
const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-.../.test(fundId);
if (isUUID) → .eq("id", fundId)
else        → .eq("share_token", fundId)
```

## Impact
- Corrige le bug immediat (clic "Participer au cadeau" → cagnotte introuvable)
- Les liens deja partages avec share_token continueront de fonctionner grace au fallback

