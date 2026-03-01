
# Contrainte unique sur le champ phone dans profiles

## Contexte

Les 7 comptes secondaires fusionnes sont marques `is_suspended = true` mais conservent encore le meme numero de telephone que le compte primaire. Il faut nettoyer ces valeurs avant de pouvoir creer une contrainte unique.

## Etape 1 : Nettoyer les phones des comptes fusionnes (donnees)

Mettre a `NULL` le champ `phone` des 7 comptes secondaires suspendus :

```sql
UPDATE profiles SET phone = NULL
WHERE user_id IN (
  '2f635847-3aa1-4758-b26d-4fcab43afdea',  -- Grace Maria (suspendu)
  '447fb553-5da7-4d31-83a8-91eb425a9901',  -- Augustin (suspendu)
  'd5d3b39d-4bee-45ee-985b-8bd46e8659f6',  -- Honorine (suspendu)
  'a4132bbc-b23b-4d99-8fca-c09ca66b1ec2',  -- Maribelle (suspendu)
  'aae8fedd-8b84-4434-bf18-a7b8e78ffab5',  -- Amtey Florentin (suspendu)
  '2fbdc7e0-7426-4dab-8147-c50d113d5da1',  -- Eca (suspendu)
  '3b8297f4-4817-49ed-9971-ab50e8ba9c34'   -- Samuel (suspendu)
);
```

## Etape 2 : Creer un index unique partiel (migration)

Un index unique **partiel** est preferable a une contrainte classique : il ignore les valeurs NULL (plusieurs comptes sans telephone restent possibles) et les comptes suspendus.

```sql
CREATE UNIQUE INDEX idx_profiles_phone_unique
ON profiles (phone)
WHERE phone IS NOT NULL AND phone != '' AND is_suspended = false;
```

Cela permet :
- Plusieurs profils avec `phone = NULL` (pas de conflit)
- Les comptes suspendus/fusionnes gardent un phone vide sans bloquer
- Seuls les comptes actifs sont soumis a l'unicite

## Etape 3 : Mettre a jour merge-user-accounts

Ajouter dans la Edge Function `merge-user-accounts` une ligne pour vider le phone du compte secondaire apres fusion. Cela garantit que les futures fusions respectent la contrainte.

Dans `supabase/functions/merge-user-accounts/index.ts`, apres le marquage `is_suspended = true`, ajouter :

```typescript
// Clear phone from secondary to respect unique constraint
await supabaseAdmin
  .from('profiles')
  .update({ phone: null })
  .eq('user_id', secondary_user_id);
```

## Fichiers modifies

- **`supabase/functions/merge-user-accounts/index.ts`** : ajout du nettoyage du phone du secondaire

## Impact

- Empeche toute creation future de doublon de telephone
- Les comptes sans telephone ne sont pas affectes
- La fonction de fusion reste compatible
