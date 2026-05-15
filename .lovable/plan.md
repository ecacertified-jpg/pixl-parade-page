
## Objectif

Quand on partage le lien d'une page d'anniversaire (ex: `https://joiedevivre-africa.com/birthday/audrey-amour-eliorah`) sur WhatsApp, Facebook, Instagram, LinkedIn, etc., l'aperçu doit afficher :

- la **photo de couverture** de la page d'anniversaire (comme dans l'image fournie),
- le **titre** « Anniversaire de [Prénom] » (et l'âge si dispo),
- une **description** personnalisée (date, message d'invitation à participer),
- le bon lien canonique.

Aujourd'hui, ça ne marche pas : les crawlers (WhatsApp, Facebook…) n'exécutent pas le JavaScript. Ils ne voient donc que les meta OG génériques du `index.html` (logo JDV + texte landing). Le hook `useBirthdayPageSEO` met bien à jour les meta côté client, mais ils arrivent trop tard pour les bots.

## Solution

Servir une version HTML pré-rendue (juste les meta) aux crawlers via une edge function, sur le même modèle que `join-preview` qui existe déjà dans le projet.

### 1. Edge function `birthday-preview`

Nouvelle fonction Supabase `supabase/functions/birthday-preview/index.ts` qui :

- prend `:slug` en paramètre d'URL,
- lit la page d'anniversaire dans la base (firstName, age, coverImage, celebrationYear, slug, isActive),
- détecte le `User-Agent` :
  - **Crawler social** (`facebookexternalhit`, `WhatsApp`, `Twitterbot`, `LinkedInBot`, `Slackbot`, `Discordbot`, `TelegramBot`, `Pinterest`, `Googlebot`, etc.) → renvoie une page HTML minimale contenant uniquement les balises `<title>`, `og:*`, `twitter:*`, `description` et un `<meta http-equiv="refresh">` vers la vraie URL (au cas où).
  - **Navigateur humain** → `302` vers `/birthday/:slug` côté SPA (URL inchangée pour l'utilisateur).
- garantit `og:image` = URL absolue de la photo de couverture (ou OG image généré, voir §2),
- pose `og:image:width=1200`, `og:image:height=630`, `og:type=profile`, locale `fr_FR`.

### 2. Image OG par défaut si pas de cover

Si la page n'a pas de photo : appeler/réutiliser `generate-og-image` (déjà présent) pour produire une carte 1200×630 avec :

- prénom + âge,
- date d'anniversaire,
- petit visuel JDV (logo, gradient rose/violet de la charte),
- mention « Souhaite-lui un joyeux anniversaire ».

L'URL renvoyée est mise dans `og:image`. Cache 24 h.

### 3. Routage `public/_redirects`

Ajouter avant la règle SPA :

```text
/birthday/*       https://vaimfeurvzokepqqqrsl.supabase.co/functions/v1/birthday-preview/:splat   200
/anniversaire/*   https://vaimfeurvzokepqqqrsl.supabase.co/functions/v1/birthday-preview/:splat   200
```

L'edge function se charge ensuite de différencier bot vs humain. C'est exactement le pattern utilisé pour `/join/ADM-*` → `join-preview`.

### 4. Vérification

- Test avec **Meta Sharing Debugger** (`https://developers.facebook.com/tools/debug/`) sur un lien `/birthday/:slug`.
- Test avec **WhatsApp** : envoyer le lien dans un chat → l'aperçu doit montrer la photo + le titre.
- Test avec **Twitter Card Validator**.
- Vérifier qu'un humain qui clique arrive bien sur la SPA sans flash de page intermédiaire.

## Détails techniques

- Aucune modification du frontend nécessaire — `useBirthdayPageSEO` continue de fonctionner pour l'expérience in-app.
- La fonction doit être **publique** (pas de JWT requis) → ajouter dans `supabase/config.toml` :
  ```toml
  [functions.birthday-preview]
  verify_jwt = false
  ```
- Cache HTTP: `Cache-Control: public, max-age=300, s-maxage=3600` pour soulager la base.
- Échapper proprement le contenu dans les meta (pas d'injection HTML via le prénom).
- Si la page est `is_active = false` ou inexistante : renvoyer une OG « générique JDV » + lien vers la home, pas une 404 (les crawlers de WhatsApp réessayent rarement).

## Hors scope

- Pages business, cagnottes seules, événements (peuvent suivre le même pattern dans un second temps si besoin).
- SSR complet de l'app — on rend juste le `<head>` aux bots, pas le `<body>`.
- Re-validation automatique côté Facebook (peut être ajoutée via un appel à l'API « scrape » après publication d'une page).
