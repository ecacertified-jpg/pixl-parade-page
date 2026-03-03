

# Rediriger vers l'onglet Commandes du Dashboard Business

## Probleme

Toutes les redirections dans `BusinessFundOrderView.tsx` pointent vers `/business-collective-funds` (page "Gestion des cagnottes"), alors que l'utilisateur s'attend a atterrir sur l'onglet **Commandes** du dashboard business (`/business-dashboard`).

## Solution

### 1. Supporter un parametre de tab dans BusinessDashboard

Le composant `BusinessDashboard.tsx` utilise `<Tabs defaultValue="overview">`. Il faut lire un query param `?tab=orders` pour ouvrir directement l'onglet Commandes :

- Lire `searchParams.get('tab')` avec `useSearchParams`
- Utiliser une valeur controlée (`value` + `onValueChange`) au lieu de `defaultValue`
- Initialiser avec le query param ou `"overview"` par defaut

### 2. Mettre a jour les redirections dans BusinessFundOrderView

Remplacer toutes les occurrences de `/business-collective-funds` par `/business-dashboard?tab=orders` :

- La redirection automatique (countdown navigate)
- Le bouton manuel "Voir toutes mes cagnottes"
- Le bouton retour (fleche)
- Le lien en bas de page

### Fichiers concernes

- **Modifie** : `src/pages/BusinessDashboard.tsx` — ajout du support `?tab=` via `useSearchParams`
- **Modifie** : `src/pages/BusinessFundOrderView.tsx` — remplacer 4 liens `/business-collective-funds` par `/business-dashboard?tab=orders`

