

## Plan : Refonte du formulaire "Inviter des amis"

### Modifications dans `src/components/InviteFriendsModal.tsx`

**1. Réorganiser les champs** : Placer "Numéro de téléphone" en premier, puis "Adresse email" en dessous.

**2. Rendre le téléphone obligatoire** : Retirer "(optionnel)" du label, ajouter `required`, valider le format avant envoi.

**3. Remplacer le bouton "Envoyer l'invitation" par un menu de partage multi-canal** :
- Le bouton "Envoyer l'invitation" ouvre un menu de partage (similaire à `ReferralShareMenu`)
- Canaux disponibles : WhatsApp, Facebook, LinkedIn, Gmail, SMS, Email classique, Copier le lien, Partage natif
- Le message de partage inclut le lien d'invitation généré avec le numéro/email saisis
- L'invitation est d'abord enregistrée en base via `sendInvitation`, puis le menu de partage s'ouvre pour diffuser le lien

**4. Rendre l'email optionnel** : Inverser la logique -- le téléphone devient obligatoire, l'email devient optionnel. Adapter la validation dans `handleSubmit`.

### Composants impactés
- `src/components/InviteFriendsModal.tsx` -- seul fichier modifié

