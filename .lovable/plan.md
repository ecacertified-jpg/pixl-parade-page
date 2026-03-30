

# Plan : Invoquer manuellement `notify-contacts-join-reminder` et vérifier les logs

## Étapes

### 1. Invoquer la fonction Edge via `curl_edge_functions`

Appeler `notify-contacts-join-reminder` avec une requête POST vide pour déclencher les deux phases (contacts non inscrits + utilisateurs sans cercle).

### 2. Vérifier les résultats dans les logs Edge Function

Consulter les logs de la fonction pour voir le détail : combien de contacts/utilisateurs ciblés, envois réussis, skippés (dédup), erreurs.

### 3. Vérifier `whatsapp_template_logs`

Requêter la table pour confirmer que de nouvelles entrées avec `template_name = 'joiedevivre_join_reminder'` et `status = 'sent'` apparaissent après l'invocation.

### 4. Vérifier `birthday_contact_alerts`

Requêter les alertes de type `join_reminder` et `join_reminder_registered` pour confirmer la déduplication fonctionne.

## Outils utilisés

| Outil | Action |
|-------|--------|
| `supabase--curl_edge_functions` | Invoquer `notify-contacts-join-reminder` |
| `supabase--edge_function_logs` | Lire les logs d'exécution |
| `supabase--read_query` | Vérifier `whatsapp_template_logs` et `birthday_contact_alerts` |

