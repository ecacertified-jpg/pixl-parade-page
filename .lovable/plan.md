

# Plan : Corriger l'erreur "Partager l'invitation" sans email

## Probleme

Le formulaire d'invitation rend l'**email optionnel** et le **telephone obligatoire**, mais la Edge Function `send-invitation` **exige un email valide** (ligne 57). Quand l'utilisateur soumet avec seulement un numero de telephone, `invitee_email` est `undefined` et la fonction retourne une erreur 400.

## Solution

Rendre l'email optionnel dans la Edge Function et adapter le flux :

### 1. Edge Function `send-invitation/index.ts`

- **Ligne 57** : Ne valider l'email que s'il est fourni. Si ni email ni phone ne sont presents, retourner une erreur.
- **Ligne ~80-120** : Ne pas envoyer d'email Resend si `invitee_email` est absent — creer quand meme l'invitation en base avec le phone uniquement.
- L'insertion dans `invitations` utilise `invitee_email: invitee_email || null`.

### 2. Composant `InviteFriendsModal.tsx`

- **Ligne 68