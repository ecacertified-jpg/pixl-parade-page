

## Problème

Étape 5 (Amis) bloque l'utilisateur tant que les 3 amis invités n'ont pas eux-mêmes rempli le formulaire — ce qui peut prendre des heures/jours et casse le flux d'onboarding. De plus, le titre contient un point d'exclamation parasite avant l'emoji 💪.

## Corrections

**Fichier** : `src/components/OnboardingExperience.tsx`

### 1. Permettre de passer l'étape 5 (Amis) sans attendre
- **Ligne 598** : remplacer `case 4: return invitationsSentCount >= 3;` par `case 4: return true;` → l'étape devient validable dès qu'on y arrive (l'utilisateur peut continuer même si 0 ami n'a encore rempli le formulaire).
- **Ligne 260** : conserver l'auto-redirection festive quand 3 amis valident (confetti + passage auto), mais permettre aussi le passage manuel via le bouton "Suivant".
- Ajouter un texte d'encouragement sous la barre de progression : « Tu peux continuer dès maintenant — on te notifiera quand tes proches rempliront le formulaire. »

### 2. Corriger le titre (ligne 1108)
- Avant : `Ton cercle d'amis, ta force ! 💪`
- Après : `Ton cercle d'amis, ta force 💪`

## Mémoire à mettre à jour

`mem://auth/onboarding-experience-and-logic` : préciser que l'étape Amis n'est plus bloquante (passage libre), seul le compteur reste informatif et l'auto-redirection se déclenche si 3 amis valident pendant que l'utilisateur est encore sur la page.

## Résultat

L'utilisateur peut progresser dans l'onboarding sans dépendre du remplissage différé de ses amis, tout en gardant la mécanique de récompense (confetti + auto-redirect) si les 3 formulaires arrivent à temps.

