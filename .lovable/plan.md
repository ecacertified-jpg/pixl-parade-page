

# Pages dediees par pays pour Utilisateurs et Entreprises

## Approche

Au lieu de naviguer vers `/admin/users?country=BJ` (qui cause des problemes de race condition avec AdminRoute), creer des routes dediees sous `/admin/countries/:countryCode/users` et `/admin/countries/:countryCode/businesses`. Ces routes reutilisent les composants existants en leur passant le code pays directement via les params de route.

## Modifications

### 1. Creer `src/pages/Admin/CountryUsersPage.tsx`

Un composant wrapper leger qui :
- Lit `countryCode` depuis `useParams()`
- Resout le nom du pays et le drapeau depuis la config
- Affiche un header avec "Utilisateurs - Benin" et un bouton retour vers `/admin/countries/BJ`
- Reutilise la logique de `UserManagement` mais avec le filtre pays force (pas optionnel)
- Passe `countryCode` comme prop ou l'utilise directement dans le fetch

En pratique, ce sera une version simplifiee de `UserManagement` qui :
- N'affiche PAS le selecteur de pays (le pays est fixe)
- Force le filtre `country_code` dans la requete Supabase
- Affiche le drapeau et le nom du pays dans le titre
- Conserve toutes les fonctionnalites (recherche, filtres, actions, modals)

### 2. Creer `src/pages/Admin/CountryBusinessesPage.tsx`

Meme principe pour les entreprises :
- Header "Entreprises - Benin"
- Filtre `country_code` force
- Toutes les fonctionnalites de `BusinessManagement` conservees

### 3. Modifier `src/App.tsx`

Ajouter deux nouvelles routes :

```
/admin/countries/:countryCode/users   -> CountryUsersPage
/admin/countries/:countryCode/businesses -> CountryBusinessesPage
```

Ces routes sont **imbriquees** sous le pattern existant `/admin/countries/:countryCode`, donc elles restent coherentes avec l'architecture actuelle.

### 4. Modifier `src/pages/Admin/CountryDetailPage.tsx`

Changer `handleNavigate` pour pointer vers les nouvelles routes dediees :

```
// Avant
onClick={() => handleNavigate('/admin/users')}

// Apres
onClick={() => navigate(`/admin/countries/${countryCode}/users`))
onClick={() => navigate(`/admin/countries/${countryCode}/businesses`))
```

Plus besoin de `setSelectedCountry` ni de query params pour ces navigations.

## Details techniques

### CountryUsersPage

- Copier la logique essentielle de `UserManagement` (fetch, filtres, table, modals)
- Le `countryCode` vient de `useParams()` et est **toujours applique** dans la requete :
  ```
  query = query.eq('country_code', countryCode);
  ```
- Le header affiche : `{flag} Utilisateurs du {countryName}` avec un lien retour vers `/admin/countries/{countryCode}`
- Le selecteur de pays global dans AdminLayout n'est pas utilise (le contexte est fixe par l'URL)

### CountryBusinessesPage

- Meme architecture que CountryUsersPage mais pour `business_accounts`
- Conserve la recherche, les filtres de statut, les actions (approuver, rejeter, etc.)

### Routes

Deux nouvelles routes dans App.tsx, protegees par `AdminRoute` :

```
<Route path="/admin/countries/:countryCode/users" element={<AdminRoute><CountryUsersPage /></AdminRoute>} />
<Route path="/admin/countries/:countryCode/businesses" element={<AdminRoute><CountryBusinessesPage /></AdminRoute>} />
```

## Avantages

- Plus de race condition : pas de dependance au `AdminCountryContext` pour le filtrage
- URLs claires et partageables : `/admin/countries/BJ/users`
- Navigation intuitive : le breadcrumb est naturel (Countries > Benin > Utilisateurs)
- Les pages globales `/admin/users` et `/admin/businesses` restent disponibles pour voir tous les pays

## Fichiers impactes

- **Nouveau** : `src/pages/Admin/CountryUsersPage.tsx`
- **Nouveau** : `src/pages/Admin/CountryBusinessesPage.tsx`
- **Modifie** : `src/App.tsx` (2 routes ajoutees)
- **Modifie** : `src/pages/Admin/CountryDetailPage.tsx` (navigation mise a jour)

