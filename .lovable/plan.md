
# Correction du catalogue de souhaits vide

## Probleme identifie

La page `/wishlist-catalog` n'affiche aucun article malgre 264 produits actifs en base de donnees. La cause : la table `products` possede **plusieurs cles etrangeres** vers `business_accounts` (`business_id`, `business_account_id`), ce qui rend la jointure `business_accounts(business_name)` **ambigue** pour Supabase PostgREST. La requete echoue silencieusement et retourne un resultat vide.

D'autres pages du projet (ex: `ProductPreview.tsx`) resolvent ce probleme en utilisant le hint explicite : `business_accounts!products_business_id_fkey(business_name)`.

## Correction

### Fichier : `src/pages/WishlistCatalog.tsx` (ligne 44)

Remplacer :
```
business_accounts(business_name)
```

Par :
```
business_accounts!products_business_id_fkey(business_name)
```

C'est une modification d'une seule ligne qui resoudra le probleme d'affichage.
