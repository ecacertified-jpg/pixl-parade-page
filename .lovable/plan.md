

## Dedupliquer les profils et eviter les doublons de WhatsApp

### Etat actuel

Le systeme possede deja :
- **Scan** : `scan-duplicate-accounts` detecte les groupes de profils partageant le meme telephone (6 groupes en attente)
- **Merge** : `merge-user-accounts` transfere les donnees (contacts, funds, contributions, posts, etc.) du compte secondaire vers le primaire, puis suspend le secondaire
- **Dashboard admin** : `useDuplicateAccountsDashboard` + modales de fusion (`UnifyClientAccountsModal`, `UnifyBusinessAccountsModal`)

### Problemes identifies

1. **`merge-user-accounts` ne gere pas `contact_relationships`** : apres fusion, les liens d'amitie du compte secondaire sont perdus ou dupliques (ex: Florentin a 3 profils avec 11 relations au total, dont des doublons)
2. **`notify-business-fund-friends` envoie des WhatsApp en double** : la boucle `friends` itere sur chaque `user_id` ami sans deduplication par numero de telephone -- si 2 profils partagent le meme numero, 2 WhatsApp sont envoyes
3. **Pas de prevention a l'inscription** : rien n'empeche la creation d'un nouveau profil avec un telephone deja utilise

### Plan en 3 parties

---

### Partie 1 : Deduplication WhatsApp dans `notify-business-fund-friends`

**Fichier** : `supabase/functions/notify-business-fund-friends/index.ts`

**Modification** : Dans la boucle d'envoi WhatsApp aux amis (block 1), ajouter une deduplication par numero de telephone normalise AVANT d'envoyer. Actuellement `notifiedPhones` n'est alimente qu'APRES l'envoi et n'est verifie que dans le block contacts.

```text
AVANT (boucle friends) :
  pour chaque friend dans friendProfiles :
    envoyer WhatsApp
    ajouter au notifiedPhones

APRES (boucle friends) :
  pour chaque friend dans friendProfiles :
    SI normalizedPhone DEJA dans notifiedPhones -> skip
    envoyer WhatsApp
    ajouter au notifiedPhones
```

Impact : empeche immediatement les doublons WhatsApp sans attendre la fusion des comptes.

---

### Partie 2 : Gerer `contact_relationships` dans `merge-user-accounts`

**Fichier** : `supabase/functions/merge-user-accounts/index.ts`

**Modification** : Ajouter un bloc de transfert des `contact_relationships` du compte secondaire vers le primaire, avec deduplication :

1. Recuperer toutes les relations du secondaire (`user_a = secondary OR user_b = secondary`)
2. Pour chaque relation, remplacer le `secondary_user_id` par `primary_user_id`
3. Avant l'update, verifier qu'une relation equivalente n'existe pas deja pour le primaire (eviter les doublons)
4. Supprimer les relations devenues `user_a = user_b` (auto-reference) apres remplacement
5. Logger le nombre de relations transferees/supprimees

Logique :

```text
relations_secondaire = SELECT * FROM contact_relationships
  WHERE user_a = secondary_id OR user_b = secondary_id

pour chaque relation :
  nouveau_user_a = (secondary -> primary) 
  nouveau_user_b = (secondary -> primary)
  
  SI nouveau_user_a == nouveau_user_b -> DELETE (auto-ref)
  SI relation (primary, autre_user) existe deja -> DELETE doublon
  SINON -> UPDATE user_a/user_b
```

---

### Partie 3 : Empecher les doublons a l'inscription

**Migration SQL** : Creer un trigger `BEFORE INSERT` sur `profiles` qui verifie si un profil actif avec le meme numero (8 derniers chiffres) existe deja.

```text
trigger prevent_duplicate_phone_profile :
  BEFORE INSERT ON profiles
  SI NEW.phone est non-null
    ET un profil actif (is_suspended = false) avec le meme phone existe deja
  ALORS
    -- Ne pas bloquer l'insertion (l'utilisateur a deja un compte auth)
    -- Mais loguer un warning et marquer le nouveau profil pour revue
    INSERT INTO detected_duplicate_accounts (...)
```

Note : on ne peut PAS bloquer l'insertion car `handle_new_user` cree le profil pendant le signup. Bloquer casserait l'authentification. On detecte et signale plutot immediatement.

---

### Resume des fichiers modifies

| Fichier | Modification |
|---------|-------------|
| `supabase/functions/notify-business-fund-friends/index.ts` | Deduplication par telephone dans la boucle friends |
| `supabase/functions/merge-user-accounts/index.ts` | Transfert et deduplication des `contact_relationships` |
| Migration SQL | Trigger de detection automatique des doublons telephone a l'inscription |

### Ordre d'implementation

1. Partie 1 (WhatsApp dedup) -- correctif immediat, zero risque
2. Partie 2 (merge relationships) -- necessaire avant de fusionner les comptes existants
3. Partie 3 (prevention) -- protection long terme

