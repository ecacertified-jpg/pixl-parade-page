

## Modifier notify-business-fund-friends pour notifier aussi les contacts

### Contexte

Actuellement, la fonction ne notifie que les amis via `contact_relationships` (utilisateurs avec un compte). Les contacts du carnet d'adresses de Francoise (table `contacts`) ont des numeros de telephone mais pas de `linked_user_id`, donc ils sont ignores.

### Modification

**Fichier** : `supabase/functions/notify-business-fund-friends/index.ts`

Apres le bloc existant d'envoi WhatsApp aux amis `contact_relationships` (ligne 143-166), ajouter un second bloc qui :

1. **Recupere les contacts** de la table `contacts` pour le `beneficiary_user_id` qui ont un numero de telephone
2. **Deduplique** : exclut les numeros deja notifies via `contact_relationships` (pour eviter les doublons, par exemple Florentin qui est dans les deux tables)
3. **Envoie le template WhatsApp** `joiedevivre_group_contribution` a chaque contact avec telephone, en utilisant leur `name` comme prenom

### Logique de deduplication

- Collecter tous les numeros de telephone deja envoyes via les `friendProfiles`
- Pour chaque contact de la table `contacts`, verifier que son numero n'est pas deja dans la liste
- Utiliser `formatPhoneForTwilio` pour normaliser les numeros avant comparaison

### Changements dans la reponse

- Ajouter `contacts_whatsapp_sent` au JSON de retour pour distinguer les deux sources
- Mettre a jour le log final pour inclure les deux compteurs

### Suppression du early return

Le `return` actuel quand `contact_relationships` est vide (ligne 70-79) sera supprime, car meme sans amis dans cette table, il peut y avoir des contacts a notifier.

### Details techniques

- Import supplementaire de `formatPhoneForTwilio` depuis `_shared/sms-sender.ts`
- Pas de modification de schema necessaire
- La fonction sera re-deployee automatiquement

