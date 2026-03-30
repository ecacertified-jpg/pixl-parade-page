

# Plan : Corriger `getAppBaseUrl` pour le preview Lovable

## Problème

`import.meta.env.PROD` est `true` aussi bien sur le preview Lovable que sur le site publié (les deux sont des builds de production Vite). Résultat : les liens générés dans le preview pointent vers `joiedevivre-africa.com` au lieu du domaine preview, ce qui les rend inaccessibles depuis le preview.

## Solution

Modifier `src/utils/appUrl.ts` pour détecter si on est sur le domaine de production réel (`joiedevivre-africa.com`) ou sur un autre domaine (preview Lovable, localhost, etc.) :

```typescript
export const getAppBaseUrl = () => {
  const isProductionDomain = window.location.hostname === 'joiedevivre-africa.com' 
    || window.location.hostname === 'www.joiedevivre-africa.com';
  return isProductionDomain ? 'https://joiedevivre-africa.com' : window.location.origin;
};
```

Ainsi :
- Sur `joiedevivre-africa.com` → liens vers `joiedevivre-africa.com`
- Sur le preview Lovable → liens vers le domaine preview
- En localhost → liens vers localhost

## Fichier concerné

| Fichier | Action |
|---------|--------|
| `src/utils/appUrl.ts` | Détecter le hostname au lieu de `import.meta.env.PROD` |

