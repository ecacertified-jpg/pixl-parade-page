

## Correction du bug notifications in-app

### Probleme

Dans `supabase/functions/notify-business-fund-friends/index.ts` (ligne 127), la propriete `data` est utilisee pour inserer dans la table `notifications`, mais cette colonne n'existe pas -- le bon nom est `metadata`.

### Modification

**Fichier** : `supabase/functions/notify-business-fund-friends/index.ts`

Remplacer `data:` par `metadata:` dans l'objet d'insertion des notifications in-app (ligne 127) :

```text
// Avant
data: {
  fund_id,
  beneficiary_user_id,
  business_name,
  product_name
}

// Apres
metadata: {
  fund_id,
  beneficiary_user_id,
  business_name,
  product_name
}
```

C'est un changement d'un seul mot. La fonction sera re-deployee automatiquement.

