

# Plan : Animation pulse sur la fleche "Avant" (ChevronRight)

## Modification dans `src/components/OnboardingExperience.tsx`

### Ligne 259 — Ajouter une animation de rebond horizontal sur l'icone ChevronRight

Remplacer :
```tsx
<ChevronRight className="h-5 w-5" />
```

Par :
```tsx
<ChevronRight className="h-5 w-5 animate-[bounce-right_1.5s_ease-in-out_infinite]" />
```

L'animation ne s'applique que si le bouton n'est pas desactive (`currentStep < TOTAL_STEPS - 1`).

### Ajouter le keyframe `bounce-right` dans `src/index.css`

```css
@keyframes bounce-right {
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(4px); }
}
```

Un mouvement subtil vers la droite (4px) en boucle, indiquant visuellement la direction "avant".

## Fichiers concernes

| Fichier | Action |
|---------|--------|
| `src/components/OnboardingExperience.tsx` | Animation conditionnelle sur ChevronRight |
| `src/index.css` | Ajout keyframe `bounce-right` |

