
# Corriger l'erreur "Veuillez respecter le format requis" sur le champ anniversaire

## Cause du probleme

Le composant `BirthdayPicker` utilise un `<Input>` avec l'attribut `pattern="[0-9]*"` (pour forcer le pave numerique sur mobile). Cependant, la valeur saisie contient des barres obliques (ex: "02/06/1978"), ce qui ne correspond pas au pattern `[0-9]*` (chiffres uniquement).

Quand le formulaire est soumis, la **validation HTML5 native du navigateur** detecte cette incompatibilite et affiche le message "Veuillez respecter le format requis" -- avant meme que `react-hook-form` ne prenne le relais.

## Solution

Ajouter l'attribut `noValidate` sur les balises `<form>` dans `Auth.tsx` pour desactiver la validation HTML5 native et laisser `react-hook-form` + `zod` gerer toute la validation.

C'est une pratique standard quand on utilise `react-hook-form` car la librairie gere deja la validation cote JavaScript.

## Fichiers impactes

### `src/pages/Auth.tsx`

Ajouter `noValidate` aux deux formulaires d'inscription :

1. **Formulaire telephone** (ligne 1334) :
   - `<form onSubmit={signUpForm.handleSubmit(handleSignUpSubmit)} className="space-y-4">` 
   - devient `<form onSubmit={signUpForm.handleSubmit(handleSignUpSubmit)} className="space-y-4" noValidate>`

2. **Formulaire email** (chercher le deuxieme `<form>` du signup par email) :
   - Meme ajout de `noValidate`

Aucun autre changement n'est necessaire. La validation `zod` existante continuera de fonctionner normalement.
