

## Corriger les contraintes de `birthday_contact_alerts`

### Probleme

L'edge function `check-friends-circle-reminders` echoue silencieusement lors de l'insertion car :

1. **CHECK `alert_type`** : n'accepte que `['immediate', 'month', 'two_weeks', 'daily']`, mais le code utilise `'friends_circle_welcome'` et `'friends_circle_reminder'`
2. **`contact_id` NOT NULL + FK** : le code passe `user_id` comme `contact_id`, mais `contact_id` reference `contacts(id)` — un user_id n'est pas un contact_id valide
3. **Pas de gestion d'erreur** : les inserts echouent silencieusement sans log

### Corrections

**A. Migration SQL** (1 migration)

1. Modifier le CHECK constraint `alert_type` pour ajouter les nouvelles valeurs :
   ```sql
   ALTER TABLE birthday_contact_alerts 
     DROP CONSTRAINT birthday_contact_alerts_alert_type_check;
   ALTER TABLE birthday_contact_alerts 
     ADD CONSTRAINT birthday_contact_alerts_alert_type_check 
     CHECK (alert_type = ANY (ARRAY[
       'immediate', 'month', 'two_weeks', 'daily',
       'contact_added', 'friends_circle_welcome', 'friends_circle_reminder'
     ]));
   ```

2. Rendre `contact_id` nullable et conserver la FK :
   ```sql
   ALTER TABLE birthday_contact_alerts 
     ALTER COLUMN contact_id DROP NOT NULL;
   ```

**B. Edge function** (`supabase/functions/check-friends-circle-reminders/index.ts`)

1. Passer `contact_id: null` au lieu de `contact_id: userId` (le user n'est pas un contact)
2. Ajouter une gestion d'erreur explicite sur chaque insert avec log de l'erreur :
   ```typescript
   const { error: insertError } = await supabaseAdmin
     .from('birthday_contact_alerts').insert({...});
   if (insertError) {
     console.error('Failed to record alert:', insertError.message);
   }
   ```
3. Appliquer la meme correction aux deux blocs d'insert (welcome mode ligne 73 et CRON mode ligne 161)

### Fichiers modifies

| Fichier | Modification |
|---------|-------------|
| Migration SQL | DROP + ADD CHECK constraint, ALTER COLUMN nullable |
| `supabase/functions/check-friends-circle-reminders/index.ts` | `contact_id: null` + gestion d'erreur sur les inserts |

### Impact
- Les alertes welcome et reminder seront correctement enregistrees en base
- La deduplication serveur fonctionnera (plus besoin de `localStorage` seul)
- Aucun impact sur les alertes existantes (`immediate`, `month`, etc.)

