
# Correction de la Vue business_public_info

## Probleme Identifie

La migration de securite a cree la vue `business_public_info` avec un filtre incorrect :

```sql
WHERE status = 'approved'  -- INCORRECT
```

Mais toutes les boutiques dans la base de donnees ont :

```sql
status = 'active'  -- Valeur reelle dans la base
```

Resultat : La vue retourne 0 lignes, donc toutes les boutiques apparaissent comme "introuvables".

## Solution

Modifier la vue pour utiliser le bon filtre de status :

```sql
WHERE is_active = true 
  AND deleted_at IS NULL
  AND status = 'active'  -- Correction
```

## Migration SQL a Appliquer

```sql
-- Corriger la vue business_public_info avec le bon filtre de status
DROP VIEW IF EXISTS public.business_public_info;

CREATE VIEW public.business_public_info 
WITH (security_invoker = on) AS
SELECT 
  id,
  business_name,
  business_type,
  description,
  logo_url,
  is_active,
  is_verified,
  status,
  opening_hours,
  delivery_zones,
  delivery_settings,
  created_at,
  updated_at,
  latitude,
  longitude,
  address,
  country_code,
  website_url
FROM public.business_accounts
WHERE is_active = true 
  AND deleted_at IS NULL
  AND status = 'active';  -- Valeur correcte

GRANT SELECT ON public.business_public_info TO authenticated;
GRANT SELECT ON public.business_public_info TO anon;
```

## Impact

| Element | Avant Correction | Apres Correction |
|---------|------------------|------------------|
| Boutiques visibles sur la carte | 0 | Toutes les boutiques actives |
| Pages prestataires | Erreur "introuvable" | Fonctionnent normalement |
| Securite | Maintenue | Maintenue (meme niveau de protection) |

## Verification Apres Correction

La requete suivante devrait retourner des donnees :

```sql
SELECT COUNT(*) FROM business_public_info;
-- Resultat attendu : > 0
```
