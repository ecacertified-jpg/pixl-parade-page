

# Ajouter l'indicateur de progression sur l'inscription Business par Email

## Probleme

L'indicateur de progression (`SignupProgressIndicator`) est uniquement affiche pour l'inscription par **telephone** (ligne 1601 de `BusinessAuth.tsx`). Le formulaire d'inscription par **email** (ligne 1651) n'en a pas.

## Solution

### 1. Creer un `EmailSignupProgressIndicator` dans `BusinessAuth.tsx`

Nouveau composant qui suit le meme design que `SignupProgressIndicator` mais adapte aux champs du formulaire email :

- **Champs suivis** : firstName, lastName, businessName, email, password
- **5 etapes visuelles** : Identite, Business, Email, Mot de passe, Validation
- **Barre de progression** : meme style (verte a 100%)

Logique de calcul :
- `firstName` rempli (>= 2 caracteres) : +1
- `lastName` rempli (>= 2 caracteres) : +1
- `businessName` rempli (>= 2 caracteres) : +1
- `email` valide : +1
- `password` valide (>= 8 caracteres) : +1

### 2. Inserer le composant avant le formulaire email

Ajouter `<EmailSignupProgressIndicator emailSignUpForm={emailSignUpForm} />` juste avant le `<form>` dans le bloc email (ligne 1651), exactement comme c'est fait pour le telephone a la ligne 1601.

## Fichier impacte

- **Modifie** : `src/pages/BusinessAuth.tsx`
  - Ajout du composant `EmailSignupProgressIndicator` (apres `SignupProgressIndicator`, ~ligne 95)
  - Insertion du composant dans le rendu du formulaire email (~ligne 1651)

