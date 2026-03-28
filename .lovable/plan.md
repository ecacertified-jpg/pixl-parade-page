

# Plan : Lancer la découverte JDV depuis la Landing Page

## Problème

Les boutons "Créer mon anniversaire" et "S'inscrire" de la landing page redirigent directement vers `/auth?tab=signup`. Le visiteur arrive sur un formulaire froid sans voir l'expérience de découverte.

## Solution

Ajouter un paramètre URL `?discovery=true` quand le visiteur vient de la landing page, et déclencher automatiquement le `PreAuthDiscovery` dans Auth.tsx quand ce paramètre est détecté.

## Modifications

### 1. `src/pages/Landing.tsx`

Changer les URLs de navigation des boutons "Créer mon anniversaire" et "S'inscrire" (header + hero + footer) :

```
navigate("/auth?tab=signup")  →  navigate("/auth?tab=signup&discovery=true")
```

3 occurrences : ligne 101, ligne 133, ligne 290.

### 2. `src/pages/Auth.tsx`

Dans l'initialisation du composant, lire le paramètre `discovery` depuis l'URL et déclencher automatiquement `setShowDiscovery(true)` si présent :

```typescript
// Au montage, si ?discovery=true → ouvrir la découverte
useEffect(() => {
  const discoveryParam = searchParams.get('discovery');
  if (discoveryParam === 'true' && !localStorage.getItem('jdv_discovery_seen')) {
    setShowDiscovery(true);
  }
}, []);
```

Le bandeau existant "Découvrez JDV en 30 secondes" reste cliquable manuellement. Le `localStorage` empêche de relancer la découverte si déjà vue.

## Fichiers concernés

| Fichier | Action |
|---------|--------|
| `src/pages/Landing.tsx` | Ajouter `&discovery=true` aux 3 navigations vers signup |
| `src/pages/Auth.tsx` | Lire le param URL et auto-déclencher la découverte |

