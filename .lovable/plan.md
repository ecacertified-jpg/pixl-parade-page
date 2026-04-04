

# Plan : Bloquer la navigation tant que l'étape n'est pas complétée

## Principe

Chaque étape doit être validée avant de pouvoir avancer. L'utilisateur ne peut pas sauter une étape incomplète.

## Conditions de complétion par étape

| Étape | Condition |
|-------|-----------|
| 0 - Accueil | Toujours complétée (simple écran d'accueil) |
| 1 - Anniversaire | `birthday` est défini |
| 2 - Goûts | Au moins 1 catégorie sélectionnée (`selectedCategories.length >= 1`) |
| 3 - Souhaits | Au moins 3 articles en favoris (`favoriteIds.length >= 3`) |
| 4 - Amis | Géré par l'auto-redirection existante (3 formulaires complétés) |

## Modifications dans `src/components/OnboardingExperience.tsx`

### 1. Ajouter une fonction de validation

```typescript
const isStepCompleted = (step: number): boolean => {
  switch (step) {
    case 0: return true;
    case 1: return !!birthday;
    case 2: return selectedCategories.length >= 1;
    case 3: return favoriteIds.length >= 3;
    case 4: return invitationsSentCount >= 3;
    default: return false;
  }
};

const canGoNext = isStepCompleted(currentStep);
```

### 2. Bloquer la flèche "Suivant" (ChevronRight, lignes 403-418)

- Remplacer `disabled={currentStep >= TOTAL_STEPS - 1}` par `disabled={currentStep >= TOTAL_STEPS - 1 || !canGoNext}`
- Quand désactivé : style grisé au lieu du rouge pulsant
- Au clic sur la flèche désactivée : afficher un toast expliquant ce qu'il faut faire

### 3. Bloquer `handleNext` (ligne 340)

Ajouter un guard en début de fonction :
```typescript
if (!isStepCompleted(currentStep)) {
  toast.info(stepHintMessage(currentStep));
  return;
}
```

### 4. Messages d'aide par étape

```typescript
const stepHintMessage = (step: number): string => {
  switch (step) {
    case 1: return "Sélectionne ta date d'anniversaire pour continuer 🎂";
    case 2: return "Choisis au moins une catégorie de cadeau 🎁";
    case 3: return "Ajoute au moins 3 articles à ta liste de souhaits ❤️";
    default: return "Complete cette étape pour continuer";
  }
};
```

### 5. Indicateur visuel sous chaque étape

Ajouter un petit texte sous le contenu de chaque étape (sauf step 0) indiquant la condition restante, par exemple pour l'étape 3 : "2/3 articles ajoutés".

## Fichier concerné

| Fichier | Action |
|---------|--------|
| `src/components/OnboardingExperience.tsx` | Ajouter validation, bloquer navigation, afficher messages d'aide |

