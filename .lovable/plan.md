
# Création d'une fonction de vérification du statut SMS Twilio

## Contexte

Les SMS sont correctement envoyés à Twilio (statut `queued`), mais nous n'avons aucun moyen de vérifier s'ils ont été effectivement livrés au destinataire. Twilio fournit une API pour récupérer le statut de livraison d'un message via son SID.

### Messages à vérifier
| SID | Source | Heure |
|-----|--------|-------|
| SM8be8c54159e36d9c1529bf9740ca3ba5 | notify-contact-added | 23:21 |
| SM7a7d320aa79f633386e06d4de68873c2 | test-sms (diagnostic) | 23:25 |
| SM9db12b8c2dd19449709dd2ce4ae4a568 | test-sms (diagnostic) | 23:28 |

### Statuts possibles Twilio
| Statut | Signification |
|--------|---------------|
| queued | En attente d'envoi |
| sent | Envoyé à l'opérateur |
| delivered | Livré au téléphone |
| undelivered | Échec de livraison |
| failed | Erreur d'envoi |

---

## Solution

Créer une Edge Function `check-sms-status` qui interroge l'API Twilio pour obtenir le statut de livraison d'un ou plusieurs messages.

### Nouvelle Edge Function: `supabase/functions/check-sms-status/index.ts`

```javascript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  // Récupérer le(s) SID(s) à vérifier
  const { sid, sids } = await req.json();
  
  const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
  
  // Appeler l'API Twilio GET /Messages/{SID}.json
  const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages/${sid}.json`;
  
  const response = await fetch(twilioUrl, {
    headers: {
      'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`)
    }
  });
  
  const data = await response.json();
  
  return {
    sid: data.sid,
    to: data.to,
    status: data.status,           // queued, sent, delivered, undelivered, failed
    error_code: data.error_code,   // Code d'erreur si échec
    error_message: data.error_message,
    date_sent: data.date_sent,
    date_updated: data.date_updated
  };
});
```

---

## Fichiers à créer/modifier

| Fichier | Action |
|---------|--------|
| `supabase/functions/check-sms-status/index.ts` | Créer |

---

## Utilisation après création

Une fois la fonction déployée, je pourrai vérifier le statut des 3 SMS envoyés :

```bash
# Vérifier le statut du SMS de bienvenue
curl /check-sms-status --data '{"sid": "SM8be8c54159e36d9c1529bf9740ca3ba5"}'

# Vérifier les SMS de test
curl /check-sms-status --data '{"sids": ["SM7a7d320aa79f633386e06d4de68873c2", "SM9db12b8c2dd19449709dd2ce4ae4a568"]}'
```

---

## Résultats attendus

Cette fonction permettra de :
1. Confirmer si les SMS sont livrés (`delivered`) ou échoués (`undelivered`/`failed`)
2. Identifier les codes d'erreur Twilio spécifiques
3. Diagnostiquer les problèmes de livraison (opérateur, numéro invalide, etc.)
