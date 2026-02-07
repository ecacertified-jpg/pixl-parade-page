
# Correction des profils manquants et amelioration de la resilience du trigger

## Probleme identifie

Les deux amis d'Eca dans `contact_relationships` :
- `aae8fedd...` (Amtey Aboutou - aaboutou@gmail.com)
- `b348bb92...` (Amtey Florentin - amteyflorentin@gmail.com)

Existent dans `auth.users` mais **n'ont pas de profil** dans la table `profiles`. Le trigger `generate_fund_contribution_reminders` fait un `JOIN profiles` pour recuperer le telephone, donc il ne trouve aucun ami et ne cree aucun rappel.

## Plan de correction

### Etape 1 : Reparer les profils manquants

Creer une migration qui :
1. Insere les profils manquants pour tous les utilisateurs `auth.users` qui n'ont pas de profil (pas uniquement ces deux-la)
2. Recupere `first_name`, `last_name`, `phone` depuis `raw_user_meta_data` quand disponible

```text
INSERT INTO profiles (user_id, first_name, last_name)
SELECT id, raw_user_meta_data->>'first_name', raw_user_meta_data->>'last_name'
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM profiles WHERE user_id IS NOT NULL)
```

### Etape 2 : Regenerer les rappels pour la cagnotte existante

Executer manuellement la logique de generation pour la cagnotte `c73a3ef7...` (Samsung Galaxy A16 pour Francoise TIA), car le trigger ne se declenche qu'a la creation.

### Etape 3 : Renforcer le trigger `handle_new_user()`

Verifier et corriger le trigger d'inscription pour qu'il cree systematiquement un profil, meme pour les inscriptions Google OAuth. Ajouter un `ON CONFLICT DO NOTHING` pour eviter les erreurs en doublon.

## Limite restante

Meme apres correction, les deux amis n'ont **pas de numero de telephone** renseigne. Les SMS ne partiront que quand ils auront ajoute leur telephone dans leur profil. En attendant, les rappels seront crees avec `status = 'pending'` mais le CRON les marquera `skipped` (invalid_phone).

Pour resoudre cela a long terme, on pourrait aussi envoyer des **notifications in-app** en plus des SMS, pour couvrir les utilisateurs sans telephone.
