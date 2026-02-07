

# Correction : country_code manquant lors de la creation des comptes business

## Probleme identifie

Jenny Shop a ete creee par un utilisateur dont le profil a `country_code = 'BJ'` (Benin), mais le compte business a `country_code = 'CI'` (Cote d'Ivoire) car c'est la valeur par defaut de la colonne.

**Cause racine** : Aucun des 3 chemins de creation de business ne propage le `country_code` du profil utilisateur vers le compte business :

1. **BusinessAuth.tsx** (inscription prestataire) - ligne 778 : pas de `country_code`
2. **AdminAddBusinessToOwnerModal.tsx** (admin ajoute un business) - ligne 123 : pas de `country_code`
3. **admin-create-user Edge Function** (admin cree un utilisateur business) - ligne 156 : pas de `country_code`

La colonne `business_accounts.country_code` a un `DEFAULT 'CI'`, donc tout business cree sans valeur explicite est attribue a la Cote d'Ivoire.

## Plan de correction

### Etape 1 : Migration SQL - Corriger les donnees existantes et ajouter un trigger automatique

1. **Corriger Jenny Shop** : mettre a jour `country_code = 'BJ'` pour le business existant
2. **Corriger tous les business existants** : synchroniser le `country_code` de chaque business avec celui du profil de son proprietaire
3. **Creer un trigger** `sync_business_country_code` sur `business_accounts` qui, a chaque INSERT, copie automatiquement le `country_code` du profil du proprietaire. Cela sert de filet de securite.

### Etape 2 : BusinessAuth.tsx - Propager le country_code a l'inscription

Modifier la fonction `completeBusinessRegistration` pour :
1. Recuperer le `country_code` du profil de l'utilisateur via une requete Supabase
2. L'inclure dans l'INSERT du business account

### Etape 3 : AdminAddBusinessToOwnerModal.tsx - Propager le country_code

Modifier `handleSubmit` pour :
1. Recuperer le `country_code` du profil de l'utilisateur selectionne (deja charge dans la liste `users`)
2. L'inclure dans l'INSERT

### Etape 4 : admin-create-user Edge Function - Propager le country_code

Modifier l'Edge Function pour :
1. Accepter un parametre `country_code` optionnel dans le body
2. Si non fourni, le deduire du telephone (meme logique que `handle_new_user`)
3. L'inclure dans l'INSERT du business account

## Details techniques

```text
-- Trigger automatique (filet de securite)
CREATE OR REPLACE FUNCTION sync_business_country_from_profile()
RETURNS trigger AS $$
BEGIN
  IF NEW.country_code IS NULL OR NEW.country_code = 'CI' THEN
    SELECT country_code INTO NEW.country_code
    FROM profiles WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_business_country
BEFORE INSERT ON business_accounts
FOR EACH ROW EXECUTE FUNCTION sync_business_country_from_profile();
```

## Fichiers modifies

- `supabase/migrations/new_migration.sql` (nouveau)
- `src/pages/BusinessAuth.tsx`
- `src/components/admin/AdminAddBusinessToOwnerModal.tsx`
- `supabase/functions/admin-create-user/index.ts`

