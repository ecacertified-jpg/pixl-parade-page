## Changements page d'événement

### 1. Bouton "Voir la liste" + modale "Ma liste de souhaits"
Dans `src/components/event/EventWishlistSection.tsx` :
- Ajouter un bouton **"Voir la liste"** (icône œil) à côté de "+ Ajouter" dès que `items.length > 0`.
- Créer une modale `EventWishlistViewerModal` qui réutilise le style de la capture (titre "Ma liste de souhaits", compteur d'articles, cartes produit avec image/nom/prix, bouton "Créer" par article + bouton "Retour").
- Le bouton "Créer" sur un article ouvre la cagnotte préremplie avec cet article (réutilise `ExternalProductFundModal` ou `ShopForCollectiveGiftModal` selon le type).

### 2. Brancher la modale sur "Nouvelle cagnotte" et "Créer une cagnotte"
Dans la section `EventCollectiveFundSection` (composant qui affiche le bloc "Cadeau collectif") :
- Les deux CTA **"+ Nouvelle cagnotte"** et **"Créer une cagnotte"** ouvrent désormais d'abord la modale `EventWishlistViewerModal` (mode "choisir un article").
- Si la liste est vide, fallback : ouvrir directement le catalogue (`/wishlist-catalog?eventId=...&returnTo=/event/:slug`) comme aujourd'hui.
- Sinon : l'utilisateur choisit l'article → ouverture de la modale de création de cagnotte préremplie.

### 3. Audit PWA + performances mobile
- Vérifier la présence d'un Service Worker + manifest (`public/manifest.json`, `vite-plugin-pwa` ou SW custom). Le fichier `OneSignalSDKWorker.js` existe mais ce n'est que la SW push, pas une PWA d'app shell.
- Si la PWA n'est pas installée : ajouter `vite-plugin-pwa` avec :
  - `registerType: 'autoUpdate'`, manifest complet (nom, icônes 192/512, theme_color, background_color, display standalone).
  - Workbox runtime caching : images Supabase Storage (CacheFirst 30j), fonts Google (CacheFirst 1an), API Supabase REST (NetworkFirst court).
  - Précaching du shell (HTML, JS, CSS hashés).
- Quick wins perfs mobile (séparés du PWA) :
  - `loading="lazy"` + `decoding="async"` sur images non critiques (cartes catalogue, avatars feed).
  - Code splitting routes lourdes (`Admin/*`, `Souvenirs*`, `WishlistCatalog`) via `React.lazy` si non déjà fait.
  - Compression images upload (déjà `compressImage.ts`) — vérifier qu'elle est branchée partout.

## Détails techniques
- Nouveau composant : `src/components/event/EventWishlistViewerModal.tsx` (Dialog shadcn, liste scrollable, props : `items`, `onPickItem`, `onClose`).
- `EventWishlistSection` expose un mode "viewer" déclenchable depuis le parent (lift d'état dans `EventPage.tsx`) pour que `EventCollectiveFundSection` puisse aussi l'ouvrir.
- Réutilisation : `ExternalProductFundModal` accepte déjà un `preset` (cf. mémoire `jumia-external-wishlist`).
- Si `vite-plugin-pwa` est absent : `bun add -D vite-plugin-pwa` puis configuration dans `vite.config.ts`. Aucune migration DB requise.

## Hors scope
- Refonte complète du catalogue.
- Optimisations serveur Supabase (slow queries) — à traiter séparément si tu veux.
