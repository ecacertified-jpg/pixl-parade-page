

# Plan : Refonte de l'étape "Amis" avec objectif 3 amis et accès automatique au dashboard

## Résumé

Remplacer l'étape 4 actuelle (simple envoi de formulaire) par une expérience engageante avec un message incitatif, un compteur visuel d'amis ajoutés (objectif 3), et une redirection automatique vers le dashboard une fois l'objectif atteint.

## Comportement cible

```text
Étape 5 : Amis
┌─────────────────────────────────────┐
│  👥 (icône)                         │
│                                     │
│  "Ton cercle d'amis, ta force !"    │
│                                     │
│  Message incitatif expliquant       │
│  pourquoi ajouter 3 amis            │
│                                     │
│  ●●○  2/3 amis ajoutés             │
│  [████████░░░░] barre de progrès    │
│                                     │
│  [Générer un lien d'invitation]     │
│  → partage WhatsApp / SMS / copie   │
│                                     │
│  Quand 3 atteints :                 │
│  🎉 Confettis auto + message bravo  │
│  → Redirection auto vers /dashboard │
│  après 2.5 secondes                 │
└─────────────────────────────────────┘
```

## Modifications dans `src/components/OnboardingExperience.tsx`

### 1. Nouveau message incitatif (remplace le texte actuel)
- Titre : "Ton cercle d'amis, ta force ! 💪"
- Sous-titre explicatif : "Ajoute au moins 3 proches pour ne manquer aucun anniversaire. Plus ton cercle est grand, plus tu recevras de surprises !"
- Ton chaleureux et motivant

### 2. Compteur visuel d'amis (nouveau)
- 3 cercles/dots indiquant la progression (remplis au fur et mesure)
- Barre de progression `invitationsSentCount / 3`
- Texte "{n}/3 amis invités"

### 3. Logique d'auto-complétion (nouveau)
- Quand `invitationsSentCount >= 3` :
  - Lancer confettis automatiquement
  - Afficher message de félicitations "Bravo ! Ton cercle est prêt 🎉"
  - `setTimeout` de 2.5s puis appeler `onComplete()` automatiquement
  - Pas de bouton "Accéder au dashboard" — c'est automatique

### 4. Suppression
- Retirer le bouton "ACCÉDER À MON TABLEAU DE BORD" conditionné par `invitationsSentCount > 0`
- Retirer le bouton "Découvrir mon espace" du footer pour la dernière étape (remplacé par l'auto-redirection)

### 5. Le bouton footer de la dernière étape
- Devient "Passer cette étape" (style ghost/discret) pour permettre de skip si l'utilisateur ne veut pas inviter maintenant

## Fichier concerné

| Fichier | Action |
|---------|--------|
| `src/components/OnboardingExperience.tsx` | Refonte du bloc step 4, ajout compteur, auto-complétion à 3 invitations |

