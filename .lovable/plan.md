

## Pre-selectionner "Telephone" sur la page Auth Business

### Modification

**Fichier : `src/pages/BusinessAuth.tsx`** (ligne 390)

Changer la valeur initiale de `authInputMethod` de `'email'` a `'phone'` :

```typescript
const [authInputMethod, setAuthInputMethod] = useState<'phone' | 'email'>('phone');
```

### Impact

- Meme changement que celui applique sur la page Auth client
- L'onglet "Telephone" sera pre-selectionne par defaut sur la page d'inscription/connexion Business
- L'utilisateur peut toujours basculer sur "Email"
- Un seul fichier modifie, une seule ligne changee

