
## Deploiement de la Edge Function whatsapp-webhook

### Objectif
Deployer la fonction `whatsapp-webhook` pour que Meta puisse verifier et envoyer les messages WhatsApp.

### Etape 1 : Deployer la fonction
Utiliser l'outil de deploiement automatique pour publier `whatsapp-webhook` sur Supabase.

### Etape 2 : Verifier le deploiement
Tester avec un appel GET simulant la verification Meta :
```text
GET /whatsapp-webhook?hub.mode=subscribe&hub.verify_token=joiedevivre_webhook_2025&hub.challenge=test123
```
La reponse attendue est `test123` avec un status 200.

### Etape 3 : Actions utilisateur
Apres deploiement confirme, retourner dans Meta et cliquer sur "Verifier et enregistrer" avec les memes parametres.

### Details techniques
- Aucune modification de code necessaire
- La configuration `verify_jwt = false` est deja en place dans `config.toml`
- Les secrets (`WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_VERIFY_TOKEN`, `LOVABLE_API_KEY`) sont deja configures
