
# Corriger l'attribution du pays pour les inscriptions WhatsApp

## Probleme

Les utilisateurs inscrits au Benin (+229) via le flux WhatsApp OTP sont affiches comme Cote d'Ivoire (CI) au lieu de Benin (BJ). C'est le cas pour "Daniella" (+2290197173731) et "Rose" (+2290197127166), ainsi que la boutique "Rose coiffure".

## Cause racine

La fonction Edge `verify-whatsapp-otp` cree les utilisateurs via `admin.createUser()` mais ne passe PAS le numero de telephone dans le champ `user_metadata`. Le trigger `handle_new_user` essaie de detecter le pays via :

```
phone_number := COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone);
```

Comme aucun des deux n'est renseigne, le CASE tombe dans le defaut `ELSE 'CI'`.

Le flux SMS, lui, passe correctement `phone` dans les metadata via `signInWithOtp({ options: { data: metadata } })`, ce qui explique pourquoi ca fonctionne pour les inscriptions SMS.

## Solution en 2 parties

### Partie 1 : Corriger le flux WhatsApp (empecher les futurs cas)

**Fichier : `supabase/functions/verify-whatsapp-otp/index.ts`**

Ajouter `phone` dans le `user_metadata` lors de la creation du user (ligne 127) :

```typescript
const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
  phone,
  phone_confirm: true,
  user_metadata: {
    first_name: metadata.first_name,
    last_name: metadata.last_name,
    city: metadata.city,
    birthday: metadata.birthday,
    is_business: metadata.is_business,
    phone,  // <-- AJOUTER CECI
  },
});
```

De plus, apres la creation du user, ajouter une mise a jour explicite du profil pour garantir le bon `country_code`, meme si le trigger ne fonctionne pas parfaitement :

```typescript
if (isNewUser) {
  const detectedCountry = phone.startsWith('+229') ? 'BJ'
    : phone.startsWith('+221') ? 'SN'
    : phone.startsWith('+225') ? 'CI' : 'CI';
    
  await supabaseAdmin
    .from('profiles')
    .update({ country_code: detectedCountry, phone: phone })
    .eq('user_id', user.id);
}
```

### Partie 2 : Corriger les donnees existantes

Les profils et boutiques deja inscrits au Benin mais marques CI doivent etre corriges. Executer cette requete SQL via la console Supabase :

```sql
-- Corriger les profils +229 marques CI
UPDATE profiles 
SET country_code = 'BJ' 
WHERE phone LIKE '+229%' AND country_code = 'CI';

-- Corriger les profils +221 marques CI  
UPDATE profiles 
SET country_code = 'SN' 
WHERE phone LIKE '+221%' AND country_code = 'CI';

-- Propager aux boutiques
UPDATE business_accounts ba
SET country_code = p.country_code
FROM profiles p
WHERE ba.user_id = p.user_id
AND ba.country_code != p.country_code;
```

## Fichier modifie

- `supabase/functions/verify-whatsapp-otp/index.ts` : ajout de `phone` dans user_metadata + mise a jour explicite du country_code apres creation
