

# Plan : Remplacer "Communauté" par "Profil" dans la bottom bar

## Problème

L'utilisateur veut supprimer l'onglet "Communauté" de la barre de navigation inférieure et le remplacer par un onglet "Profil" qui ouvre le menu profil (actuellement accessible uniquement via l'icône en haut à droite).

## Changement — `src/components/RecentActivitySection.tsx`

Remplacer le dernier élément du tableau `navItems` (lignes 112-117) :

```typescript
// Avant
{ 
  icon: Users,
  label: "Communauté", 
  isActive: location.pathname === "/community",
  onClick: () => navigate("/community")
}

// Après
{ 
  icon: User,
  label: "Profil", 
  isActive: location.pathname === "/dashboard",
  onClick: () => navigate("/dashboard")
}
```

Ajouter `User` à l'import depuis `lucide-react` (ligne 1).

## Fichier concerné

| Fichier | Action |
|---------|--------|
| `src/components/RecentActivitySection.tsx` | Remplacer l'entrée Communauté par Profil, naviguer vers `/dashboard` |

