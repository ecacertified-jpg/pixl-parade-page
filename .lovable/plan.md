
# Plan : Masquer le Chat IA sur la Landing et la page Auth

## Problème

Le widget de chat IA (`AIChatWidget`) est affiché globalement sur toutes les pages, y compris la landing page et la page Auth où seul le bouton WhatsApp devrait être visible.

## Solution

Ajouter une vérification de la route courante dans `AIChatWidget.tsx` avec `useLocation()`. Si la route est `/` ou `/auth`, le composant ne rend rien (`return null`).

## Modification

### Fichier : `src/components/AIChatWidget.tsx`

- Importer `useLocation` depuis `react-router-dom`
- Au début du composant, récupérer `pathname` via `useLocation()`
- Si `pathname === '/' || pathname === '/auth'`, retourner `null` immédiatement (avant les hooks d'état, donc placer la logique après tous les hooks existants, juste avant le JSX)

```typescript
import { useLocation } from 'react-router-dom';

export const AIChatWidget = () => {
  const location = useLocation();
  const { user } = useAuth();
  // ... existing hooks ...

  const hiddenRoutes = ['/', '/auth'];
  if (hiddenRoutes.includes(location.pathname)) {
    return null;
  }

  // ... rest of component
};
```

## Fichier concerné

| Fichier | Action |
|---------|--------|
| `src/components/AIChatWidget.tsx` | Masquer le widget sur `/` et `/auth` |
