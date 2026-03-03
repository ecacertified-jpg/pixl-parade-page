

# Fix : "Cagnotte introuvable" via lien WhatsApp + configuration Meta CTA

## Diagnostic

Deux problemes identifies :

1. **Prefixe Meta `{{1}}`** : Meta Business Manager peut encoder le placeholder comme texte litteral dans l'URL, produisant `/business/orders/{{1}}efacddcb-3b07-4652-9c45-123297b48a64` au lieu de `/business/orders/efacddcb-...`. La page `BusinessFundOrderView` n'utilise pas `cleanMetaParam` (contrairement a `FundPreview` qui le fait), donc le `fundId` contient un prefixe invalide et la requete RPC retourne `NULL`.

2. **Configuration Meta CTA** : Le modele `joiedevivre_fund_ready` doit avoir le bon format d'URL de base dans Meta Business Manager.

## Solution

### 1. Ajouter `cleanMetaParam` dans `BusinessFundOrderView.tsx`

Modifier la page pour nettoyer le parametre `fundId` avant de l'utiliser dans l'appel RPC, exactement comme le fait deja `FundPreview.tsx` :

```typescript
import { cleanMetaParam } from "@/utils/cleanMetaParam";

// Dans le composant :
const { fundId: rawFundId } = useParams<{ fundId: string }>();
const fundId = cleanMetaParam(rawFundId);
```

### 2. Configuration du CTA dans Meta Business Manager

Pour le modele `joiedevivre_fund_ready`, le bouton CTA doit etre configure ainsi :

- **Type** : Call to Action - URL
- **URL type** : Dynamic
- **Base URL** : `https://joiedevivre-africa.com/business/orders/`
- **Suffixe dynamique** : `{{1}}`

L'URL finale generee sera :
```
https://joiedevivre-africa.com/business/orders/efacddcb-3b07-4652-9c45-123297b48a64
```

**Exemple concret pour la cagnotte existante** :
```
https://joiedevivre-africa.com/business/orders/efacddcb-3b07-4652-9c45-123297b48a64
```

Le code edge function passe deja correctement le `fund_id` comme parametre du bouton (ligne 138 de `notify-fund-ready/index.ts`) :
```typescript
[bf.fund_id] // CTA button: /business/orders/{fund_id}
```

### 3. Ajouter du logging de debug temporaire

Ajouter un `console.log` du `fundId` brut et nettoyé pour faciliter le debug en cas de probleme persistant.

## Fichiers concernes

1. **Modifie** : `src/pages/BusinessFundOrderView.tsx` -- ajout de `cleanMetaParam` + logging

## Pas de nouvelle page

Cette correction se fait uniquement dans la page existante. Aucune nouvelle page n'est creee.

