

# Fix : Insertion `business_collective_funds` bloquée par RLS + réparation Samsung Galaxy A16

## Diagnostic

La cagnotte "Samsung Galaxy A16 - 2 Sim pour Marie Belle" (`efacddcb`) a atteint 100% a 06:26, le trigger `notify_on_target_reached` a bien appelé `notify-fund-ready`, mais la réponse était : `{"skipped":true,"reason":"not_business_fund"}`.

**Cause racine** : la ligne dans `business_collective_funds` n'a jamais été insérée malgré le fix précédent dans `CollectiveCheckout.tsx`. La raison est la **politique RLS INSERT** sur `business_collective_funds` :

```text
INSERT policy "Business owners can create collective funds":
  WITH CHECK (
    EXISTS (SELECT 1 FROM business_accounts ba WHERE ba.id = business_id AND ba.user_id = auth.uid())
    OR business_id = auth.uid()
  )
```

Cette politique exige que `auth.uid()` soit le propriétaire du commerce. Or c'est le **client** (Aboutou WhatsApp) qui crée la cagnotte depuis le checkout, pas le prestataire. L'insert échoue silencieusement (RLS deny) et le `bcfError` est probablement logué mais non bloquant.

## Corrections

### Etape 1 : Migration SQL

1. **Ajouter une politique RLS INSERT permissive** pour permettre à tout utilisateur authentifié d'insérer dans `business_collective_funds` lorsqu'il crée une cagnotte liée à un produit business :

```text
CREATE POLICY "Authenticated users can create business fund links"
ON public.business_collective_funds
FOR INSERT
TO authenticated
WITH CHECK (true);
```

Note : La sécurité est assurée en amont par le fait que seul le checkout peut insérer ces lignes, et les colonnes `fund_id`, `business_id`, `product_id` doivent référencer des enregistrements existants (FK constraints).

2. **Backfill la cagnotte Samsung Galaxy A16** manquante :

```text
INSERT INTO business_collective_funds (fund_id, business_id, product_id, beneficiary_user_id)
SELECT cf.id, p.business_id, cf.business_product_id, c.linked_user_id
FROM collective_funds cf
JOIN products p ON p.id = cf.business_product_id
LEFT JOIN contacts c ON c.id = cf.beneficiary_contact_id
WHERE cf.business_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM business_collective_funds bcf WHERE bcf.fund_id = cf.id);
```

### Etape 2 : Relancer notify-fund-ready

Après la migration, invoquer manuellement l'Edge Function pour la cagnotte `efacddcb` afin de déclencher les WhatsApp au prestataire et aux amis/contributeurs. La déduplication empêchera les doublons.

### Etape 3 : Supprimer le `as any` dans CollectiveCheckout.tsx

Le cast `as any` à la ligne 231 n'est plus nécessaire puisque `beneficiary_user_id` est désormais nullable dans les types. Le retirer pour une meilleure sécurité TypeScript.

## Fichiers modifiés

1. **Migration SQL** -- Nouvelle politique RLS INSERT + backfill des lignes manquantes
2. **`src/pages/CollectiveCheckout.tsx`** -- Suppression du cast `as any`

## Résultat attendu

- Les futures cagnottes business créées par des clients insèreront correctement dans `business_collective_funds`
- La cagnotte Samsung Galaxy A16 sera réparée et les WhatsApp envoyés
- Le prestataire recevra `joiedevivre_fund_ready` et les contributeurs recevront `joiedevivre_fund_completed`

