

# Corriger l'inscription par email : gestion du mot de passe faible

## Diagnostic

J'ai teste le flow d'inscription par email et identifie le probleme exact :

Supabase Auth rejette les mots de passe compromis (presents dans des bases de donnees de fuites). L'API retourne une erreur **422** avec le code `weak_password` et la raison `"pwned"`. Le message d'erreur est en anglais : *"Password is known to be weak and easy to guess, please choose a different one."*

**Probleme** : ce code d'erreur n'est pas intercepte dans le code. Il tombe dans le `else` generique qui affiche `error.message` tel quel, en anglais, sans explication claire pour l'utilisateur.

## Solution

Ajouter une gestion specifique de l'erreur `weak_password` dans les deux pages d'inscription, avec un message en francais clair et actionnable.

### 1. `src/pages/Auth.tsx` - fonction `handleEmailSignUp` (lignes ~948-962)

Ajouter un cas pour `weak_password` avant le `else` generique :

```
if (error.message?.includes('User already registered') || ...) {
  // ... existant
} else if ((error as any)?.code === 'weak_password') {
  toast({
    title: 'Mot de passe trop faible',
    description: 'Ce mot de passe est trop courant ou a ete compromis. Choisissez un mot de passe plus unique (ex: melangez lettres, chiffres et symboles).',
    variant: 'destructive',
  });
} else {
  // ... existant
}
```

### 2. `src/pages/BusinessAuth.tsx` - fonction `handleEmailSignUp` (lignes ~1162-1172)

Meme ajout du cas `weak_password` dans la gestion d'erreur.

### 3. (Optionnel) Validation pre-soumission

Ajouter une validation Zod renforcee dans `emailSignUpSchema` pour guider l'utilisateur avant meme de soumettre :
- Exiger au moins une lettre majuscule, une minuscule, un chiffre et un caractere special
- Afficher les criteres sous le champ mot de passe en temps reel

## Impact

- Aucune modification backend
- L'utilisateur verra un message clair en francais expliquant pourquoi son mot de passe est refuse
- Les autres erreurs continuent d'etre gerees normalement

## Fichiers modifies

1. `src/pages/Auth.tsx` : ajout gestion `weak_password`
2. `src/pages/BusinessAuth.tsx` : ajout gestion `weak_password`

