## Objectif
Remplacer l'image actuelle de prévisualisation sur les réseaux sociaux (WhatsApp, Facebook, Twitter, etc.) par l'image du logo Joie de Vivre que vous avez fournie (boîte cadeau rose/violet avec cœur dans une main, sur fond cœur dégradé).

## Ce qui sera modifié

### 1. Remplacer le fichier `public/og-image.png`
Le site utilise actuellement `https://joiedevivre-africa.com/og-image.png` comme image partagée sur tous les réseaux sociaux (Open Graph + Twitter Card). Référencé dans `index.html` :

```html
<meta property="og:image" content="https://joiedevivre-africa.com/og-image.png" />
<meta name="twitter:image" content="https://joiedevivre-africa.com/og-image.png" />
```

L'image fournie (512×512) sera copiée depuis `user-uploads://image-1777166182.png` vers `public/og-image.png`, en remplaçant l'ancienne version.

### 2. Adapter au format recommandé (1200×630)
L'image source est carrée (512×512), mais Open Graph recommande **1200×630** (déjà déclaré dans les meta tags). Pour éviter une image rognée ou floue sur WhatsApp/Facebook, on génèrera une version optimisée :
- Toile finale **1200×630** au format PNG
- Fond cohérent avec l'identité (dégradé doux blanc/rose pâle, comme l'image source)
- Logo centré, taille préservée et nette
- Aucun texte ajouté (le titre/description restent dans les meta tags)

### 3. Vérification post-changement
- Conversion en aperçu pour valider visuellement le rendu final 1200×630
- Vérifier qu'aucune autre référence ne pointe vers une autre image partagée sur la home (les pages spécifiques — anniversaires, cagnottes, produits — gardent leurs propres images dynamiques générées par `generate-og-image`)

## Hors périmètre
- Pas de modification des images partagées spécifiques aux pages dynamiques (anniversaires, cagnottes, boutiques, produits) — elles sont générées automatiquement et restent inchangées
- Pas de changement de favicon ni d'icônes PWA
- Pas de modification des meta titres/descriptions

## Note importante sur le cache
WhatsApp, Facebook et Twitter mettent en cache les images de prévisualisation pendant plusieurs jours. Après le déploiement, vous pourrez forcer le rafraîchissement via :
- **Facebook** : [Sharing Debugger](https://developers.facebook.com/tools/debug/)
- **Twitter/X** : [Card Validator](https://cards-dev.twitter.com/validator)
- **WhatsApp** : ajouter `?v=2` à la fin de l'URL partagée pour bypasser le cache temporairement