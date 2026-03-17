

# Plan : Sélecteur de pays dans le catalogue de souhaits

## Problème

La page `WishlistCatalog` charge **tous** les produits actifs sans filtrage par pays. Un utilisateur en Côte d'Ivoire voit aussi les produits du Bénin ou du Sénégal, ce qui n'est pas pertinent pour sa liste de souhaits.

## Changements

### Fichier : `src/pages/WishlistCatalog.tsx`

1. **Importer** `useCountry` depuis `@/contexts/CountryContext` et `CountrySelector` depuis `@/components/CountrySelector`

2. **Ajouter un sélecteur de pays** dans le header, entre la barre de recherche et les filtres de catégorie — utiliser `<CountrySelector variant="compact" />` (le même composant utilisé partout dans l'app)

3. **Filtrer les produits par pays** en modifiant la requête `fetchData` :
   - D'abord récupérer les `business_accounts.id` filtrés par `country_code` (même pattern que `ShopForCollectiveGiftModal` et `FeaturedExperiencesCarousel`)
   - Puis filtrer les produits avec `.in('business_id', businessIds)`
   - Re-fetch quand le `countryCode` change (ajouter dans le tableau de dépendances du `useEffect`)

4. **Pays par défaut** : `useCountry()` retourne déjà le pays détecté/sélectionné de l'utilisateur — aucune logique supplémentaire nécessaire

### Flux de données

```text
useCountry().countryCode (auto-détecté ou profil)
       ↓
business_accounts WHERE country_code = X
       ↓
products WHERE business_id IN (...)
       ↓
Affichage filtré
```

### Aucun autre fichier modifié

Le `CountrySelector` et `useCountry` existent déjà. Seul `WishlistCatalog.tsx` est modifié.

