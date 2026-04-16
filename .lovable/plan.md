

# Plan : Améliorer les animations de transition de la bottom bar

## Contexte

Actuellement, les onglets ont des transitions CSS basiques (`transition-all duration-200`, `scale-110` sur l'icône active). Le composant `AnimatedPageTransition` existe mais n'est utilisé nulle part. Les routes utilisent `AnimatedRoutes` qui est un wrapper léger sans animation.

## Changements

### 1. Animer la bottom bar elle-même (`src/components/RecentActivitySection.tsx`)

- Ajouter un **indicateur actif animé** (dot ou barre sous l'onglet actif) avec une transition CSS smooth
- Ajouter un effet **spring/bounce** sur l'icône au clic (tap feedback)
- Ajouter une animation de **scale-down au press** (active:scale-90) puis retour
- Améliorer la transition de couleur avec un fond léger animé sur l'onglet actif

### 2. Animer les transitions de page (`src/App.tsx`)

- Wrapper les routes dans `AnimatedPageTransition` avec le mode `fade` pour un fondu fluide entre les pages quand on navigue via la bottom bar

### Détail technique — Bottom bar

```typescript
// Bouton nav avec animations améliorées
<button
  onClick={item.onClick}
  className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl 
    transition-all duration-300 ease-out
    active:scale-90
    hover:bg-primary/5 relative ${
    item.isActive ? "text-primary" : "text-muted-foreground"
  }`}
>
  <div className="relative">
    <item.icon className={`h-6 w-6 transition-all duration-300 ease-out ${
      item.isActive ? "scale-110" : ""
    }`} />
    {/* Dot indicateur animé */}
    {item.isActive && (
      <motion.div 
        layoutId="activeTab"
        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full"
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
    )}
  </div>
</button>
```

### Détail technique — Page transitions

Wrapper le contenu des routes dans `AnimatedPageTransition` au niveau de `App.tsx` :

```tsx
<AnimatedRoutes>
  <Route path="/index" element={
    <AnimatedPageTransition mode="fade" duration={0.2}>
      <Index />
    </AnimatedPageTransition>
  } />
  ...
</AnimatedRoutes>
```

## Fichiers concernés

| Fichier | Action |
|---------|--------|
| `src/components/RecentActivitySection.tsx` | Ajouter motion, indicateur actif animé, tap feedback |
| `src/App.tsx` | Wrapper les routes principales dans `AnimatedPageTransition` |

