

# Inference du pays du prestataire a partir de son adresse

## Probleme

Actuellement, le trigger `sync_business_country_from_profile` sur `business_accounts` ne fait que copier le `country_code` du profil du proprietaire. Si le profil a une valeur incorrecte (ex: `CI` par defaut) ou si le prestataire est cree par un admin, le pays peut etre faux.

La logique d'inference par ville/adresse existe deja pour les utilisateurs (dans `handle_new_user`) et cote frontend (dans `inferCountryFromAddress` de `useVendorProducts.ts`), mais elle n'est pas appliquee au niveau du trigger de creation des business accounts.

## Solution

### 1. Enrichir le trigger `sync_business_country_from_profile`

Ajouter un fallback d'inference par adresse dans la fonction SQL, en suivant le meme schema que `handle_new_user` :

- Etape 1 : Copier le `country_code` du profil (existant)
- Etape 2 (nouveau) : Si le resultat est toujours `CI` ou `NULL`, analyser le champ `address` de la business pour inferer le pays a partir des noms de villes connues (Cotonou -> BJ, Dakar -> SN, Lome -> TG, Bamako -> ML, Ouagadougou -> BF)
- Etape 3 (nouveau) : Si le champ `phone` de la business commence par un prefixe connu (+229, +221, etc.), utiliser ca aussi comme signal

### 2. Enrichir le `inferCountryFromAddress` frontend

Ajouter les villes du Togo, Mali et Burkina Faso a la fonction existante dans `useVendorProducts.ts` pour coherence avec les 6 pays supportes.

### 3. Corriger les donnees existantes

Mettre a jour les business accounts qui ont `country_code = 'CI'` par defaut mais dont l'adresse indique un autre pays.

## Fichiers concernes

| Fichier | Action | Description |
|---------|--------|-------------|
| `supabase/migrations/[new].sql` | Creer | Enrichir le trigger + corriger les donnees existantes |
| `src/hooks/useVendorProducts.ts` | Modifier | Ajouter TG, ML, BF a `inferCountryFromAddress` |

## Details techniques

### Nouvelle fonction SQL

```sql
CREATE OR REPLACE FUNCTION public.sync_business_country_from_profile()
RETURNS trigger AS $$
DECLARE
  profile_country TEXT;
  business_address TEXT;
  business_phone TEXT;
BEGIN
  -- Step 1: Get country from owner's profile
  IF NEW.country_code IS NULL OR NEW.country_code = 'CI' THEN
    SELECT country_code INTO profile_country
    FROM public.profiles WHERE user_id = NEW.user_id;
    
    IF profile_country IS NOT NULL THEN
      NEW.country_code := profile_country;
    END IF;
  END IF;
  
  -- Step 2: If still CI or NULL, infer from business address
  IF NEW.country_code IS NULL OR NEW.country_code = 'CI' THEN
    business_address := LOWER(COALESCE(NEW.address, ''));
    
    IF business_address LIKE '%cotonou%' OR business_address LIKE '%porto-novo%' 
       OR business_address LIKE '%parakou%' OR business_address LIKE '%bohicon%' ... THEN
      NEW.country_code := 'BJ';
    ELSIF business_address LIKE '%dakar%' OR ... THEN
      NEW.country_code := 'SN';
    -- (meme logique pour TG, ML, BF)
    END IF;
  END IF;
  
  -- Step 3: If still CI or NULL, try phone prefix
  IF NEW.country_code IS NULL OR NEW.country_code = 'CI' THEN
    business_phone := COALESCE(NEW.phone, '');
    NEW.country_code := CASE
      WHEN business_phone LIKE '+229%' THEN 'BJ'
      WHEN business_phone LIKE '+221%' THEN 'SN'
      WHEN business_phone LIKE '+228%' THEN 'TG'
      WHEN business_phone LIKE '+223%' THEN 'ML'
      WHEN business_phone LIKE '+226%' THEN 'BF'
      ELSE COALESCE(NEW.country_code, 'CI')
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

### Frontend `inferCountryFromAddress` enrichi

```typescript
function inferCountryFromAddress(address: string | null): string | null {
  if (!address) return null;
  const lower = address.toLowerCase();
  if (['cotonou','porto-novo','parakou','bohicon','abomey','ouidah','calavi'].some(c => lower.includes(c))) return 'BJ';
  if (['dakar','thies','kaolack','saint-louis','ziguinchor','touba','mbour'].some(c => lower.includes(c))) return 'SN';
  if (['lome','lomé','kara','sokode','sokodé','atakpame','kpalime','kpalimé'].some(c => lower.includes(c))) return 'TG';
  if (['bamako','sikasso','mopti','segou','ségou','koutiala','kayes'].some(c => lower.includes(c))) return 'ML';
  if (['ouagadougou','bobo-dioulasso','koudougou','ouahigouya','banfora'].some(c => lower.includes(c))) return 'BF';
  if (['abidjan','bouake','yamoussoukro','korhogo','daloa'].some(c => lower.includes(c))) return 'CI';
  return null;
}
```

