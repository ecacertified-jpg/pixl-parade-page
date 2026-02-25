
### Ce que montre ta capture
- Le bloc d’erreur rouge en haut correspond à une **ancienne tentative** (avant le `git pull`).
- Après le `git pull`, ton nouveau déploiement affiche :
  - `Uploading asset ...`
  - `Deployed Functions on project ... : generate-admin-og-image`
- Donc le problème d’`entrypoint` est bien corrigé côté déploiement.

### Diagnostic complémentaire (vérification backend)
J’ai vérifié les logs de la fonction `generate-admin-og-image` et il y a maintenant une erreur runtime :
- `Unsupported OpenType signature wOF2`
- Cause : `og_edge/satori` n’accepte pas la police `.woff2` utilisée actuellement.

Concrètement :
- Le déploiement passe
- Mais l’appel de la fonction peut renvoyer `500 Error generating image` tant que la police reste en `.woff2`.

---

### Plan d’action proposé

#### 1) Finaliser le déploiement fonctionnel
- Déployer aussi `join-preview` (si pas déjà fait).
- Vérifier que `join-preview` pointe bien vers `generate-admin-og-image?code=...` dans les balises OG.

#### 2) Corriger le crash de génération d’image OG
- Remplacer la police distante `.woff2` par une police supportée par `satori` (`.ttf` ou `.otf`) **ou** désactiver temporairement l’injection de police custom.
- Garder un fallback robuste : si chargement police échoue, générer quand même l’image sans police custom (pour éviter tout `500`).

#### 3) Appliquer la même robustesse aux autres fonctions OG
Les fonctions suivantes utilisent aussi la même URL `.woff2` et risquent le même crash :
- `generate-og-image`
- `generate-fund-og-image`
- `generate-business-og-image`
- `generate-admin-og-image`

#### 4) Vérification de bout en bout
- Tester l’endpoint image directement (`generate-admin-og-image?code=...`) :
  - attendu : `200` ou `302` vers cache, jamais `500`
- Tester `join-preview/<code>` avec user-agent crawler :
  - attendu : HTML avec `og:image` dynamique
- Tester un vrai partage (WhatsApp/Facebook) pour confirmer l’aperçu riche.

---

### Détails techniques (section technique)
- Fichier de config déjà correct :
  - `supabase/config.toml`
  - `entrypoint = "./functions/generate-admin-og-image/index.tsx"`
- Le correctif principal n’est plus dans `config.toml`, mais dans le rendu OG (gestion de police compatible `og_edge`).
- Idéalement, centraliser le chargement de police dans un helper partagé pour éviter les divergences entre fonctions OG.

### Critères de succès
- Aucun `500` dans les logs `generate-admin-og-image`
- `join-preview` sert bien les meta tags OG dynamiques
- L’aperçu de partage affiche la carte personnalisée (nom admin / branding)
