

## Plan: Bouton "Suggérer un mot de passe sécurisé" dans inscription et paramètres

### Approche

Créer une fonction utilitaire `generateSecurePassword()` qui génère un mot de passe de 12 caractères (majuscules, minuscules, chiffres, caractères spéciaux), puis ajouter un bouton "Suggérer un mot de passe" dans les 3 endroits concernés.

### Fichiers

#### 1. Nouveau : `src/utils/generatePassword.ts`
- Fonction exportée qui génère un mot de passe aléatoire de 12 caractères contenant au moins 1 majuscule, 1 minuscule, 1 chiffre, 1 caractère spécial
- Utilise `crypto.getRandomValues()` pour la sécurité

#### 2. `src/pages/Auth.tsx` — Formulaire inscription client (email)
- Ajouter un bouton compact "Suggérer un mot de passe" (icône Wand2/Sparkles) sous le champ mot de passe
- Au clic : génère un mot de passe, le remplit dans les champs password + confirmPassword via `emailSignUpForm.setValue()`, active `showSignUpPassword` pour que l'utilisateur le voie et puisse le copier

#### 3. `src/pages/BusinessAuth.tsx` — Formulaire inscription prestataire (email)
- Même bouton et même logique que pour Auth.tsx

#### 4. `src/components/ChangePasswordForm.tsx` — Modification mot de passe (paramètres profil)
- Ajouter le même bouton "Suggérer un mot de passe" sous le champ nouveau mot de passe
- Au clic : remplit les deux champs (password + confirm), active `showPassword`

### Détail technique

```typescript
// src/utils/generatePassword.ts
export function generateSecurePassword(length = 12): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnpqrstuvwxyz';
  const digits = '23456789';
  const special = '!@#$%&*?';
  const all = upper + lower + digits + special;
  // Garantir au moins 1 de chaque catégorie, puis compléter aléatoirement
}
```

Le bouton sera stylé en `variant="ghost" size="sm"` avec une icône Sparkles et le texte "Suggérer un mot de passe sécurisé". Un toast confirme la suggestion avec un rappel de noter le mot de passe.

### Aucune migration SQL nécessaire

