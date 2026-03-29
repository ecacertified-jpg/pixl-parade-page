

# Plan : Diagnostiquer et corriger l'erreur #132001 sur joiedevivre_birthday_reminder

## Diagnostic

Les logs `whatsapp_template_logs` montrent 100% d'echecs avec `(#132001) Template name does not exist` pour le template `joiedevivre_birthday_reminder`. Le template est approuve dans Meta mais l'API ne le reconnait pas.

## Actions a realiser

### 1. Verifier la correspondance WABA / Phone Number ID

Dans le Supabase Dashboard (Edge Functions secrets), verifier que `WHATSAPP_PHONE_NUMBER_ID` correspond bien au numero associe au WABA ou le template est approuve. Un template approuve sur un WABA A ne fonctionne pas avec un numero du WABA B.

### 2. Verifier le nom exact du template

Dans Meta Business Suite > WhatsApp Manager > Message Templates, copier le nom exact du template (attention aux underscores vs tirets, majuscules, espaces invisibles). Le comparer caractere par caractere avec `joiedevivre_birthday_reminder`.

### 3. Tester l'appel API manuellement

Executer un test via curl dans le terminal Supabase ou via l'outil de test Edge Function pour isoler le probleme :

```bash
curl -X POST "https://graph.facebook.com/v18.0/PHONE_NUMBER_ID/messages" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "to": "22901XXXXXXX",
    "type": "template",
    "template": {
      "name": "joiedevivre_birthday_reminder",
      "language": {"code": "fr"},
      "components": [{"type": "body", "parameters": [{"type": "text", "text": "Test"}, {"type": "text", "text": "7"}]}]
    }
  }'
```

### 4. Si le nom differe, corriger dans le code

Mettre a jour le nom du template dans les 2 fichiers Edge Functions qui l'utilisent :

| Fichier | Ligne |
|---------|-------|
| `supabase/functions/check-birthday-alerts-for-contacts/index.ts` | 203 |
| `supabase/functions/birthday-reminder-with-suggestions/index.ts` | 297 |
| `supabase/functions/check-whatsapp-template-health/index.ts` | 11 |
| `src/hooks/useWhatsAppTemplateInventory.ts` | 25 |

### 5. Verifier la version de l'API Graph

Le code utilise `v18.0` de l'API Graph Facebook. Si le template a ete cree recemment, il peut necessiter une version plus recente (ex: `v21.0`). Mettre a jour dans `sms-sender.ts` ligne 409 si necessaire.

## Prochaine etape immediate

Avant tout changement de code, l'utilisateur doit verifier dans Meta Business Suite que le nom et le WABA sont corrects. Si le nom est identique et le WABA correct, le probleme vient probablement de la version de l'API ou d'un delai de propagation.

