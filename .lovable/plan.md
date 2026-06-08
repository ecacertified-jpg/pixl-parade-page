# Plan — JDV PWA Premium (Mobile-First, Afrique)

L'app a déjà `vite-plugin-pwa` + manifest basique + `Install.tsx` + `InstallBanner.tsx` + `useOfflineData`. Ce plan **enrichit** sans casser l'existant. Aucun changement métier — uniquement frontend/PWA/UX.

## 1. Manifest enrichi (`vite.config.ts`)
- Ajouter `id`, `dir: "ltr"`, `prefer_related_applications: false`
- `shortcuts` : Accueil, Cagnottes, Anniversaires, Boutique (accès rapide depuis icône home)
- `screenshots` (mobile + desktop, `form_factor`) → améliore install prompt Chrome/Edge
- `display_override: ["standalone", "minimal-ui"]`
- `launch_handler: { client_mode: "navigate-existing" }` (évite doublons d'onglets)
- `protocol_handlers` + `share_target` (recevoir partages WhatsApp/photos vers `/share`)

## 2. Splash screens iOS
- Ajouter `<link rel="apple-touch-startup-image">` pour iPhone SE/12/13/14/15 Pro Max (8 tailles)
- `apple-mobile-web-app-status-bar-style: black-translucent`
- `apple-mobile-web-app-title: "JDV"`

## 3. Icônes adaptatives
- Vérifier `pwa-192`, `pwa-512`, `pwa-maskable-512` existent (sinon générer via imagegen)
- Ajouter favicon SVG monochrome (déjà présent)

## 4. Service Worker — cache intelligent Afrique (réseau faible)
Étendre `workbox.runtimeCaching` dans `vite.config.ts` :
- **HTML navigations** : `NetworkFirst` avec `networkTimeoutSeconds: 2` (au lieu de 3) → bascule offline plus vite
- **API Supabase REST (profiles, contacts, businesses)** : `StaleWhileRevalidate` 24h → affichage instantané même 2G
- **Storage images** : `CacheFirst` 30 jours + `expiration.purgeOnQuotaError: true`
- **Edge functions GET** (OG, previews) : `StaleWhileRevalidate` 1h
- Ajouter `navigationPreload` activé
- `globPatterns` inclure `webp,avif`

## 5. Page offline dédiée
- Créer `public/offline.html` — page jolie en français, branding JDV, message rassurant + bouton "Réessayer"
- Workbox `navigateFallback: '/offline.html'` quand pas de cache

## 6. UX émotionnelle
- Créer `src/components/pwa/UpdateToast.tsx` : toast chaleureux "Nouvelle version disponible ✨" avec bouton "Actualiser" (remplace le `updateSW(true)` auto-brutal dans `main.tsx` qui interrompt l'utilisateur)
- Créer `src/components/pwa/OfflineIndicator.tsx` : badge flottant "Mode hors-ligne 🌙" avec fade-in doux quand `navigator.onLine === false`
- Créer `src/components/pwa/NetworkQualityHint.tsx` : utilise `navigator.connection` (effectiveType `2g`/`slow-2g`) → bannière douce "Connexion lente détectée, mode économie activé 💛"
- Animations Tailwind : `animate-fade-in`, `animate-scale-in` déjà disponibles

## 7. Optimisation batterie & réseau faible
- Hook `src/hooks/useDataSaver.ts` : détecte `connection.saveData` ou `effectiveType === '2g'` → expose `isLowData` aux composants pour skip vidéos auto-play, images HD, animations lourdes
- Hook `src/hooks/usePageVisibility.ts` : pause polling/intervals quand onglet caché (économie batterie)
- Lazy load images via `loading="lazy"` + `decoding="async"` (à documenter, pas forcer refacto massif)

## 8. Mobile-first & viewport
- Vérifier `<meta name="viewport">` avec `viewport-fit=cover` (notch iPhone)
- Ajouter `theme-color` adaptatif light/dark via `<meta media="(prefers-color-scheme)">`
- `<meta name="mobile-web-app-capable" content="yes">`

## 9. Web Share API
- Hook `src/hooks/useNativeShare.ts` : fallback gracieux si `navigator.share` indisponible → copie presse-papier (cohérent avec stratégie mémoire viral-sharing)

## 10. Push notifications (préparation future)
- Pas d'implémentation maintenant (hors scope), mais le SW Workbox supporte déjà via `importScripts` futur
- Documenter dans `BIRTHDAY_CRON_SETUP.md` la marche à suivre

---

## Fichiers créés/modifiés

**Modifiés** :
- `vite.config.ts` — manifest enrichi + runtimeCaching optimisé
- `index.html` — splash iOS, meta tags mobile, theme-color
- `src/main.tsx` — registration SW non-brutale (callback vers toast)
- `src/App.tsx` — monter `<UpdateToast>`, `<OfflineIndicator>`, `<NetworkQualityHint>`

**Créés** :
- `public/offline.html`
- `src/components/pwa/UpdateToast.tsx`
- `src/components/pwa/OfflineIndicator.tsx`
- `src/components/pwa/NetworkQualityHint.tsx`
- `src/hooks/useDataSaver.ts`
- `src/hooks/usePageVisibility.ts`
- `src/hooks/useNativeShare.ts`

**Non touché** : logique métier, Supabase, edge functions, routing, Wave/abonnements (Lot 3 livré).

---

## Garde-fous
- SW déjà guardé par `vite-plugin-pwa autoUpdate` — pas de double registration
- Preview Lovable : SW ne s'enregistre qu'en PROD (vérifié dans `main.tsx`)
- Pas de cache-busting agressif — `NetworkFirst` sur navigations garantit fraîcheur HTML
- Cohérent avec mémoire `[Active business]` et `[Hybrid country immersion]`

Confirme et je build dans la foulée.