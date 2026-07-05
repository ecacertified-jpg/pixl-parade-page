# Plan — Inspiration : previews sociaux, boutons, tracking Webful

## 1. Aperçu social du lien partagé (image + titre + description)

Aujourd'hui le lien partagé est `…/birthday/<slug>?inspiration=<token>`. Les crawlers (WhatsApp, Facebook, TikTok, LinkedIn) ne lisent que le `<head>` statique de la SPA et voient donc l'OG de la page anniversaire, pas celui de l'élément.

Solution : passer l'URL de partage sur la route courte déjà existante `/inspiration/:token` et la servir via une **edge function** qui :

- Détecte les user‑agents crawlers (WhatsApp, Facebookexternalhit, Twitterbot, TelegramBot, LinkedInBot, Slack, Discord, TikTok…).
- Pour un crawler → renvoie un HTML minimal avec les balises OG/Twitter dérivées de l'item (`title`, `body`, `media_url`, `thumbnail_url`, catégorie/sous‑catégorie) + JSON‑LD.
- Pour un humain → renvoie une petite page HTML qui fait un `window.location.replace('/inspiration/:token')` côté SPA (comportement actuel de `InspirationRedirect.tsx` conservé).

Miniatures :

- **Image** → `media_url` sert directement d'`og:image`.
- **Vidéo** → `thumbnail_url` si présent, sinon on génère un poster à l'upload dans `InspirationComposer` (canvas `video.currentTime = 0.1` → `toBlob` → upload dans le même bucket, colonne `thumbnail_url`).
- **Texte** → OG image = image générique JDV Inspiration (asset statique déjà versionné via `withOgVersion`).

Changements :

- Nouvelle edge function `supabase/functions/inspiration-preview/index.ts` (déclarée `verify_jwt = false` dans `supabase/config.toml`).
- `public/_redirects` : `/inspiration/:token   https://<project>.functions.supabase.co/inspiration-preview?token=:token   200` pour que les crawlers atteignent l'edge function sans que la SPA ne prenne la main.
- `InspirationDetailModal.tsx` et `useInspirationItems`/`AdminInspiration` : `buildShareUrl` renvoie `${getAppBaseUrl()}/inspiration/${item.share_token}` (au lieu du `?inspiration=` sur la page courante).
- `InspirationComposer.tsx` : génération + upload de la thumbnail vidéo, écriture de `thumbnail_url` dans `inspiration_items` (colonne déjà présente).
- `BirthdayPage.tsx` / `EventPage.tsx` : conserver la lecture de `?inspiration=` pour compatibilité, mais aussi accepter `#inspiration=<token>` posé par `InspirationRedirect` lors du fallback.

## 2. Boutons de la modale détail Inspiration

Dans `src/components/inspiration/InspirationDetailModal.tsx` :

- Supprimer les libellés « Partager » et « Copier le lien » — garder uniquement les icônes (`Share2`, `Copy`) avec `aria-label` + `tooltip` pour l'accessibilité.
- Ajouter un 3ᵉ bouton icône **« Voir d'autres vidéos »** (icône `LayoutGrid` ou `Sparkles`) aligné avec les deux autres.

Comportement du nouveau bouton (nouvelle prop `onBrowseMore?: () => void` fournie par le parent) :

- **Utilisateur connecté** → ferme la modale détail et ouvre `InspirationModal` (le parent gère l'état). Sur la page anniversaire/événement le parent ouvre déjà les deux modales : on relie simplement `onBrowseMore` à `setInspirationOpen(true)` après fermeture du détail.
- **Visiteur non connecté** → afficher un petit dialog de gate : « Inscris‑toi pour découvrir plus d'inspirations » → bouton `S'inscrire` qui envoie vers `/auth?tab=signup&redirect=inspiration&token=<share_token>&page=<current_url>&utm_source=inspiration_more`.
- Dans `AuthContext`/redirection post‑signup (existant : `authRedirect.ts`), ajouter la gestion `redirect=inspiration` → après login/signup, rediriger vers `page` (URL encodée) avec `?openInspiration=1` (et si `token`, `?inspiration=<token>` en plus).
- `BirthdayPage.tsx` / `EventPage.tsx` : lire `?openInspiration=1` au montage → ouvrir automatiquement `InspirationModal`.

## 3. Tracker Webful

- Injecter le script dans `index.html` (une seule fois, sitewide) juste avant `</head>` :

```html
<script src="https://webful.fr/tracking/webful-track.js"
  data-site-id="WBF-80680"
  data-api-key="6bb3e12803a2d9c7313e66e298fe90575b2f922fb18b8fab81d0e1bca60ecee4"
  data-base-url="https://webful.fr"
  async></script>
```

Remarque sécurité : la clé fournie est destinée à être exposée côté navigateur par Webful (même modèle que Google Analytics / Plausible). Elle reste donc en clair dans `index.html`, comme demandé.

## Résumé des fichiers touchés

- `supabase/functions/inspiration-preview/index.ts` (nouveau)
- `supabase/config.toml` (déclaration edge function, `verify_jwt = false`)
- `public/_redirects` (route `/inspiration/:token` → edge function)
- `src/components/inspiration/InspirationDetailModal.tsx` (boutons icônes + « Voir d'autres vidéos » + URL de partage)
- `src/components/inspiration/InspirationComposer.tsx` (génération thumbnail vidéo + `thumbnail_url`)
- `src/pages/BirthdayPage.tsx`, `src/pages/EventPage.tsx` (branchement `onBrowseMore`, lecture `?openInspiration=1`)
- `src/pages/Admin/AdminInspiration.tsx` (URL de partage `getAppBaseUrl()/inspiration/:token` — déjà OK, à vérifier)
- `src/utils/authRedirect.ts` (nouveau cas `redirect=inspiration`)
- `index.html` (script Webful)

Aucune migration DB nécessaire (`thumbnail_url` existe déjà sur `inspiration_items`).
