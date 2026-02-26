

## Optimiser `check-friends-circle-reminders` pour eviter le timeout

### Probleme actuel

Le mode CRON execute **2 requetes DB sequentielles par utilisateur** (comptage contacts + verification alertes recentes), puis un appel WhatsApp API. Avec 162+ utilisateurs, cela depasse le timeout de 60 secondes.

### Solution

Remplacer les N requetes individuelles par **une seule requete SQL** qui filtre directement les utilisateurs eligibles, puis traiter les envois **par lots de 20 en parallele**.

### Modifications

**Fichier unique** : `supabase/functions/check-friends-circle-reminders/index.ts`

#### 1. Requete SQL unique pour trouver les utilisateurs eligibles

Au lieu de boucler sur chaque utilisateur pour compter ses contacts et verifier les alertes recentes, une seule requete RPC (ou sous-requetes inline) retourne directement les utilisateurs qui :
- Ont un profil complet (birthday, city, phone non null)
- Ont moins de 2 contacts
- N'ont pas recu de `friends_circle_reminder` dans les 72 dernieres heures

```text
Avant (N*2 requetes) :
  Pour chaque user:
    -> SELECT count(*) FROM contacts WHERE user_id = X
    -> SELECT id FROM birthday_contact_alerts WHERE user_id = X AND ...

Apres (1 requete) :
  SELECT p.user_id, p.first_name, p.phone
  FROM profiles p
  WHERE p.birthday IS NOT NULL AND p.city IS NOT NULL AND p.phone IS NOT NULL
    AND (SELECT count(*) FROM contacts c WHERE c.user_id = p.user_id) < 2
    AND NOT EXISTS (
      SELECT 1 FROM birthday_contact_alerts a
      WHERE a.user_id = p.user_id
        AND a.alert_type = 'friends_circle_reminder'
        AND a.created_at >= now() - interval '72 hours'
    )
  LIMIT 40;
```

Cette approche sera implementee via une fonction RPC `get_friends_circle_reminder_candidates` pour garder le code propre.

#### 2. Traitement par lots de 20 en parallele

Les utilisateurs eligibles sont decoupes en lots de 20. Dans chaque lot, les envois WhatsApp sont executes en parallele avec `Promise.allSettled()` :

```text
Lot 1: [user1, user2, ..., user20] -> Promise.allSettled(sends)
Lot 2: [user21, user22, ..., user40] -> Promise.allSettled(sends)
```

Cela reduit drastiquement le temps total : au lieu de 162 appels sequentiels (~3s chacun = ~8 min), on a 2 lots de 20 appels paralleles (~3s par lot = ~6s).

#### 3. Limite de 40 utilisateurs par execution CRON

Pour rester sous le timeout de 60 secondes, chaque execution CRON traite au maximum 40 utilisateurs. Le CRON tournant toutes les 24h (ou plus frequemment si necessaire), tous les utilisateurs seront couverts en quelques cycles.

#### 4. Correction du double envoi SMS+WhatsApp

Actuellement, pour les numeros +225, le code envoie WhatsApp **ET** SMS. La correction : n'envoyer le SMS que si le WhatsApp a echoue (`!waResult.success`).

### Plan d'execution

| Etape | Action |
|-------|--------|
| 1 | Creer la fonction RPC `get_friends_circle_reminder_candidates` via migration SQL |
| 2 | Refactorer le mode CRON dans l'edge function : requete unique + lots paralleles + limite 40 |
| 3 | Corriger la logique SMS fallback (SMS seulement si WhatsApp echoue) |
| 4 | Deployer et tester |

### Impact attendu

- Temps d'execution : de ~8 min (timeout) a ~10-15 secondes
- Requetes DB : de ~324 (2 par user) a 1 seule
- Fiabilite : plus de `context canceled`, tous les utilisateurs sont traites
- Bonus : le double envoi SMS+WhatsApp est corrige

