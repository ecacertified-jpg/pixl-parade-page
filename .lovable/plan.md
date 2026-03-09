

## Plan : Partage du formulaire "Ajouter un ami" pour auto-remplissage

### Concept

L'utilisateur peut partager un lien vers une page publique de formulaire. Le proche clique sur le lien et remplit ses infos (nom, téléphone, date d'anniversaire, etc.). Les données pré-remplies par l'utilisateur original (nom, relation) sont encodées dans l'URL. Une fois soumis, le contact est ajouté automatiquement au compte de l'utilisateur original.

### Modifications

**1. Nouvelle page publique : `src/pages/FillFriendForm.tsx`**
- Route publique : `/fill-friend-info/:token`
- Affiche le formulaire "Ajouter un ami" (nom, téléphone, lieu, date d'anniversaire)
- Les champs pré-remplis par l'inviteur (nom, relation) sont pré-chargés et éditables
- À la soumission, appelle une edge function ou insère directement dans `contacts` avec le `user_id` de l'inviteur (récupéré via le token)

**2. Nouvelle table Supabase : `friend_form_tokens`**
- `id` (uuid PK), `user_id` (FK auth.users — l'inviteur), `prefilled_name`, `prefilled_relation`, `token` (text unique), `status` ('pending', 'completed'), `created_at`, `expires_at`
- RLS : lecture publique par token, écriture via le propriétaire

**3. Bouton "Partager le formulaire" dans `AddFriendModal.tsx`**
- Nouveau bouton sous le formulaire : icône Share2 + "Envoyer à un proche pour qu'il complète"
- Au clic : génère un token via insert dans `friend_form_tokens` avec les données pré-remplies (nom, relation si déjà saisis)
- Ouvre un menu de partage multi-canal (WhatsApp, Facebook, SMS, Email, Copier, Natif) avec le lien `{origin}/fill-friend-info/{token}`

**4. Route dans `App.tsx`**
- Ajouter : `<Route path="/fill-friend-info/:token" element={<L><FillFriendForm /></L>} />`
- Page publique (pas de ProtectedRoute)

**5. Edge function `save-friend-form`**
- Reçoit le token + les données du formulaire
- Valide le token (non expiré, status pending)
- Insère le contact dans `contacts` pour le `user_id` de l'inviteur
- Met à jour le token en status 'completed'

### Flux utilisateur

```text
Utilisateur A                          Proche B
     |                                    |
     |-- Ouvre "Ajouter un ami" ----------|
     |-- Remplit nom + relation           |
     |-- Clique "Partager le formulaire"  |
     |-- Partage via WhatsApp/SMS/etc --->|
     |                                    |-- Ouvre le lien
     |                                    |-- Voit formulaire pré-rempli
     |                                    |-- Complète: téléphone, anniversaire, lieu
     |                                    |-- Soumet
     |<-- Contact ajouté automatiquement -|
```

### Fichiers impactés
- `src/components/AddFriendModal.tsx` — ajout bouton partage + génération token
- `src/pages/FillFriendForm.tsx` — nouvelle page publique
- `src/App.tsx` — nouvelle route
- `supabase/migrations/` — table `friend_form_tokens`
- `supabase/functions/save-friend-form/` — edge function de sauvegarde

