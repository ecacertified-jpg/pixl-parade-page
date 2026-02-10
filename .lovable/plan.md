
# Persister le filtre pays lors de la navigation

## Probleme identifie

Le `AdminCountryProvider` est place **a l'interieur** de `AdminLayout`, qui est lui-meme rendu comme enfant de chaque page admin. Quand l'admin clique sur la carte "Utilisateurs" depuis la page Benin :

1. `setSelectedCountry('BJ')` est appele
2. `navigate('/admin/users')` est appele
3. La route change, le composant `UserManagement` monte avec un **nouveau** `AdminLayout` et donc un **nouveau** `AdminCountryProvider`
4. Le state `selectedCountry` est reinitialise a `null`
5. Resultat : la page affiche les 187 utilisateurs globaux au lieu des 5 du Benin

## Solution : passer le pays via un parametre URL

Utiliser un query parameter `?country=BJ` dans l'URL pour transmettre le filtre entre les pages. C'est la solution la plus fiable car elle ne depend pas du cycle de vie React.

## Modifications

### 1. `src/pages/Admin/CountryDetailPage.tsx`

Modifier `handleNavigate` pour ajouter le query parameter :

```
const handleNavigate = (path: string) => {
  if (countryCode) {
    navigate(`${path}?country=${countryCode}`);
  } else {
    navigate(path);
  }
};
```

### 2. `src/contexts/AdminCountryContext.tsx`

Initialiser `selectedCountry` depuis le query parameter URL si present :

- Lire `window.location.search` au montage
- Si un parametre `country` est present et valide, l'utiliser comme valeur initiale
- Cela garantit que meme apres le remontage du provider, le filtre est preserve

### 3. `src/pages/Admin/UserManagement.tsx`

Ajouter la lecture du query parameter `country` au montage :

- Utiliser `useSearchParams()` de react-router-dom
- Si `country` est present dans l'URL, appeler `setSelectedCountry(country)` dans un `useEffect` au montage
- Mettre a jour l'URL quand le filtre est efface (retirer le parametre)

### 4. `src/pages/Admin/BusinessManagement.tsx`

Meme logique que pour UserManagement :

- Lire le query parameter `country` au montage
- Appeler `setSelectedCountry` si present
- Mettre a jour l'URL quand le filtre change

## Flux apres correction

```text
Page Benin -> Clic "Utilisateurs"
  -> navigate('/admin/users?country=BJ')
  -> UserManagement monte
  -> AdminCountryProvider monte (selectedCountry = null)
  -> useEffect lit ?country=BJ -> setSelectedCountry('BJ')
  -> fetchUsers filtre sur BJ -> 5 utilisateurs affiches
  -> Titre : "Utilisateurs - Benin (5)"
  -> Bouton "Retour a Benin" visible
```

## Impact

- 4 fichiers modifies
- Aucune modification de base de donnees
- Le filtre pays est transmis de maniere fiable via l'URL
- Les liens sont partageables (un admin peut copier l'URL filtree)
