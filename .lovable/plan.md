# Afficher l'image OG sur les liens JDV partagés (WhatsApp, Facebook, etc.)

## Diagnostic

WhatsApp, Facebook, LinkedIn, Telegram, etc. ne lancent pas JavaScript : ils lisent **uniquement** le HTML renvoyé par le serveur. Aujourd'hui le site sert `index.html` (avec un `og:image` générique correct) pour la plupart des routes, mais quand on partage un lien dynamique (cagnotte, produit, boutique, événement) ces crawlers reçoivent toujours le même HTML générique — donc soit l'image par défaut, soit rien si elle est en cache négatif.

Des **fonctions edge "preview"** existent déjà côté Supabase et fabriquent un HTML riche (titre, description, image dédiée) en détectant le User-Agent du crawler :
- `birthday-preview` (déjà routé)
- `join-preview` (déjà routé)
- `fund-preview`, `business-preview`, `product-preview`, `home-preview` — **présentes mais non branchées** dans `public/_redirects`.

Aucune fonction n'existe pour les pages d'événements (`/event/:slug`).

C'est la cause principale : les liens de cagnottes, boutiques, produits et page d'accueil n'ont jamais d'aperçu enrichi parce que le serveur n'envoie pas les bonnes balises au crawler.

## Plan

### 1. Brancher les preview functions existantes dans `public/_redirects`

Ajouter, avant la règle catch-all `/*  /index.html  200`, les redirections suivantes vers les edge functions Supabase (chacune détecte déjà le User-Agent et sert soit le HTML enrichi pour les bots, soit une redirection vers le SPA pour les humains) :

```
/f/*            https://vaimfeurvzokepqqqrsl.supabase.co/functions/v1/fund-preview/:splat       200
/b/*            https://vaimfeurvzokepqqqrsl.supabase.co/functions/v1/business-preview/:splat   200
/p/*            https://vaimfeurvzokepqqqrsl.supabase.co/functions/v1/product-preview/:splat    200
```

Pour la home, ne pas intercepter `/` côté `_redirects` (cela casserait le SPA pour les utilisateurs). À la place, vérifier que `index.html` contient déjà un `og:image` valide — c'est le cas (`/og-image.png`).

### 2. Vérifier que chaque preview function renvoie bien :
- `og:title`, `og:description`, `og:url`, `og:type`
- `og:image` **absolue + https**, `og:image:secure_url`, `og:image:type`, `og:image:width`, `og:image:height`
- Variantes `twitter:*`
- Pour les humains (non-crawlers) : redirection 302 vers la même URL côté SPA

Les 4 fonctions existantes respectent déjà ce schéma (vérifié dans le code), donc aucun changement requis.

### 3. (Optionnel) Ajouter un preview pour les pages événement

Routes concernées : `/event/:slug` et `/evenement/:slug`. Aujourd'hui ces liens n'ont aucune image personnalisée. Créer une edge function `event-preview` calquée sur `birthday-preview` (mêmes balises, image générée ou photo de couverture de l'événement), puis ajouter :

```
/event/*        https://vaimfeurvzokepqqqrsl.supabase.co/functions/v1/event-preview/:splat  200
/evenement/*    https://vaimfeurvzokepqqqrsl.supabase.co/functions/v1/event-preview/:splat  200
```

### 4. Invalider le cache WhatsApp / Facebook

WhatsApp et Facebook gardent en cache l'aperçu d'une URL pendant plusieurs semaines. Après déploiement :
- Pour Facebook/WhatsApp : passer l'URL dans le [Sharing Debugger Facebook](https://developers.facebook.com/tools/debug/) → "Scrape Again".
- Pour LinkedIn : [Post Inspector](https://www.linkedin.com/post-inspector/).
- Pour les liens déjà partagés, ajouter un paramètre `?v=2` force WhatsApp à re-télécharger l'aperçu.

## Détails techniques

- **Fichier modifié** : `public/_redirects` (3 lignes ajoutées, ou 5 si l'événement est inclus).
- **Fichier créé (optionnel)** : `supabase/functions/event-preview/index.ts` (copie adaptée de `birthday-preview`).
- **Aucun changement front** : tous les composants de partage continuent d'envoyer les mêmes URLs (`/f/...`, `/b/...`, `/p/...`).
- **Aucune migration DB**.

## Question rapide avant d'implémenter

L'option 3 (créer `event-preview` pour les pages événement) est-elle souhaitée maintenant, ou je me limite à brancher uniquement les previews déjà existantes (cagnotte / boutique / produit) ?
