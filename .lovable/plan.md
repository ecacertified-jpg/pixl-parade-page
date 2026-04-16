

# Plan : Pré-remplir la date d'anniversaire dans l'étape 2 de l'onboarding

## Problème

L'étape "Anniversaire" (step 1) de l'onboarding demande la date d'anniversaire, mais celle-ci a déjà été renseignée dans le formulaire de complétion de profil (`CompleteProfileModal`). L'utilisateur doit re-saisir une info déjà fournie.

## Constat

Le code charge déjà la birthday depuis `profiles` (ligne 129), mais l'UX ne reflète pas que la date est déjà connue : le bouton affiche "Choisir ma date" comme si rien n'était renseigné. En réalité, si `data.birthday` existe, `setBirthday` est appelé et la date s'affiche. Le vrai problème est visuel : l'encouragement "Sélectionne ta date..." s'affiche même si la date est pré-remplie, et il n'y a pas de message confirmant que la date est déjà connue.

## Solution

Modifier l'étape 1 pour :
1. **Afficher la date pré-remplie** avec un message de confirmation ("C'est bien ta date ?") si elle vient du profil
2. **Garder le calendrier modifiable** pour corriger si besoin
3. **Afficher un message différent** selon que la date est pré-remplie ou non :
   - Pré-remplie : "📅 Date trouvée ! Tu peux la modifier si besoin."
   - Non remplie : Le message actuel d'incitation

## Détail technique

### Fichier : `src/components/OnboardingExperience.tsx`

- Ajouter un state `birthdayPreFilled` (boolean) initialisé à `true` si `data.birthday` existe au chargement (lignes 129-133)
- Modifier l'affichage de l'étape 1 (lignes 766-777) : si `birthday` est déjà défini ET `birthdayPreFilled`, afficher un badge vert "✅ Date trouvée depuis ton profil" au lieu du message d'incitation jaune
- Le titre change en "C'est bien ta date ? 🎂" si pré-rempli, sinon reste "Quand est ton anniversaire ? 🎂"

| Fichier | Action |
|---------|--------|
| `src/components/OnboardingExperience.tsx` | Ajouter `birthdayPreFilled` state + adapter l'UI step 1 |

