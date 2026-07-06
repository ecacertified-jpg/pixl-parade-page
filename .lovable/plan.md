## Diagnostic

Trois problèmes distincts sur le lien partagé `…supabase.co/functions/v1/inspiration-preview?token=…` :

1. **Aperçu WhatsApp générique (pas la miniature vidéo)** — l'item partagé est une vidéo sans `thumbnail_url` (la génération de miniature ajoutée récemment ne s'applique qu'aux nouveaux uploads). L'edge function retombe donc sur l'image OG par défaut de JDV. WhatsApp voit bien nos balises `og:*` mais avec l'image générique.
2. **Page « sombre » avec HTML brut au clic** — la réponse HTML est correcte côté code, mais le navigateur affiche la source. Deux causes probables (à corriger toutes les deux) :
   - Le `Response` humain renvoie `status: 200` **et** un header `Location` : sur 200 les navigateurs ignorent `Location` et affichent le body — et sur mobile le meta-refresh + `window.location.replace` semble parfois être interprété comme texte quand la réponse est servie par le gateway Supabase Functions (préfixe `/functions/v1/…`).
   - Pour un item de type `global` (post admin) sans `page_id`, `canonicalUrl` retombe sur `${APP_BASE_URL}/?inspiration=<token>` — la page d'accueil ne lit pas `?inspiration=`, donc même après redirection l'utilisateur atterrit sur la home sans modale.
3. **Modale ne s'ouvre pas après clic** — seuls `BirthdayPage` et `EventPage` lisent `?inspiration=<token>`. Pour les posts admin globaux et pour la home il n'y a aucun handler.

## Correctifs

### 1. Générer les miniatures manquantes pour les vidéos existantes

- **Backfill côté client (léger, sans job serveur)** : dans `useInspirationItems.ts`, à la lecture d'un item vidéo qui n'a pas de `thumbnail_url`, générer la miniature via canvas (même helper qu'`InspirationComposer`), l'uploader dans `birthday-message-media/inspiration/thumbnails/` et mettre à jour la ligne. Fire-and-forget, une seule fois par item.
- Alternative si tu préfères zéro traitement navigateur : nouvelle edge function `backfill-inspiration-thumbnails` lancée manuellement depuis l'admin (bouton « Régénérer les miniatures » dans `AdminInspiration.tsx`). Utilise `ffmpeg` via `https://deno.land/x/…` ou l'API Mux/Cloudflare Stream — plus lourd. Je recommande l'option 1.

### 2. Réparer la redirection humaine

Dans `supabase/functions/inspiration-preview/index.ts` :

- Retirer le header `Location` sur les 200 (contradiction HTTP), et surtout **utiliser une vraie redirection 302** pour les humains :

  ```ts
  return new Response(null, { status: 302, headers: { Location: canonicalUrl } });
  ```

  → plus aucun HTML à rendre côté humain, plus de risque d'affichage source, redirection instantanée sur toutes les plateformes (Android, iOS, desktop).
- Ne conserver le HTML riche (`crawlerHtml`) que pour les crawlers.
- S'assurer que le header `content-type: text/html; charset=utf-8` est bien envoyé pour les crawlers (déjà OK, à revérifier).

### 3. Canoniser correctement les URL et ouvrir la modale à l'arrivée

- Pour un item `page_kind = 'global'` (post admin JDV Officiel), rediriger vers une page qui sait ouvrir la modale d'inspiration. Deux options :
  - **Option A (recommandée)** : rediriger vers `/inspiration/:token` (la route SPA existante `InspirationRedirect.tsx`) qui elle-même redirige vers la meilleure page. Adapter `InspirationRedirect.tsx` pour, si l'item est global, rester sur une page dédiée `/inspiration/:token` qui ouvre directement la modale détail plein écran (nouveau petit composant `InspirationStandalonePage.tsx`).
  - **Option B** : rediriger vers `/?inspiration=<token>&openInspirationDetail=1` et ajouter la lecture de ces params dans `Home.tsx` pour ouvrir `InspirationDetailModal` au montage.
- Je propose **A** : plus propre, URL lisible (`/inspiration/abc123`), pas de pollution de la home.

Nouvelle page `src/pages/InspirationStandalonePage.tsx` :
- Récupère l'item via RPC `get_inspiration_by_token`.
- Ouvre `InspirationDetailModal` directement, avec fond de page minimal (logo JDV + fallback si item introuvable).
- Bouton « Voir d'autres inspirations » → `/` ou vers `InspirationModal` global.

Mise à jour de `App.tsx` : `/inspiration/:token` pointe déjà vers `InspirationRedirect.tsx` — le modifier pour :
- Si l'item est lié à une birthday/event page → redirection vers `/birthday/<slug>?inspiration=<token>` (comportement actuel).
- Sinon → rendre `InspirationStandalonePage` (nouvelle route ou même composant qui branche).

Et dans `pageUrlFor()` de l'edge function :
- `page_kind = 'global'` (ou pas de slug résolu) → `${APP_BASE_URL}/inspiration/${token}` (au lieu de `/?inspiration=…`).

### 4. Vérification finale

- Tester le lien avec un UA WhatsApp via `curl` (`curl -A "WhatsApp/2.23" …`) pour confirmer que `og:image` = `thumbnail_url` de la vidéo après backfill.
- Tester avec un UA navigateur normal → doit voir une 302 vers `/inspiration/<token>` → modale ouverte.
- Prévenir l'utilisateur que WhatsApp met en cache les previews : un lien déjà partagé conservera l'ancien aperçu (regénérer un nouveau lien en repartageant, ou vider le cache via le debugger Facebook — WhatsApp partage le cache Facebook).

## Fichiers touchés

- `supabase/functions/inspiration-preview/index.ts` — 302 pour humains, canonicalUrl `/inspiration/:token` pour items globaux.
- `src/pages/InspirationRedirect.tsx` — branchement global vs page hôte.
- `src/pages/InspirationStandalonePage.tsx` (nouveau) — page autonome avec modale ouverte.
- `src/App.tsx` — ajout/adaptation de la route.
- `src/hooks/useInspirationItems.ts` — backfill client de `thumbnail_url` pour vidéos.
- (Optionnel) `src/pages/Admin/AdminInspiration.tsx` — bouton « Régénérer miniatures ».

Aucune migration DB (`thumbnail_url` existe déjà).
