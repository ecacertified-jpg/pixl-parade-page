---
name: PWA premium mobile-first
description: Manifest enrichi (shortcuts, launch_handler), runtime caching optimisé Afrique (StaleWhileRevalidate sur Supabase REST/edge previews, navigate timeout 2s, offline.html), UX douce (UpdateToast, NetworkQualityHint), hooks useDataSaver/usePageVisibility/useNativeShare
type: feature
---
JDV PWA premium :
- Manifest : shortcuts (Accueil, Cagnottes, Anniversaires, Boutique), `launch_handler.navigate-existing`, `display_override`, `id`.
- Workbox : NetworkFirst HTML 2s timeout, `navigateFallback: /offline.html`, StaleWhileRevalidate sur supabase REST (profiles/contacts/business_*) 24h et edge previews 1h, CacheFirst images 30j avec purgeOnQuotaError.
- iOS : `apple-mobile-web-app-status-bar-style: black-translucent`, title court "JDV", apple-touch-startup-image.
- Theme color adaptatif light/dark via media query.
- `src/main.tsx` dispatch `pwa:need-refresh` au lieu de reload brutal ; `UpdateToast` (sonner action) écoute et propose Actualiser.
- `NetworkQualityHint` : bannière 8s si saveData/2g (effectiveType via `navigator.connection`).
- Hooks réutilisables : `useDataSaver` (isLowData), `usePageVisibility`, `useNativeShare` (fallback clipboard cohérent stratégie virale).
- Composants montés dans `App.tsx` à côté de `OfflineIndicator` existant.
- `public/offline.html` : page hors-ligne brandée JDV (gradient pastel, bouton Réessayer).