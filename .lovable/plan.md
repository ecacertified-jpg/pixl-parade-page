

# Plan : Corriger le parcours "Anniversaire d'un proche" (Step 5)

## Constat

Après vérification du code et des 3 parcours :

- **Mon anniversaire** ✅ — Fonctionne correctement. L'étape 5 crée une page d'anniversaire pour l'utilisateur connecté.
- **Un autre événement** ✅ — Fonctionne correctement. L'étape 5 affiche le sélecteur d'occasion et redirige vers `/event/create?occasion=X`.
- **Anniversaire d'un proche** ⚠️ **Bug** — Le texte dit "Crée une page pour ton proche" mais le bouton appelle `handleCreateBirthdayPage()` qui crée une page pour **l'utilisateur connecté** (pas pour un proche). C'est identique au parcours "Mon anniversaire".

## Correction proposée

Pour le parcours `friend_birthday`, le bouton "Créer la page de mon proche" doit naviguer vers un flow de création de page d'anniversaire **pour un contact**, similaire au parcours `other_event` :

### Fichier : `src/components/OnboardingExperience.tsx`

1. **Modifier le `onClick` du bouton "Créer page"** pour le cas `isFriendPurpose` :
   - Au lieu d'appeler `handleCreateBirthdayPage()`, appeler `onComplete()` puis naviguer vers une page de création adaptée
   - Deux options possibles :
     - **Option A** : Naviguer vers `/event/create?occasion=birthday&for=friend` (réutiliser le flow événement avec occasion "birthday")
     - **Option B** : Créer la page d'anniversaire directement mais avec un formulaire demandant le nom et la date du proche

2. **Option retenue : Option A** (plus simple, réutilise l'existant) :
   - Quand `isFriendPurpose`, le bouton "Créer" fait `onComplete()` puis `window.location.href = '/event/create?occasion=birthday'`
   - Ajouter `birthday` comme occasion dans `CreateEventPage.tsx` avec emoji 🎂 et label "Anniversaire d'un proche"

### Fichier : `src/pages/CreateEventPage.tsx`

- Ajouter l'occasion `{ key: 'birthday', emoji: '🎂', label: "Anniversaire d'un proche" }` dans le tableau `occasions`

| Fichier | Action |
|---------|--------|
| `src/components/OnboardingExperience.tsx` | Rediriger vers `/event/create?occasion=birthday` quand `isFriendPurpose` |
| `src/pages/CreateEventPage.tsx` | Ajouter l'occasion `birthday` au sélecteur |

