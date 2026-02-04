

# Correction du Comptage des Utilisateurs par Pays

## Probleme Identifie

La base de donnees montre une incoherence entre les numeros de telephone et les codes pays des utilisateurs :

| Utilisateur | Telephone | country_code actuel | country_code attendu |
|-------------|-----------|---------------------|----------------------|
| Aubierge | +2290162576116 | CI | **BJ** |
| Jennifer | +2290163542214 | CI | **BJ** |
| Bernadette | +2290197643691 | BJ | BJ |

Les prefixes telephoniques :
- **+225** = Cote d'Ivoire (CI)
- **+229** = Benin (BJ)
- **+221** = Senegal (SN)

## Cause Racine

La fonction `handle_new_user()` ne definit pas le `country_code` lors de la creation du profil. Les utilisateurs ont donc le code par defaut ou celui detecte par geolocalisation (qui peut etre incorrect si l'utilisateur est en deplacement).

## Solution en Deux Parties

### Partie 1 : Correction des Donnees Existantes (Migration SQL)

Mettre a jour les profils avec le bon `country_code` base sur le prefixe telephonique :

```text
UPDATE profiles
SET country_code = CASE
  WHEN phone LIKE '+229%' THEN 'BJ'  -- Benin
  WHEN phone LIKE '+221%' THEN 'SN'  -- Senegal
  WHEN phone LIKE '+225%' THEN 'CI'  -- Cote d'Ivoire
  ELSE country_code
END
WHERE phone IS NOT NULL 
  AND phone != ''
  AND (
    (phone LIKE '+229%' AND country_code != 'BJ') OR
    (phone LIKE '+221%' AND country_code != 'SN') OR
    (phone LIKE '+225%' AND country_code != 'CI')
  );
```

### Partie 2 : Prevention Future (Modification de handle_new_user)

Modifier la fonction trigger pour definir automatiquement le `country_code` base sur le telephone :

```text
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  phone_number TEXT;
  detected_country TEXT;
BEGIN
  -- Get phone from metadata or auth.users
  phone_number := COALESCE(
    NEW.raw_user_meta_data ->> 'phone',
    NEW.phone
  );
  
  -- Detect country from phone prefix
  detected_country := CASE
    WHEN phone_number LIKE '+229%' THEN 'BJ'
    WHEN phone_number LIKE '+221%' THEN 'SN'
    WHEN phone_number LIKE '+225%' THEN 'CI'
    ELSE 'CI'  -- Default
  END;
  
  INSERT INTO public.profiles (user_id, first_name, last_name, birthday, city, phone, country_code)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data ->> 'first_name', 
    NEW.raw_user_meta_data ->> 'last_name',
    CASE 
      WHEN NEW.raw_user_meta_data ->> 'birthday' IS NOT NULL 
      THEN (NEW.raw_user_meta_data ->> 'birthday')::DATE 
      ELSE NULL 
    END,
    NEW.raw_user_meta_data ->> 'city',
    phone_number,
    detected_country  -- Auto-detect country
  );

  -- Create default reciprocity preferences
  INSERT INTO public.user_reciprocity_preferences (
    user_id, alert_threshold, reminder_frequency,
    enable_suggestions, enable_notifications, private_mode
  )
  VALUES (NEW.id, 2.0, 'monthly', true, true, false);

  RETURN NEW;
END;
$function$;
```

## Impact Attendu

| Metrique | Avant | Apres |
|----------|-------|-------|
| Utilisateurs Benin (BJ) | 1 | 3 |
| Utilisateurs Cote d'Ivoire (CI) | 170 | 168 |
| Precision des statistiques | Incorrecte | Correcte |

## Fichiers Modifies

- **Migration SQL** : Correction des donnees existantes + mise a jour de `handle_new_user()`

## Avantages

1. **Correction immediate** : Les statistiques du dashboard refletent la realite
2. **Prevention** : Les futurs utilisateurs auront automatiquement le bon pays
3. **Fiabilite** : Le prefixe telephonique est une source fiable du pays d'origine
4. **Retrocompatible** : Les inscriptions Google (sans telephone) utiliseront le pays par defaut

