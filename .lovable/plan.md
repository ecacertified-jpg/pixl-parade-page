
# Ajouter l'icone oeil masque/devoile sur tous les champs mot de passe

## Objectif

Permettre aux utilisateurs de voir/masquer leur mot de passe dans tous les champs password de l'application, comme c'est deja fait sur la page AdminAuth.

## Champs concernes

7 champs mot de passe au total, repartis sur 3 fichiers :

### `src/pages/Auth.tsx` (3 champs)
- Connexion : mot de passe
- Inscription : mot de passe
- Inscription : confirmation mot de passe

### `src/pages/BusinessAuth.tsx` (3 champs)
- Connexion : mot de passe
- Inscription : mot de passe
- Inscription : confirmation mot de passe

### `src/pages/ResetPassword.tsx` (2 champs)
- Nouveau mot de passe
- Confirmation mot de passe

## Implementation

Le pattern existe deja dans `AdminAuth.tsx` : un etat `showPassword`, un `div relative` autour de l'input, et un bouton avec les icones `Eye`/`EyeOff` de Lucide.

### Pour chaque fichier :

1. Importer `Eye` et `EyeOff` depuis `lucide-react`
2. Ajouter des etats booleens (`showPassword`, `showConfirmPassword` selon le nombre de champs)
3. Envelopper chaque Input password dans un `div className="relative"`
4. Changer le `type` de l'input en `type={showPassword ? 'text' : 'password'}`
5. Ajouter `pr-10` au className de l'input pour laisser de la place a l'icone
6. Ajouter le bouton oeil apres l'input :

```text
<button type="button" onClick={toggle}
  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
</button>
```

### Etats necessaires par fichier

- **Auth.tsx** : `showSignInPassword`, `showSignUpPassword`, `showSignUpConfirmPassword`
- **BusinessAuth.tsx** : `showSignInPassword`, `showSignUpPassword`, `showSignUpConfirmPassword`
- **ResetPassword.tsx** : `showPassword`, `showConfirmPassword`

## Fichiers modifies

- `src/pages/Auth.tsx`
- `src/pages/BusinessAuth.tsx`
- `src/pages/ResetPassword.tsx`
