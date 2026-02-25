

## Correction de l'erreur de deploiement generate-admin-og-image

### Probleme
Le CLI Supabase cherche par defaut un fichier `index.ts`, mais la fonction `generate-admin-og-image` utilise un fichier `index.tsx` (car elle contient du JSX pour generer l'image OG). Le deploiement echoue avec l'erreur :
```
Entrypoint path does not exist - .../index.ts
```

### Solution
Ajouter la propriete `entrypoint` dans `supabase/config.toml` pour indiquer au CLI d'utiliser `index.tsx` au lieu de `index.ts`.

### Modification

**Fichier** : `supabase/config.toml`

Remplacer :
```toml
[functions.generate-admin-og-image]
verify_jwt = false
```

Par :
```toml
[functions.generate-admin-og-image]
verify_jwt = false
entrypoint = "./index.tsx"
```

### Apres la modification
1. Faire `git pull origin main` pour recuperer le changement
2. Relancer : `npx supabase functions deploy generate-admin-og-image --project-ref vaimfeurvzokepqqqrsl`
3. Puis deployer join-preview : `npx supabase functions deploy join-preview --project-ref vaimfeurvzokepqqqrsl`

