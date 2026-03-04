

# Corriger la redirection vers "Mon Espace Business" (nouvelle version)

## Problème

Les redirections pointent vers `/business-dashboard?tab=orders` (ancienne version) au lieu de `/business-account?tab=commandes` (nouvelle version "Mon Espace Business").

- Route correcte : `/business-account`
- Valeur d'onglet correcte : `commandes` (pas `orders`)

## Modifications

### 1. `src/pages/BusinessAccount.tsx`
Ajouter le support du query param `?tab=` :
- Importer `useSearchParams` depuis react-router-dom
- Remplacer `defaultValue="vue-ensemble"` par un état contrôlé initialisé depuis `searchParams.get('tab') || 'vue-ensemble'`

### 2. `src/pages/BusinessFundOrderView.tsx`
Remplacer les 4 occurrences de `/business-dashboard?tab=orders` par `/business-account?tab=commandes` :
- Redirection automatique (countdown)
- Bouton manuel "Voir mes commandes"
- Bouton retour (flèche)
- Lien en bas de page

