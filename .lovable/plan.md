
# Corriger l'erreur "Retirer" dans Mes affectations

## Probleme identifie

L'erreur "Failed to fetch" lors du DELETE indique un echec de la requete preflight CORS. Le navigateur envoie d'abord une requete OPTIONS avant un DELETE, et les headers CORS de l'edge function ne declarent pas explicitement les methodes autorisees (`Access-Control-Allow-Methods`). Certains navigateurs rejettent alors la requete.

De plus, le code frontend ne verifie pas le statut de la reponse (`res.ok`), ce qui masquerait d'eventuelles erreurs HTTP.

## Corrections

### 1. Edge Function `admin-manage-assignments/index.ts`

Ajouter `Access-Control-Allow-Methods` dans les headers CORS :

```text
corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
}
```

### 2. Frontend `MyAssignments.tsx`

Ameliorer la fonction `handleRemove` :

- Verifier `res.ok` apres le fetch
- Si la reponse n'est pas OK, lire le message d'erreur du serveur et l'afficher
- Afficher le toast de succes uniquement si la requete a reussi

```text
const res = await fetch(baseUrl, { ... });
if (!res.ok) {
  const err = await res.json().catch(() => null);
  throw new Error(err?.error || 'Erreur serveur');
}
toast.success('Affectation retiree');
```

## Fichiers concernes

| Fichier | Action |
|---------|--------|
| `supabase/functions/admin-manage-assignments/index.ts` | Ajouter `Access-Control-Allow-Methods` aux CORS headers |
| `src/pages/Admin/MyAssignments.tsx` | Verifier `res.ok` dans `handleRemove` |
