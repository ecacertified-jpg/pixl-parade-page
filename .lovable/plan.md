

# Filtrer les donnees par pays sur les pages Utilisateurs, Entreprises, Commandes, Analytiques

## Constat actuel

| Page | Filtre pays | Statut |
|------|------------|--------|
| Utilisateurs (`/admin/users`) | `selectedCountry` sur `profiles.country_code` | Deja fait |
| Entreprises (`/admin/businesses`) | `selectedCountry` sur `business_accounts.country_code` | Deja fait |
| Analytiques (`/admin/business-analytics`) | `getCountryFilter()` passe au hook | Deja fait |
| **Commandes (`/admin/orders`)** | **Aucun filtre pays** | **A faire** |
| **Commandes - liste des business** | **Aucun filtre pays** | **A faire** |

Les pages Utilisateurs, Entreprises et Analytiques filtrent deja correctement par pays quand on clique sur une carte KPI depuis la page detail pays. Seule la page **Commandes** ne tient pas compte du pays selectionne.

## Modifications

### 1. `src/hooks/useAdminOrders.ts` - Ajouter le filtre pays

- Ajouter `countryCode?: string` dans l'interface `OrderFilters`
- Dans `loadOrders`, si `countryCode` est present, ajouter un filtre sur la jointure existante `business_accounts` :
  ```
  query = query.eq('business_accounts.country_code', countryCode)
  ```
- Cela fonctionne car la requete utilise deja `business_accounts!inner(...)` comme jointure

### 2. `src/pages/Admin/OrdersManagement.tsx` - Utiliser le filtre pays global

- Importer `useAdminCountry` depuis le contexte
- Lire `selectedCountry` du contexte
- Passer `countryCode: selectedCountry` dans les filtres envoyes a `loadOrders()`
- Ajouter `selectedCountry` comme dependance du `useEffect` qui recharge les commandes
- Filtrer aussi la liste des business du dropdown par pays (ajouter `.eq('country_code', selectedCountry)` quand un pays est selectionne)
- Ajouter le composant `AdminPageHeader` et `AdminCountryRestrictionAlert` (deja present)

### 3. Aucune modification pour les cagnottes

Les cagnottes sont deja affichees sur la page de detail pays (`CountryDetailPage.tsx`) avec les stats `totalFunds` et `activeFunds`. Aucune page admin dediee aux cagnottes n'existe encore.

## Impact

- 2 fichiers modifies : `useAdminOrders.ts` et `OrdersManagement.tsx`
- Les commandes seront automatiquement filtrees par pays quand l'admin navigue depuis la page detail pays
- Le dropdown de business dans la page commandes sera aussi filtre par pays
- Coherence complete avec les autres pages admin
