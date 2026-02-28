

## Corriger la navigation du bouton "Contribuer a cette cagnotte"

### Probleme

Dans `FundPreview.tsx`, le handler du bouton "Contribuer" utilise une route inexistante :

```typescript
const handleContribute = () => {
  navigate(`/fund/${fundId}`);  // /fund/ n'existe pas dans App.tsx
};
```

La seule route definie pour les cagnottes est `/f/:fundId` (ligne 150 de App.tsx). Le bouton redirige donc vers une page 404.

### Solution

**Fichier : `src/pages/FundPreview.tsx`**

Modifier le handler pour utiliser la bonne route :

```typescript
const handleContribute = () => {
  navigate(`/f/${fundId}`);
};
```

Cependant, cela redirigerait vers la meme page (FundPreview). Si l'intention est de rediriger vers une page de contribution authentifiee (par exemple le Dashboard ou une page de paiement), il faudra rediriger vers la page d'authentification avec un parametre de redirection :

```typescript
const handleContribute = () => {
  navigate(`/auth?redirect=/f/${fundId}`);
};
```

Ou bien, si la page actuelle sert deja a la contribution (avec un formulaire de contribution plus bas pour les utilisateurs connectes), garder `/f/${fundId}` qui rechargera la page dans un contexte authentifie.

### Modification unique

Remplacer `navigate(\`/fund/${fundId}\`)` par `navigate(\`/f/${fundId}\`)` dans le handler `handleContribute` de `FundPreview.tsx`.

