

# Plan : Remplacer les dots par des fleches de navigation

## Probleme

Les dots indicateurs d'etape sont peu visibles et peu intuitifs. L'utilisateur ne les identifie pas comme elements de navigation.

## Solution

Remplacer la zone dots + labels (lignes 226-254) par une barre de navigation compacte avec :
- Une fleche gauche (ChevronLeft) pour reculer
- Le label de l'etape courante + compteur (ex: "Anniversaire · 2/5")
- Une fleche droite (ChevronRight) pour avancer

Les fleches respectent la meme logique : on peut reculer si `currentStep > 0`, avancer si `currentStep < TOTAL_STEPS - 1`.

## Modification dans `src/components/OnboardingExperience.tsx`

### Remplacement lignes 226-254

```tsx
<div className="flex items-center justify-center gap-4 mt-3">
  <button
    onClick={() => currentStep > 0 && onSetStep(currentStep - 1)}
    disabled={currentStep === 0}
    aria-label="Étape précédente"
    className={cn(
      'p-1.5 rounded-full transition-all duration-200',
      currentStep > 0
        ? 'text-primary hover:bg-primary/10 cursor-pointer'
        : 'text-muted-foreground/30 cursor-not-allowed'
    )}
  >
    <ChevronLeft className="h-5 w-5" />
  </button>

  <span className="text-sm font-nunito text-foreground/70 min-w-[8rem] text-center">
    {['Accueil', 'Anniversaire', 'Goûts', 'Amis', 'Ma page'][currentStep]}
    <span className="text-muted-foreground/50 ml-1.5 text-xs">
      {currentStep + 1}/{TOTAL_STEPS}
    </span>
  </span>

  <button
    onClick={() => currentStep < TOTAL_STEPS - 1 && onSetStep(currentStep + 1)}
    disabled={currentStep >= TOTAL_STEPS - 1}
    aria-label="Étape suivante"
    className={cn(
      'p-1.5 rounded-full transition-all duration-200',
      currentStep < TOTAL_STEPS - 1
        ? 'text-primary hover:bg-primary/10 cursor-pointer'
        : 'text-muted-foreground/30 cursor-not-allowed'
    )}
  >
    <ChevronRight className="h-5 w-5" />
  </button>
</div>
```

### Import

Ajouter `ChevronLeft, ChevronRight` aux imports de `lucide-react` (deja partiellement present avec ArrowLeft/ArrowRight).

## Fichier concerne

| Fichier | Action |
|---------|--------|
| `src/components/OnboardingExperience.tsx` | Remplacer dots par fleches + label |

