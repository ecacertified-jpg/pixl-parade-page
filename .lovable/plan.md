## Constats

### Bug 1 — "Edge Function returned a non-2xx status code"
Le message générique vient de `supabase.functions.invoke`, qui n'expose pas le `data.error` quand le status est ≥ 400. L'edge function `fetch-external-product-meta` retourne 502/504 lorsque Jumia bloque le bot (anti-scraping fréquent : 403, captcha, redirection), 400 si l'URL n'est pas reconnue, etc. Résultat : la modale échoue dur, sans laisser l'utilisateur saisir manuellement le produit.

### Demande 2 — Auto-collage du lien copié
Aujourd'hui l'utilisateur doit cliquer sur "Coller le lien". Le souhait : à l'ouverture de la modale, si le presse-papiers contient déjà une URL produit valide, elle doit se coller toute seule dans le champ.

## Correctifs

### 1. `supabase/functions/fetch-external-product-meta/index.ts`
- Quand la plateforme est reconnue mais que le fetch échoue (403/timeout/non-OK), **ne plus renvoyer un status d'erreur** : renvoyer `200` avec `{ platform, url, name: null, image_url: null, price: null, currency: 'XOF', partial: true, warning: '…' }`. La modale affichera alors les champs en saisie manuelle au lieu d'un toast bloquant.
- Garder le `400` uniquement pour les vraies erreurs d'input (URL invalide, plateforme non supportée).

### 2. `src/hooks/useExternalFavorites.ts`
- Dans `fetchExternalProductMeta`, lire `error.context.json()` (forme renvoyée par supabase-js v2 sur `FunctionsHttpError`) pour extraire le vrai `error` server-side. Fallback vers `error.message` si indisponible. Plus de "non-2xx status code" générique.

### 3. `src/components/wishlist/JumiaImportModal.tsx`
- **Auto-collage à l'ouverture** : dans le `useEffect` qui se déclenche quand `isOpen` passe à `true`, tenter `navigator.clipboard.readText()` ; si le contenu est une URL `http(s)` (et plus précisément un host marchand reconnu — Jumia, Amazon, AliExpress, Alibaba, Shein, Temu, eBay), remplacer le placeholder par cette URL et déclencher automatiquement `handlePreview()`.
- Si le presse-papiers est vide / refusé / non-URL : garder le comportement actuel (champ pré-rempli avec l'URL plateforme), aucun toast d'erreur (silencieux pour ne pas perturber l'ouverture).
- Gérer le cas `partial: true` venant du backend : afficher un toast `warning` ("Lien reconnu mais aperçu impossible — saisis le nom et le prix.") et passer en mode `previewed=true` pour révéler les champs.

## Hors périmètre
- Pas de proxy anti-bot Jumia (out of scope V1) — on accepte que certaines pages renvoient un aperçu partiel et on laisse l'utilisateur compléter.
- Pas de modification des autres modales d'import externe.
