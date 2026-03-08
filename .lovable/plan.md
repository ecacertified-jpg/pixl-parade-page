

## Plan: Ajouter la modification d'email et de mot de passe dans les parametres

### Fonctionnalites a ajouter

1. **Changer l'email** — via `supabase.auth.updateUser({ email: newEmail })` (Supabase envoie un lien de confirmation aux deux adresses)
2. **Changer le mot de passe** — via `supabase.auth.updateUser({ password: newPassword })` (necessite que l'utilisateur soit connecte)

### Modifications

#### 1. `src/pages/ProfileSettings.tsx`

Dans l'onglet "Coordonnees", remplacer le champ email en lecture seule par :
- Un champ email editable avec un bouton "Modifier l'email"
- Un dialog de confirmation demandant le nouvel email
- Apres soumission, appel a `supabase.auth.updateUser({ email })` + message expliquant qu'un lien de confirmation a ete envoye

Ajouter une section "Securite" dans l'onglet Coordonnees (ou sous "Methodes de connexion") :
- Formulaire avec : mot de passe actuel (optionnel car Supabase ne le requiert pas pour `updateUser`), nouveau mot de passe, confirmation
- Validation Zod : minimum 8 caracteres, correspondance des deux champs
- Appel a `supabase.auth.updateUser({ password })` + toast de succes
- Visible uniquement pour les utilisateurs connectes par email (pas Google/phone-only)

#### 2. Creer `src/components/ChangeEmailDialog.tsx`

Dialog modal contenant :
- Champ "Nouvel email" avec validation Zod
- Bouton de confirmation
- Gestion du loading et des erreurs
- Message de succes expliquant la verification par email

#### 3. Creer `src/components/ChangePasswordForm.tsx`

Card/formulaire contenant :
- Champ "Nouveau mot de passe" (min 8 car.)
- Champ "Confirmer le mot de passe"
- Validation de correspondance
- Bouton de soumission avec loading state
- Conditionne a : l'utilisateur a une identite `email` (pas uniquement Google/phone)

### Aucune migration SQL necessaire

`supabase.auth.updateUser()` gere tout cote Supabase Auth.

### Fichiers concernes
- `src/pages/ProfileSettings.tsx` (modifie)
- `src/components/ChangeEmailDialog.tsx` (nouveau)
- `src/components/ChangePasswordForm.tsx` (nouveau)

