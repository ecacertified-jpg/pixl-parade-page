

## Nettoyer le fundId pour supporter les URLs Meta malformees

### Probleme

Meta Business Manager encode le placeholder `{{1}}` en texte litteral `%7B%7B1%7D%7D` dans l'URL du bouton CTA, produisant des liens comme :
```
/f/%7B%7B1%7D%7D851779a5-7c92-41b0-b429-e5ecbc6f0eb7
```
Au lieu de :
```
/f/851779a5-7c92-41b0-b429-e5ecbc6f0eb7
```

Le navigateur decode automatiquement `%7B%7B1%7D%7D` en `{{1}}`, donc le `fundId` recu par React Router est :
```
{{1}}851779a5-7c92-41b0-b429-e5ecbc6f0eb7
```

### Solution

Ajouter un nettoyage du `fundId` dans `FundPreview.tsx` pour supprimer tout prefixe `{{1}}` (ou `{{N}}`) avant d'interroger Supabase. Ce meme nettoyage sera aussi applique aux autres pages qui recoivent des parametres dynamiques de templates WhatsApp (ex: page de confirmation de commande).

### Modifications

**Fichier : `src/pages/FundPreview.tsx`**

Ajouter une fonction de nettoyage et l'appliquer au `fundId` extrait par `useParams` :

```typescript
// Nettoyer les prefixes Meta template ({{1}}, {{2}}, etc.)
const cleanMetaParam = (param: string | undefined): string | undefined => {
  if (!param) return param;
  return param.replace(/^\{\{\d+\}\}/, '');
};

const rawFundId = useParams<{ fundId: string }>().fundId;
const fundId = cleanMetaParam(rawFundId);
```

Cela transformera `{{1}}851779a5-...` en `851779a5-...` (un UUID valide).

**Fichier : `src/pages/OrderConfirmation.tsx` (ou equivalent)**

Appliquer le meme nettoyage pour le parametre `orderId` recu depuis le template `joiedevivre_gift_order`.

### Impact

- Tous les liens WhatsApp existants avec le prefixe `{{1}}` fonctionneront immediatement
- Les liens sans prefixe continueront de fonctionner normalement
- Aucune modification dans Meta Business Manager requise
- Compatible avec tous les templates actuels et futurs

