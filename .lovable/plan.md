

# Plan : Afficher un message incitatif visible pour chaque étape non complétée

## Principe

Au lieu de simplement afficher un toast quand l'utilisateur tente de passer, afficher un bandeau explicatif et incitatif **en permanence** sous le contenu de chaque étape tant que la condition n'est pas remplie. Ce bandeau disparaît dès que l'étape est complétée.

## Messages par étape

| Étape | Condition | Message affiché |
|-------|-----------|-----------------|
| 1 - Anniversaire | `!birthday` | "📅 Sélectionne ta date d'anniversaire pour que tes proches puissent te célébrer !" |
| 2 - Goûts | `selectedCategories.length < 1` | "🎁 Choisis au moins une catégorie pour qu'on te propose les meilleurs cadeaux !" |
| 3 - Souhaits | `favoriteIds.length < 3` | "❤️ Ajoute au moins 3 articles (X/3 ajoutés) pour créer ta liste de souhaits parfaite !" |

## Modification dans `src/components/OnboardingExperience.tsx`

### 1. Ajouter un composant inline `StepHintBanner`

Un petit bloc animé (`motion.div`) avec :
- Fond `bg-amber-50 dark:bg-amber-900/20`, bordure `border-amber-200`
- Icône d'info et texte incitatif
- Apparaît avec `AnimatePresence` quand `!isStepCompleted(currentStep)`
- Disparaît avec animation quand l'étape est complétée

### 2. Placer le bandeau dans chaque étape (1, 2, 3)

- **Étape 1** : après le sélecteur de date (ligne ~549), avant le bloc `birthday && daysUntilBirthday`
- **Étape 2** : après la grille de catégories (ligne ~623)
- **Étape 3** : après le compteur d'articles (ligne ~661), quand `favoriteIds.length < 3`

### 3. Conserver les toasts comme filet de sécurité

Les toasts restent actifs au clic sur la flèche désactivée, mais le message visible rend le blocage compréhensible sans interaction.

## Fichier concerné

| Fichier | Action |
|---------|--------|
| `src/components/OnboardingExperience.tsx` | Ajouter un bandeau incitatif conditionnel sous chaque étape 1, 2, 3 |

