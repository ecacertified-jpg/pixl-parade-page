

## Probleme identifie

La Edge Function `whatsapp-webhook` existe dans le code (`supabase/functions/whatsapp-webhook/index.ts`) mais **n'est pas deployee** sur Supabase. Quand Meta envoie la requete de verification, elle recoit une erreur 404 (fonction introuvable).

C'est pourquoi le bouton "Verifier et enregistrer" ne fonctionne pas dans Meta.

## Plan d'action

### Etape 1 : Deployer la Edge Function

Deployer `whatsapp-webhook` sur Supabase pour qu'elle soit accessible a l'URL :
```text
https://vaimfeurvzokepqqqrsl.supabase.co/functions/v1/whatsapp-webhook
```

### Etape 2 : Verifier le deploiement

Tester la fonction avec un appel GET simulant la verification Meta :
```text
GET /whatsapp-webhook?hub.mode=subscribe&hub.verify_token=joiedevivre_webhook_2025&hub.challenge=test123
```

La fonction doit repondre avec `test123` (le challenge) et un status 200.

### Etape 3 : Re-verifier dans Meta

Une fois la fonction deployee et testee, retourner dans Meta et cliquer a nouveau sur **"Verifier et enregistrer"** avec :
- **URL de rappel** : `https://vaimfeurvzokepqqqrsl.supabase.co/functions/v1/whatsapp-webhook`
- **Verifier le token** : `joiedevivre_webhook_2025`

### Etape 4 : S'abonner aux evenements

Apres verification reussie, cocher le champ **"messages"** dans les abonnements webhook pour recevoir les messages entrants.

---

### Details techniques

- La fonction est configuree avec `verify_jwt = false` dans `config.toml` (correct, car Meta ne peut pas envoyer de JWT)
- Les secrets necessaires (`WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_VERIFY_TOKEN`, `LOVABLE_API_KEY`) sont deja configures
- Aucune modification de code n'est necessaire, seulement le deploiement

