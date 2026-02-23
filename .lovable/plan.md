
# Utiliser le domaine joiedevivre-africa.com pour les liens de partage admin

## Probleme
Le lien de partage utilise `window.location.origin`, ce qui genere une URL basee sur le domaine Lovable (ex: `e6acd60b-...lovableproject.com/join/ADM-AXE9`) au lieu du domaine de production.

## Solution
Remplacer `window.location.origin` par le domaine de production `https://joiedevivre-africa.com` dans le hook `useAdminShareCode.ts`.

## Modification

**Fichier** : `src/hooks/useAdminShareCode.ts` (ligne 100)

Remplacer :
```ts
return `${window.location.origin}/join/${shareCode.code}`;
```

Par :
```ts
return `https://joiedevivre-africa.com/join/${shareCode.code}`;
```

Cela generera des liens comme `https://joiedevivre-africa.com/join/ADM-AXE9`, propres et professionnels pour le partage sur les reseaux sociaux.
