

# Plan : Invoquer `birthday-reminder-with-suggestions` et vérifier les logs

## Étapes

### 1. Invoquer la fonction Edge

Appeler `birthday-reminder-with-suggestions` via POST pour déclencher un cycle complet (envoi des templates birthday_friend_alert et birthday_create_fund_nudge).

### 2. Lire les logs Edge Function

Consulter les logs de `birthday-reminder-with-suggestions` pour voir les messages de debug et confirmer l'exécution.

### 3. Vérifier `whatsapp_template_logs`

Requêter les entrées récentes pour `joiedevivre_birthday_create_fund_nudge` et `joiedevivre_birthday_friend_alert` pour confirmer que le logging centralisé fonctionne.

### 4. Vérifier `birthday_contact_alerts`

Requêter les alertes récentes pour confirmer la cohérence entre les deux tables de logs.

## Outils utilisés

| Outil | Action |
|-------|--------|
| `supabase--curl_edge_functions` | Invoquer la fonction |
| `supabase--edge_function_logs` | Lire les logs d'exécution |
| `supabase--read_query` | Vérifier `whatsapp_template_logs` et `birthday_contact_alerts` |

