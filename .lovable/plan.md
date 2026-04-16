

# Plan : Reprendre l'onboarding à la dernière étape atteinte

## Problème

Chaque fois que l'utilisateur revient dans l'application, `fetchOnboardingStatus` recalcule la première étape incomplète depuis le début (anniversaire → goûts → souhaits → ...). Si une étape intermédiaire échoue à la vérification (ex: `selected_tastes` non persisté à cause du debounce auto-save qui ne complète pas), l'utilisateur est renvoyé en arrière au lieu de reprendre là où il s'était arrêté.

## Solution

Persister l'étape la plus avancée atteinte par l'utilisateur et toujours reprendre à partir de cette étape, jamais en arrière.

## Changements

### 1. `src/hooks/useOnboarding.ts` — Mémoriser l'étape atteinte

- Sauvegarder `furthestStep` dans `localStorage` (clé `onboarding_step_{userId}`) chaque fois que `setCurrentStep` est appelé avec une valeur supérieure.
- Au calcul de `effectiveCurrentStep`, utiliser `Math.max(firstIncompleteStep, storedFurthestStep)` pour ne jamais reculer.

### 2. `src/components/OnboardingExperience.tsx` — Fiabiliser la sauvegarde des goûts

- Dans `handleNext` (step 2 → step 3), **attendre** le résultat du `.update()` de `selected_tastes` et vérifier qu'il n'y a pas d'erreur avant de passer à l'étape suivante.
- Ajouter un `await` manquant et un toast d'erreur si la sauvegarde échoue.

### 3. `src/components/OnboardingExperience.tsx` — Pré-remplir les états locaux

- Les données chargées depuis la DB (birthday, selected_tastes, favorites) déterminent `isStepCompleted()`. S'assurer que le chargement est complet **avant** d'évaluer les boutons de navigation, en ajoutant un état `dataLoaded` pour éviter de bloquer la navigation sur des données pas encore chargées.

## Fichiers concernés

| Fichier | Changement |
|---------|------------|
| `src/hooks/useOnboarding.ts` | Persister/lire `furthestStep` dans localStorage, utiliser `Math.max` |
| `src/components/OnboardingExperience.tsx` | Await sauvegarde goûts dans handleNext, état `dataLoaded` pour navigation |

## Résultat

L'utilisateur reprend toujours à l'étape la plus avancée qu'il a atteinte, sans jamais être renvoyé en arrière.

