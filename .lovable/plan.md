

# Plan : Ajouter la navigation cliquable entre les etapes de l'onboarding

## Probleme

Les dots indicateurs d'etape (ligne 226-236 de `OnboardingExperience.tsx`) sont de simples `div` non cliquables. L'utilisateur ne peut naviguer qu'avec "Retour" et "Continuer" en bas, sans pouvoir sauter directement a une etape.

## Solution

Transformer les dots en `button` cliquables qui appellent `onSetStep(index)`, et ajouter des labels d'etape visibles pour guider l'utilisateur.

## Modification dans `src/components/OnboardingExperience.tsx`

### 1. Dots cliquables (lignes 226-236)

Remplacer les `div` par des `button` avec `onClick={() => onSetStep(i)}` et un `aria-label`. Permettre de naviguer vers n'importe quelle etape deja visitee ou la suivante (pas sauter 3 etapes d'un coup).

```tsx
<div className="flex justify-center gap-2 mt-3">
  {[...Array(TOTAL_STEPS)].map((_, i) => (
    <button
      key={i}
      onClick={() => i <= currentStep + 1 && onSetStep(i)}
      disabled={i > currentStep + 1}
      aria-label={`Etape ${i + 1}`}
      className={cn(
        'h-2 rounded-full transition-all duration-300',
        i === currentStep ? 'w-8 bg-primary' : 
        i < currentStep ? 'w-2 bg-green-500 cursor-pointer hover:scale-150' : 
        i === currentStep + 1 ? 'w-2 bg-muted cursor-pointer hover:bg-primary/40' :
        'w-2 bg-muted opacity-50 cursor-not-allowed'
      )}
    />
  ))}
</div>
```

### 2. Labels d'etapes sous les dots

Ajouter les noms des etapes en petit texte pour que l'utilisateur sache ou il va :

```tsx
<div className="flex justify-center gap-2 mt-1">
  {['Accueil', 'Anniversaire', 'Gouts', 'Amis', 'Ma page'].map((label, i) => (
    <span key={i} className={cn(
      'text-[9px] font-nunito transition-colors',
      i === currentStep ? 'text-primary font-medium' : 'text-muted-foreground/50'
    )}>
      {label}
    </span>
  ))}
</div>
```

## Fichier concerne

| Fichier | Action |
|---------|--------|
| `src/components/OnboardingExperience.tsx` | Dots cliquables + labels d'etapes |

