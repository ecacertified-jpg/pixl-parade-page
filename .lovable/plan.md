## Diagnostic

J’ai testé exactement ce que WhatsApp reçoit en grattant chaque URL avec un User-Agent WhatsApp :

- `https://vaimfeurvzokepqqqrsl.supabase.co/functions/v1/birthday-preview/ange-felicia--2026` → ✅ rend le bon HTML (`og:image` = photo de l’album d’Ange Felicia, version `1747...-6f8dfe74`).
- `https://joiedevivre-africa.com/birthday/ange-felicia--2026` → ❌ rend `index.html` (titre générique JDV, `og:image = og-image.jpg?v=2026051602`).
- Idem pour `www.joiedevivre-africa.com` et `pixl-parade-page.lovable.app`.

La cause : sur le hosting Lovable, le fichier `public/_redirects` est ignoré (c’est une convention Netlify). Le routage `\/birthday\/* → birthday-preview` n’a donc jamais été appliqué sur le domaine public — toutes les routes tombent dans le fallback SPA qui sert `index.html` aux crawlers. Côté DB la photo est bien sélectionnée (`social_share_photo_id = 6f8dfe74…`), donc le problème n’est pas dans les données, c’est l’URL partagée qui n’atteint pas la bonne edge function.

## Correctif retenu (immédiat)

Faire pointer les URLs de partage anniversaire directement vers l’edge function `birthday-preview`. Les crawlers (WhatsApp, Facebook, LinkedIn) liront alors le bon `og:image`. Les humains seront redirigés 302 vers le SPA (`/birthday/:slug`) par la function elle-même — ce code existe déjà dans `birthday-preview/index.ts`.

## Changements

### 1. `src/utils/buildBirthdayShareUrl.ts`

- Modifier `buildBirthdayShareUrl(slug, opts)` pour retourner :
  `https://vaimfeurvzokepqqqrsl.supabase.co/functions/v1/birthday-preview/<slug>?s=<versionTag>`
  au lieu de `https://joiedevivre-africa.com/birthday/<slug>?s=...`.
- Garder `computeBirthdayShareVersionTag` inchangé.
- Conserver la version sync et la version async (qui charge `updated_at` + `social_share_photo_id` depuis la DB).
- Ajouter un commentaire expliquant que cette URL est le point d’entrée crawler + redirection humaine.

### 2. `src/pages/Dashboard.tsx` (encart « Partagez votre page d’anniversaire »)

- Remplacer l’affichage en clair `{getAppBaseUrl()}/birthday/{slug}` par l’URL générée via `buildBirthdayShareUrl(slug)` (l’utilisateur copie alors l’URL qui marche).

### 3. `src/components/ShareBirthdayToCirclesModal.tsx`

- Initialiser `birthdayUrl` via `buildBirthdayShareUrl(slug)` plutôt que `${getAppBaseUrl()}/birthday/${slug}` (pour ne plus jamais exposer l’URL cassée même 1 frame).

### 4. Vérification

- `curl -A "WhatsApp/..." <nouvelle URL>` → doit retourner le HTML birthday-preview avec la bonne `og:image`.
- Charger la même URL dans un navigateur → redirection 302 vers `/birthday/<slug>` sur le domaine.

## Notes

- Aucun changement nécessaire dans `birthday-preview/index.ts` (déjà OK pour humains et crawlers).
- Aucun changement DB requis.
- Les liens déjà envoyés sur WhatsApp resteront figés dans le cache WhatsApp côté client — il faudra repartager depuis l’app pour voir la photo de l’album.
- Le routage propre `joiedevivre-africa.com/birthday/*` reste cassé (problème d’infra Lovable, pas de `_redirects`). Si tu veux ensuite une URL « jolie », on pourra demander à Lovable d’ajouter un edge route ou faire un proxy applicatif, mais ça sortirait du scope de ce correctif immédiat.
