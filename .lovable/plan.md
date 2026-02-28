

## Corriger la boucle de redirection du bouton "Contribuer"

### Probleme

Quand un utilisateur non connecte clique "Contribuer a cette cagnotte" :
1. Il est redirige vers `/auth?redirect=/f/{fundId}`
2. Apres connexion, il revient sur `/f/{fundId}`
3. `/f/{fundId}` est la page FundPreview -- la meme page publique avec le bouton "Contribuer"
4. L'utilisateur se retrouve en boucle au lieu d'acceder au flux de contribution

### Solution

Deux modifications complementaires :

**1. Changer la destination de redirection dans FundPreview.tsx**

Au lieu de rediriger vers `/f/{fundId}` (la meme page), rediriger vers le Dashboard onglet COTISATIONS :

```typescript
const handleContribute = () => {
  navigate(`/auth?redirect=/dashboard?tab=cotisations`);
};
```

**2. Detecter l'utilisateur connecte dans FundPreview.tsx**

Si l'utilisateur est deja connecte quand il visite `/f/{fundId}`, le rediriger directement vers le Dashboard onglet COTISATIONS au lieu d'afficher la page de preview publique :

```typescript
const { user } = useAuth();

// Si connecte, aller directement au dashboard
const handleContribute = () => {
  if (user) {
    navigate(`/dashboard?tab=cotisations`);
  } else {
    navigate(`/auth?redirect=/dashboard?tab=cotisations`);
  }
};
```

### Fichier modifie

- `src/pages/FundPreview.tsx` : modifier `handleContribute` pour diriger vers `/dashboard?tab=cotisations` (connecte ou non)

### Impact

- Utilisateur non connecte : connexion puis redirection vers l'onglet COTISATIONS
- Utilisateur deja connecte : acces direct a l'onglet COTISATIONS
- La page FundPreview reste accessible en tant que page publique de decouverte

