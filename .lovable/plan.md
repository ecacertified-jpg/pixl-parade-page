
# Ameliorer le message d'erreur "User already registered"

## Probleme

Quand un utilisateur tente de s'inscrire avec un email deja enregistre (ex: tiafrancoise76@gmail.com), Supabase renvoie l'erreur brute en anglais "User already registered". Ce message est affiche tel quel dans le toast, ce qui n'est pas convivial.

## Solution

Detecter cette erreur specifique et afficher un message en francais clair, avec une suggestion de se connecter.

## Modification

### Fichier : `src/pages/Auth.tsx`

Dans la fonction `handleEmailSignUp`, au niveau du bloc `if (error)` (lignes 831-837), remplacer l'affichage brut par une detection de l'erreur :

- Si `error.message` contient "User already registered" ou si le code erreur est `user_already_exists` :
  - Titre : "Compte existant"
  - Description : "Un compte existe deja avec cet email. Veuillez vous connecter."
  - Basculer automatiquement sur l'onglet connexion (`setAuthMode('signin')`)
- Sinon : afficher le message d'erreur generique comme avant

### Resultat attendu

Au lieu du toast rouge "User already registered", l'utilisateur verra un message francais clair et sera redirige vers l'onglet connexion.
