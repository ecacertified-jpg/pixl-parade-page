

# Fix : Rendre l'insertion business_collective_funds robuste + reparer la cagnotte existante

## Problemes identifies

### 1. Cagnotte existante non reparee
La cagnotte "Tecno Pop10" (`4224309f`) a atteint 100% AVANT le correctif. Elle n'a pas de ligne dans `business_collective_funds`, donc `notify-fund-ready` l'a ignoree avec `"reason":"not_business_fund"`.

### 2. Le correctif actuel saute l'insertion si pas de beneficiary_user_id
Le code ajoute dans le dernier commit :
```text
if (beneficiaryUserIdForBcf) {  // <-- Si null, on saute tout !
    await supabase.from('business_collective_funds').insert(...)
}
```
Or le contact "Marie Belle" n'a pas de `linked_user_id`. Le champ `beneficiary_user_id` est nullable dans la table -- l'insertion devrait se faire meme sans beneficiaire lie.

## Corrections

### Etape 1 : Migration SQL -- Reparer les cagnottes existantes

Inserer les lignes manquantes dans `business_collective_funds` pour toutes les cagnottes business qui n'ont pas de ligne correspondante :

```text
INSERT INTO business_collective_funds (fund_id, business_id, product_id, beneficiary_user_id)
SELECT
  cf.id,
  p.business_id,
  cf.business_product_id,
  c.linked_user_id  -- peut etre null, c'est OK
FROM collective_funds cf
JOIN products p ON p.id = cf.business_product_id
LEFT JOIN contacts c ON c.id = cf.beneficiary_contact_id
WHERE cf.business_product_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM business_collective_funds bcf WHERE bcf.fund_id = cf.id
  )
```

Puis relancer `notify-fund-ready` pour la cagnotte "Tecno Pop10" deja a 100%.

### Etape 2 : Modifier `CollectiveCheckout.tsx`

Supprimer la condition `if (beneficiaryUserIdForBcf)` qui empeche l'insertion quand le beneficiaire n'a pas de compte. L'insertion doit se faire avec `beneficiary_user_id: null` dans ce cas :

```text
Avant :
  if (beneficiaryUserIdForBcf) {
    await supabase.from('business_collective_funds').insert({...})
  } else {
    console.warn('skipping...')
  }

Apres :
  await supabase.from('business_collective_funds').insert({
    fund_id: fundData.id,
    business_id: createdByBusinessId,
    product_id: businessProductId,
    beneficiary_user_id: beneficiaryUserIdForBcf  // null accepte
  })
```

### Etape 3 : Appeler notify-fund-ready pour les cagnottes reparees

Apres la migration, invoquer manuellement l'Edge Function pour la cagnotte `4224309f` afin de declencher les WhatsApp en attente. La deduplication dans la fonction empechera les doublons si elle est relancee.

## Fichiers modifies

1. **Migration SQL** -- insertion des lignes manquantes + re-declenchement
2. **`src/pages/CollectiveCheckout.tsx`** -- suppression de la condition bloquante sur `beneficiary_user_id`

## Resultat attendu

- La cagnotte "Tecno Pop10" sera reparee et les WhatsApp envoyes au prestataire et aux amis
- Les futures cagnottes business insereront toujours dans `business_collective_funds`, meme si le beneficiaire n'a pas de compte

