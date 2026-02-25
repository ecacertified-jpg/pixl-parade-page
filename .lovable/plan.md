
### Diagnostic précis (à partir de ta capture)
L’erreur a changé, ce qui confirme que la config est presque bonne mais avec un **mauvais chemin** :

1. Avant : le CLI cherchait `supabase/functions/generate-admin-og-image/index.ts` (comportement par défaut).
2. Maintenant : il cherche `supabase/index.tsx`.

Donc `entrypoint = "./index.tsx"` est interprété **relatif à `supabase/config.toml`**, pas au dossier de la fonction.  
Il faut pointer vers le fichier complet de la fonction.

---

### Correction à appliquer
Dans `supabase/config.toml`, bloc :

```toml
[functions.generate-admin-og-image]
verify_jwt = false
entrypoint = "./index.tsx"
```

à remplacer par :

```toml
[functions.generate-admin-og-image]
verify_jwt = false
entrypoint = "./functions/generate-admin-og-image/index.tsx"
```

---

### Déploiement manuel étape par étape (Windows)
1. Ouvre un terminal à la racine du projet :
```bash
cd C:\Users\FLORENTIN\pixl-parade-page
```

2. Vérifie rapidement que le fichier existe :
```bash
dir supabase\functions\generate-admin-og-image\index.tsx
```

3. Modifie `supabase/config.toml` avec le chemin corrigé ci-dessus, puis sauvegarde.

4. Déploie la fonction image :
```bash
npx supabase functions deploy generate-admin-og-image --project-ref vaimfeurvzokepqqqrsl
```

5. Déploie ensuite `join-preview` :
```bash
npx supabase functions deploy join-preview --project-ref vaimfeurvzokepqqqrsl
```

---

### Vérification après déploiement
1. Tester l’HTML crawler (meta OG) :
```bash
curl -i -H "User-Agent: WhatsApp" "https://vaimfeurvzokepqqqrsl.supabase.co/functions/v1/join-preview/ADM-RW3R"
```
Tu dois voir `og:image` pointant vers `generate-admin-og-image?code=ADM-RW3R`.

2. Tester l’image OG directe :
```bash
curl -I "https://vaimfeurvzokepqqqrsl.supabase.co/functions/v1/generate-admin-og-image?code=ADM-RW3R"
```
Tu dois obtenir `200` (ou `302` vers cache), avec `Content-Type: image/png`.

---

### Si l’erreur persiste malgré le bon chemin
1. Vérifie la version CLI (entrypoint custom supporté en CLI récente) :
```bash
npx supabase --version
```
2. Relance avec debug :
```bash
npx supabase functions deploy generate-admin-og-image --project-ref vaimfeurvzokepqqqrsl --debug
```
3. Colle-moi la sortie complète `--debug` et je te donne la correction exacte immédiatement.
