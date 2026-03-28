

# Plan : Permettre le partage social sans obligation de remplir le formulaire

## Probleme

Le menu de partage (WhatsApp, Facebook, LinkedIn, etc.) n'apparait qu'apres avoir soumis le formulaire avec un numero de telephone obligatoire. L'utilisateur veut pouvoir partager l'invitation sur les reseaux sociaux directement.

## Solution

Ajouter un bouton "Partager sur les reseaux sociaux" visible en permanence sous le formulaire d'invitation (onglet "Invitation"). Ce bouton ouvre directement le menu de partage multi-canal avec un lien d'invitation generique (sans passer par la Edge Function).

### Modifications dans `src/components/InviteFriendsModal.tsx`

1. **Ajouter une fonction `handleShareSocial`** qui genere le lien d'invitation et le prenom de l'utilisateur, puis affiche le menu de partage -- sans appeler `sendInvitation`.

2. **Ajouter un separateur "ou" et un bouton** sous le bouton "Partager l'invitation" dans le formulaire :
   - Divider avec texte "ou partagez directement"
   - Bouton secondaire "Partager sur les reseaux sociaux" qui appelle `handleShareSocial`

3. **Le lien d'invitation** sera `{origin}/auth?invited=true` (le meme lien generique deja utilise). Le menu de partage existant (WhatsApp, Facebook, LinkedIn, Gmail, SMS, Email, Copier le lien) reste inchange.

4. **Le formulaire telephone reste disponible** pour les invitations tracees en base. Le partage social est une option complementaire rapide.

## Fichier modifie

- `src/components/InviteFriendsModal.tsx` -- ajout bouton partage social direct + fonction `handleShareSocial`

