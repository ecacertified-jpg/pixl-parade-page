## Étape 1 — Publier les changements (obligatoire avant tout re-scrape)

Le HTML servi sur `https://joiedevivre-africa.com/` contient encore `?v=20260516`. Le bump `?v=2026051602` est en local mais pas déployé. Tant que la prod ne renvoie pas la nouvelle valeur, aucun re-scrape ne produira d'effet.

Action : cliquer **Publish** dans Lovable, puis attendre la propagation Cloudflare (~30 s).

Vérification post-publish (je la ferai automatiquement) :
```
curl -s -A "facebookexternalhit/1.1" https://joiedevivre-africa.com/ | grep og:image
```
Doit retourner `?v=2026051602`.

## Étape 2 — Re-scraper chaque plateforme (manuel, côté utilisateur)

Ces actions requièrent une session connectée et ne peuvent pas être automatisées depuis Lovable.

| Plateforme | URL outil | Action |
|---|---|---|
| Facebook | https://developers.facebook.com/tools/debug/?q=https://joiedevivre-africa.com/ | Cliquer **Scrape Again** (2 fois si nécessaire) |
| LinkedIn | https://www.linkedin.com/post-inspector/inspect/https://joiedevivre-africa.com/ | Cliquer **Inspect** |
| WhatsApp | Envoyer le lien à soi-même dans WhatsApp | L'aperçu doit montrer la nouvelle image |
| Twitter/X | https://cards-dev.twitter.com/validator | Coller l'URL (déprécié mais utile) |

Tester aussi la variante `www` : `https://www.joiedevivre-africa.com/` (même procédure).

## Étape 3 — Vérification post-scrape

Une fois Scrape Again exécuté côté Facebook, je vérifierai via :
```
curl -sI "https://joiedevivre-africa.com/og-image.jpg?v=2026051602"
```
La réponse doit être `HTTP/2 200` avec `content-type: image/jpeg` et `content-length` ≈ 21 KB (< limite WhatsApp 300 KB).

## Étape 4 — Si l'image ne s'affiche toujours pas

Diagnostics à enchaîner :
1. Vérifier dans Facebook Debugger les **warnings** (taille, ratio, redirect chain apex→www)
2. Confirmer que l'image est bien servie en `200` directement (pas de redirect)
3. Bumper à nouveau `OG_IMAGE_VERSION` dans `supabase/functions/_shared/og-image-version.ts` + les 3 lignes d'`index.html`, puis re-publier

## Ce que je ferai automatiquement après ton "Implement plan"

- `curl` sur l'apex et `www` pour confirmer que `?v=2026051602` est servi
- `curl` sur l'asset image pour confirmer taille, MIME, status 200
- Rapport synthétique avec les liens cliquables vers Facebook Debugger / LinkedIn Inspector pour que tu n'aies qu'à cliquer "Scrape Again"

Aucun fichier ne sera modifié à cette étape — c'est purement une vérification + guidage.
