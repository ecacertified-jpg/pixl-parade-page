

# Fix : Cagnotte invisible pour le prestataire via le lien WhatsApp

## Diagnostic

Toutes les politiques RLS sont correctement configurees et les donnees existent en base. Le probleme vient probablement d'un conflit subtil entre les multiples politiques SELECT (8 politiques sur `business_collective_funds` + jointures vers `collective_funds` et `products` qui ont aussi leurs propres RLS). Dans le navigateur WhatsApp, ce cumul de verifications RLS imbriquees echoue silencieusement et retourne `null`.

## Solution : Fonction RPC SECURITY DEFINER

Creer une fonction PostgreSQL `get_business_fund_for_owner` qui :
- Prend un `fund_id` en parametre
- Verifie cote serveur que l'utilisateur connecte possede un commerce lie a cette cagnotte
- Retourne toutes les donnees necessaires en une seule requete (cagnotte, produit, beneficiaire, contributeurs, commande)
- Fonctionne en SECURITY DEFINER pour contourner les conflits RLS

Cela remplace les 4-5 requetes client actuelles par un seul appel RPC fiable.

## Modifications

### 1. Migration SQL -- Fonction RPC `get_business_fund_for_owner`

```sql
CREATE OR REPLACE FUNCTION public.get_business_fund_for_owner(p_fund_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  v_user_id uuid := auth.uid();
BEGIN
  -- Verifier que l'utilisateur possede un commerce lie a cette cagnotte
  IF NOT EXISTS (
    SELECT 1 FROM business_collective_funds bcf
    JOIN business_accounts ba ON ba.id = bcf.business_id
    WHERE bcf.fund_id = p_fund_id AND ba.user_id = v_user_id
  ) THEN
    RETURN NULL;
  END IF;

  -- Recuperer toutes les donnees en une seule requete
  SELECT jsonb_build_object(
    'fund', row_to_json(cf.*),
    'product', row_to_json(p.*),
    'beneficiary', (SELECT row_to_json(pr.*) FROM profiles pr WHERE pr.user_id = bcf.beneficiary_user_id),
    'contributors', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', fc.id,
        'amount', fc.amount,
        'name', COALESCE(NULLIF(TRIM(CONCAT(pr2.first_name, ' ', pr2.last_name)), ''), 'Anonyme')
      ))
      FROM fund_contributions fc
      LEFT JOIN profiles pr2 ON pr2.user_id = fc.contributor_id
      WHERE fc.fund_id = p_fund_id
    ), '[]'::jsonb),
    'order', (
      SELECT row_to_json(bo.*)
      FROM business_orders bo
      WHERE bo.fund_id = p_fund_id
      LIMIT 1
    )
  ) INTO result
  FROM business_collective_funds bcf
  JOIN collective_funds cf ON cf.id = bcf.fund_id
  LEFT JOIN products p ON p.id = bcf.product_id
  WHERE bcf.fund_id = p_fund_id
  LIMIT 1;

  RETURN result;
END;
$$;
```

### 2. Mise a jour de `BusinessFundOrderView.tsx`

Remplacer les multiples requetes Supabase par un seul appel RPC :

```typescript
const { data, error } = await supabase.rpc('get_business_fund_for_owner', {
  p_fund_id: fundId
});
```

Puis transformer le resultat JSON en props pour `CollectiveFundBusinessCard`.

La page reste la meme (pas de page supplementaire) -- on simplifie juste le chargement des donnees pour le rendre fiable.

### Fichiers concernes

1. **Migration SQL** -- Nouvelle fonction RPC `get_business_fund_for_owner`
2. **Modifie** : `src/pages/BusinessFundOrderView.tsx` -- Utiliser l'appel RPC au lieu des requetes directes

