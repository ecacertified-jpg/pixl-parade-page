

# Diagnostic et correction de la delivrabilite WhatsApp

## Probleme identifie

Sur 66 messages WhatsApp template envoyes, **aucun** n'a recu le statut `delivered` ou `read` via le webhook Meta. Tous restent a `sent`. Cela indique que le webhook ne recoit pas correctement les callbacks de statut de Meta, rendant impossible le suivi de la delivrabilite reelle.

Les OTP pour les deux numeros (+2250707467445 et +2250708895257) ont ete "acceptes" par l'API Meta mais jamais livres, sans aucune alerte cote application.

## Causes probables

1. **Webhook Meta mal configure** : le champ `messages` est abonne mais les statuts ne remontent pas
2. **Pas de logging des payloads bruts** dans le webhook, donc impossible de diagnostiquer
3. **Pas d'outil de test** pour verifier la delivrabilite d'un numero specifique

## Plan de correction

### Etape 1 : Ajouter un logging complet au webhook

**Fichier** : `supabase/functions/whatsapp-webhook/index.ts`

Ajouter un log JSON complet du payload brut recu par le webhook AVANT tout traitement. Cela permettra de verifier si Meta envoie effectivement les statuts ou non.

```text
// Au debut du handler POST, juste apres const body = await req.json();
console.log('WEBHOOK_RAW_PAYLOAD:', JSON.stringify(body).substring(0, 2000));
```

Egalement, ajouter un log specifique quand des statuts sont traites :

```text
if (value.statuses) {
  console.log('STATUS_CALLBACKS:', JSON.stringify(value.statuses));
  // ... traitement existant
}
```

### Etape 2 : Creer un endpoint de diagnostic de delivrabilite

**Nouveau fichier** : `supabase/functions/check-whatsapp-delivery/index.ts`

Cet endpoint permettra de :
- Envoyer un message test a un numero specifique
- Attendre la reponse de l'API Meta et retourner les details complets (wa_id, message_id, erreurs)
- Verifier si le numero est enregistre sur WhatsApp via l'API contacts de Meta

Parametres : `{ phone: "+2250707467445" }`

Reponse : statut Meta brut incluant le `wa_id` retourne, ce qui permettra de detecter le probleme de mapping 8/10 chiffres pour les numeros ivoiriens.

### Etape 3 : Enregistrer les OTP dans whatsapp_template_logs

**Fichier** : `supabase/functions/send-whatsapp-otp/index.ts`

Actuellement, les OTP ne sont pas enregistres dans `whatsapp_template_logs`, ce qui empeche leur suivi unifie. Ajouter un insert dans cette table apres chaque envoi OTP reussi :

```text
await supabaseAdmin.from('whatsapp_template_logs').insert({
  template_name: 'joiedevivre_otp',
  recipient_phone: maskedPhone,
  country_prefix: phone.substring(0, 4),
  whatsapp_message_id: messageId,
  status: 'sent',
  template_params: { purpose }
});
```

Cela permettra au dashboard WhatsApp Templates existant de suivre aussi les OTP.

### Etape 4 : Deployer et diagnostiquer

1. Deployer les 3 fonctions modifiees
2. Utiliser `check-whatsapp-delivery` pour tester les deux numeros problematiques
3. Consulter les logs du webhook pour verifier si Meta envoie les callbacks de statut
4. Si Meta ne les envoie pas, il faudra reconfigurer l'abonnement webhook dans le Meta Business Manager (champ `message_deliveries` en plus de `messages`)

## Fichiers concernes

| Fichier | Modification |
|---------|-------------|
| `supabase/functions/whatsapp-webhook/index.ts` | Logging du payload brut et des statuts |
| `supabase/functions/send-whatsapp-otp/index.ts` | Ajout d'un insert dans `whatsapp_template_logs` |
| `supabase/functions/check-whatsapp-delivery/index.ts` | Nouvel endpoint de diagnostic (test d'un numero + verification contacts Meta) |
| `supabase/config.toml` | Ajout de la config pour la nouvelle fonction (verify_jwt = false) |

## Resultat attendu

- Les logs du webhook permettront de confirmer si Meta envoie les callbacks ou non
- L'endpoint de diagnostic permettra de tester immediatement les deux numeros
- Les OTP apparaitront dans le dashboard WhatsApp Templates pour un suivi unifie
- Si Meta ne renvoie pas les statuts, un message clair indiquera de reconfigurer l'abonnement webhook dans le Meta Business Manager

