## Plan: Empecher la creation de comptes en double (phone/email)

### Probleme

Actuellement, quand un doublon est detecte a l'inscription, l'utilisateur peut cliquer "Ce n'est pas moi - Continuer l'inscription" et creer un second compte avec le meme numero/email. Il faut bloquer cette possibilite pour les correspondances exactes.

### Modifications

#### 1. `src/components/DuplicateAccountModal.tsx`

- **Masquer le bouton "Continuer l'inscription"** quand `confidence === 'high'` (correspondance exacte de telephone)
- Remplacer par un message explicatif : "Ce numero/email est deja associe a un compte. Connectez-vous puis ajoutez vos business depuis l'onglet Config."
- Garder le bouton "Continuer" uniquement pour `confidence === 'medium'` ou `'low'` (correspondance par nom/ville)

#### 2. `src/pages/Auth.tsx` — Bloquer inscription client avec phone existant

- Dans `sendOtpSignUp`, quand le serveur retourne `confidence: 'high'`, empecher le bypass meme si `skipDuplicateCheck` est true
- Ajouter une verification email via `checkExistingAccount` dans `handleEmailSignUp` avant `supabase.auth.signUp`

#### 3. `src/pages/BusinessAuth.tsx` — Bloquer inscription business avec phone/email existant

- Meme logique dans `sendOtpSignUp` : bloquer si `confidence: 'high'`
- Dans `handleEmailSignUp`, ajouter un appel a `checkExistingAccount` avec l'email avant `signUp`
- Si un compte existe, afficher un message : "Connectez-vous a votre compte existant puis ajoutez un business depuis Config"

### Aucune migration SQL necessaire

L'unicite phone est deja geree par Supabase Auth + l'index partiel sur `profiles.phone`. L'unicite email est geree par Supabase Auth nativement.

### Fichiers modifies

- `src/components/DuplicateAccountModal.tsx`
- `src/pages/Auth.tsx`
- `src/pages/BusinessAuth.tsx`
- `src/hooks/useDuplicateAccountDetection.ts`