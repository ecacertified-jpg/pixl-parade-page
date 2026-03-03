
# Accelerer l'affichage initial avec le lazy loading

## Probleme

`App.tsx` importe **~90 pages de maniere synchrone** (eager imports). Avant d'afficher quoi que ce soit -- meme la simple page Landing -- le navigateur doit telecharger et parser l'integralite du code de l'application : Dashboard (1086 lignes + 50 composants), toutes les pages Admin, Shop, etc.

Resultat : ecran blanc pendant plusieurs secondes.

## Solution

Convertir tous les imports de pages en `lazy()` sauf les pages critiques du premier affichage (Landing, Auth). Cela permet a Vite de creer des chunks separes : seul le code de la page visitee est telecharge.

## Changements

### Fichier : `src/App.tsx`

1. **Garder en import direct** (pages du premier rendu, petites) :
   - `Landing`, `Auth`, `NotFound`

2. **Convertir en `lazy()`** toutes les autres pages (~85 imports) :
   - Dashboard, Home, Index, Shop, Favorites, etc.
   - Toutes les pages Admin (deja partiellement lazy pour quelques-unes)
   - BusinessAuth, BusinessDashboard, Orders, etc.

3. **Wrapper chaque route lazy** avec `<Suspense fallback={<LoadingTransition />}>` en utilisant le composant `LoadingTransition` deja existant dans le projet

```text
Avant :
  import Dashboard from "./pages/Dashboard"     // charge immediatement
  import Shop from "./pages/Shop"               // charge immediatement
  import AdminDashboard from "./pages/Admin/..." // charge immediatement
  ... x90

Apres :
  const Dashboard = lazy(() => import("./pages/Dashboard"))
  const Shop = lazy(() => import("./pages/Shop"))
  const AdminDashboard = lazy(() => import("./pages/Admin/..."))
  ... code splitte en chunks
```

### Impact attendu

- **Bundle initial** : reduit de ~80% (seuls Landing + Auth + framework)
- **Temps d'affichage** : de plusieurs secondes a moins d'1 seconde
- **Navigation** : chaque page charge son chunk a la demande avec un spinner anime
- **Cache navigateur** : les chunks sont caches individuellement par Vite

### Fichier modifie

1. `src/App.tsx` -- conversion des imports en lazy + wrapping Suspense
