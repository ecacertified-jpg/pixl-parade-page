

## Pre-selectionner "Telephone" comme methode d'inscription/connexion

### Probleme

Dans `src/pages/Auth.tsx` (ligne 188), la methode d'authentification par defaut est `'email'` :

```typescript
const [authInputMethod, setAuthInputMethod] = useState<'phone' | 'email'>('email');
```

L'utilisateur souhaite que l'onglet "Telephone" soit selectionne par defaut a l'ouverture de la page Auth.

### Solution

**Fichier : `src/pages/Auth.tsx`** (ligne 188)

Changer la valeur initiale de `'email'` a `'phone'` :

```typescript
const [authInputMethod, setAuthInputMethod] = useState<'phone' | 'email'>('phone');
```

### Impact

- L'onglet "Telephone" sera pre-selectionne a l'ouverture de la page d'inscription et de connexion
- L'utilisateur peut toujours basculer sur "Email" en cliquant dessus
- Aucun autre fichier n'est impacte

