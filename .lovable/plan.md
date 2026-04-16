

# Plan : Corriger la navigation Profil et Accueil dans la bottom bar

## Problème

1. **"Profil"** navigue vers `/dashboard` mais si l'utilisateur y est déjà, rien ne se passe
2. **"Accueil"** navigue vers `/` (Landing publique) au lieu de `/index` (accueil authentifié)
3. L'état actif d'Accueil vérifie `pathname === "/"` — ne détecte jamais `/index`

## Changements — `src/components/RecentActivitySection.tsx`

### 1. Corriger "Accueil" → `/index`

```typescript
// Avant
{ icon: Home, label: "Accueil", 
  isActive: location.pathname === "/",
  onClick: () => navigate("/") }

// Après
{ icon: Home, label: "Accueil", 
  isActive: location.pathname === "/" || location.pathname === "/index",
  onClick: () => navigate("/index") }
```

### 2. Corriger "Profil" → forcer le scroll en haut si déjà sur /dashboard

```typescript
// Avant
{ icon: User, label: "Profil", 
  isActive: location.pathname === "/dashboard",
  onClick: () => navigate("/dashboard") }

// Après
{ icon: User, label: "Profil", 
  isActive: location.pathname === "/dashboard",
  onClick: () => {
    if (location.pathname === "/dashboard") {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate("/dashboard");
    }
  }
}
```

## Fichier concerné

| Fichier | Action |
|---------|--------|
| `src/components/RecentActivitySection.tsx` | Corriger navigation Accueil et Profil |

