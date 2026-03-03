

# Fix : Route 404 sur le lien WhatsApp `/business/orders/{fund_id}`

## Probleme

Le bouton CTA du template Meta `joiedevivre_fund_ready` pointe vers l'URL `/business/orders/{fund_id}`. Or, cette route n'existe pas dans l'application. Les routes existantes pour le prestataire sont :
- `/orders` -- commandes client
- `/business-collective-funds` -- gestion des cagnottes business (la bonne destination)

## Solution

Ajouter une route de redirection dans `src/App.tsx` qui capture `/business/orders/:fundId` et redirige le prestataire vers `/business-collective-funds`.

On ne peut pas modifier l'URL dans le template Meta (cela necessite une re-soumission et approbation par Meta), donc la solution la plus rapide est d'ajouter la route cote application.

## Modification

### Fichier : `src/App.tsx`

Ajouter une route de redirection avant la route catch-all `*` :

```text
<Route path="/business/orders/:fundId" element={
  <ProtectedRoute>
    <Navigate to="/business-collective-funds" replace />
  </ProtectedRoute>
} />
```

Cela couvre aussi le pattern `/business/orders/` sans parametre.

## Impact

- Le prestataire qui clique sur le lien WhatsApp sera redirige vers la page de gestion des cagnottes business au lieu de voir une erreur 404
- Aucune modification du template Meta requise
- Solution retrocompatible avec les anciens messages deja envoyes

