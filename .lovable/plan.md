

## Plan : Créer la relation et tester l'envoi WhatsApp

### Etape 1 -- Insérer la relation contact_relationships

Insérer une ligne dans `contact_relationships` entre Françoise et Florentin avec `can_see_funds = true` :

- **user_a** : `0b4eb0bb-96dd-4a9d-b7f1-96eaafea95d4` (Françoise)
- **user_b** : `aae8fedd-8b84-4434-bf18-a7b8e78ffab5` (Florentin)
- **relationship_type** : `friend`
- **can_see_funds** : `true`
- **can_see_events** : `true`

### Etape 2 -- Relancer le test notify-business-fund-friends

Appeler la fonction Edge `notify-business-fund-friends` avec les memes parametres :

```text
fund_id:          c694c0d0-2bbe-446d-91de-47d2549b3be3
beneficiary_user_id: 0b4eb0bb-96dd-4a9d-b7f1-96eaafea95d4  (Françoise)
business_name:    NewTech
product_name:     Samsung Galaxy A16 - 2 Sim
target_amount:    88000
currency:         XOF
```

### Resultat attendu

La fonction devrait :
1. Trouver Florentin comme ami de Françoise avec `can_see_funds = true`
2. Creer une notification planifiee et une notification in-app pour Florentin
3. Envoyer le template WhatsApp `joiedevivre_group_contribution` au numero +2250707467445 (Florentin)
4. Retourner `notified_count: 1` et `whatsapp_sent: 1`

### Details techniques

- Aucune modification de schema necessaire
- Insertion de donnees via l'outil insert (pas de migration)
- Test via `curl_edge_functions` pour appeler la fonction deployee
- Verification des logs Edge Function apres le test

