# Correction de l'aperçu image WhatsApp pour les liens JDV

## Diagnostic

L'image `og-image.png` est bien référencée dans `index.html` et accessible publiquement (HTTP 200). Mais :

- **Poids : 897 KB** → WhatsApp n'affiche fiablement les aperçus que pour des images **< 300 KB** (limite officieuse mais constante). Au-dessus, WhatsApp affiche le lien sans image (exactement ce qu'on voit dans la capture).
- Format PNG 1376×768 — inutilement lourd pour un aperçu social.

Facebook/LinkedIn tolèrent l'image actuelle, mais WhatsApp non — d'où l'incohérence.

## Plan d'action

### 1. Générer une version optimisée de l'image OG
- Créer `public/og-image.jpg` à partir de l'actuelle :
  - Dimensions **1200×630** (ratio 1.91:1, standard OG)
  - Format **JPEG qualité 82**
  - Cible : **< 250 KB** (idéalement 150–200 KB)
- Garder l'ancien PNG en fallback pour compatibilité.

### 2. Mettre à jour `index.html`
- Pointer `og:image`, `og:image:secure_url` et `twitter:image` vers le nouveau `.jpg`
- Mettre à jour `og:image:type` → `image/jpeg`
- Mettre à jour `og:image:width` → `1200` et `og:image:height` → `630`
- Bumper le paramètre `?v=` (ex: `v=20260516`) pour forcer le re-scrape

### 3. Appliquer la même logique aux Edge Functions de preview
Vérifier et corriger si nécessaire les fonctions qui injectent leurs propres `og:image` :
- `birthday-preview`
- `fund-preview`
- `business-preview`
- `product-preview`
- `event-preview`
- `join-preview`

S'assurer qu'elles ne servent jamais une image > 300 KB en fallback (sinon basculer sur la nouvelle `og-image.jpg`).

### 4. Purger les caches sociaux
Après déploiement, dans la page **Admin → Social Preview Debug** (déjà créée précédemment) :
- Re-scraper `https://joiedevivre-africa.com` via l'outil OG Inspector
- Lien direct vers le [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) pour cliquer "Scrape Again"
- Pour WhatsApp : tester le lien dans une nouvelle conversation (WhatsApp re-scrape automatiquement quand l'URL n'a jamais été partagée, ou après ~7 jours, ou si les meta tags changent significativement — le bump `?v=` aide)

## Détails techniques

Commande de génération de l'image optimisée :
```bash
nix run nixpkgs#imagemagick -- public/og-image.png \
  -resize 1200x630^ -gravity center -extent 1200x630 \
  -quality 82 -strip public/og-image.jpg
```

Vérification taille cible :
```bash
ls -lh public/og-image.jpg  # doit être < 300 KB
```

## Hors scope

- Pas de modification du design ou du contenu visuel de l'image.
- Pas de changement des autres meta tags (titre/description sont OK comme le montre la capture).
