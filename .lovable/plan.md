

# Ajouter un toast lors de la redirection automatique

## Modification

**Fichier** : `src/pages/BusinessFundOrderView.tsx`

Quand le countdown atteint zéro et que la redirection se déclenche, afficher un toast (via `sonner`) juste avant le `navigate()` :

```typescript
import { toast } from "sonner";

// Dans le useEffect du countdown, avant navigate :
toast.info("Votre cagnotte est visible dans l'onglet Commandes", {
  duration: 5000,
});
navigate('/business-account?tab=commandes');
```

Un seul ajout : un import `toast` depuis `sonner` et une ligne `toast.info(...)` avant le `navigate`.

