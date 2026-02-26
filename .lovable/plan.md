

## Correction de `notify-business-fund-contributors`

### Probleme identifie

La table `business_collective_funds` a une colonne `beneficiary_user_id` mais **aucune cle etrangere** vers `profiles.user_id`. PostgREST ne peut donc pas resoudre la jointure `profiles!beneficiary_user_id` dans la requete de l'Edge Function.

**FKs existantes** : `fund_id -> collective_funds`, `business_id -> business_accounts`, `product_id -> products`
**FK manquante** : `beneficiary_user_id -> profiles(user_id)`

### Plan de correction

#### Etape 1 : Migration SQL - Ajouter la cle etrangere

```sql
ALTER TABLE business_collective_funds
ADD CONSTRAINT business_collective_funds_beneficiary_user_id_fkey
FOREIGN KEY (beneficiary_user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;
```

Cela permettra a PostgREST de resoudre automatiquement la jointure `profiles!beneficiary_user_id`.

#### Etape 2 : Redeployer et tester

Apres la migration :
1. Invoquer manuellement `notify-business-fund-contributors` avec un `fund_id` de test
2. Verifier que l'erreur `PGRST200` disparait
3. Si la table `business_collective_funds` est vide, inserer un enregistrement de test lie a un `collective_fund` actif existant pour exercer le flux complet jusqu'a l'envoi WhatsApp

### Details techniques

- **Aucune modification du code Edge Function** n'est necessaire -- la requete `.select('*, profiles!beneficiary_user_id(...)')` est correcte, il manquait seulement la contrainte en base
- La table est actuellement vide, donc la migration ne risque pas de violer la contrainte sur des donnees existantes
- Le `ON DELETE CASCADE` est coherent avec les autres FKs de la table

