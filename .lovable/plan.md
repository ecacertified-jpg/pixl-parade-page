

## Diagnostiquer et corriger la non-reception WhatsApp pour la cagnotte de Francoise

### Probleme identifie

Les 9 messages WhatsApp `joiedevivre_group_contribution` envoyes a 21h13 pour la cagnotte "Samsung Galaxy A16 pour Marie Belle" ont le statut `sent` dans `whatsapp_template_logs`, mais :
- **`whatsapp_message_id` est NULL pour TOUS les logs** (24 sur 24), ce qui confirme que les Edge Functions n'ont pas ete redeployees avec le code de capture du `messageId`
- Sans cet identifiant, le webhook Meta ne peut pas mettre a jour les statuts de delivrabilite (delivered/read/failed)
- Les amis de Francoise n'ont effectivement pas recu les messages

### Causes probables (par ordre de probabilite)

1. **Edge Functions non redeployees** : Le code modifie dans `sms-sender.ts` (capture du `whatsapp_message_id`) n'est pas actif en production
2. **Jeton Meta expire** : Les jetons temporaires expirent apres 24h. L'API Meta peut retourner HTTP 200 mais ne pas envoyer le message
3. **Template suspendu** : Le template `joiedevivre_group_contribution` pourrait etre en pause/rejete dans le Meta Business Manager

### Plan d'action

---

#### Etape 1 : Redeployer les Edge Functions

Deployer les 2 fonctions modifiees pour activer la capture du `whatsapp_message_id` :
- `notify-business-fund-friends`
- `whatsapp-webhook`

Cela permettra de correler les futures callbacks Meta et de diagnostiquer la delivrabilite reelle.

---

#### Etape 2 : Ajouter un endpoint de test WhatsApp

Creer une Edge Function `test-whatsapp-send` qui :
- Envoie un message template de test a un numero specifie
- Retourne la reponse brute de l'API Meta (incluant le `message_id` ou l'erreur exacte)
- Permet de verifier immediatement si le token est valide et le template est approuve

Fichier : `supabase/functions/test-whatsapp-send/index.ts`

Logique :
```text
POST { phone: "+225...", template: "joiedevivre_group_contribution" }

1. Appeler l'API Meta avec le template
2. Retourner la reponse BRUTE (pas juste success/fail)
   - Si 200 : { success: true, message_id: "wamid.xxx", raw: {...} }
   - Si erreur : { success: false, error_code: 190, error: "token expired", raw: {...} }
```

Cela permettra de diagnostiquer en temps reel si le probleme vient du token, du template, ou d'autre chose.

---

#### Etape 3 : Verifier le jeton et relancer les notifications

Apres le test :
- **Si token expire** : L'utilisateur devra generer un nouveau System User Token dans le Meta Business Manager et mettre a jour le secret `WHATSAPP_ACCESS_TOKEN`
- **Si template rejete** : Verifier le statut dans Meta Business Manager > Templates
- **Si tout fonctionne** : Re-invoquer `notify-business-fund-friends` pour la cagnotte de Francoise (fund_id: `8b90f407-8c74-4751-8b1f-b25deb871b5a`) afin de renvoyer les WhatsApp aux amis

---

### Resume des fichiers

| Fichier | Action |
|---------|--------|
| `supabase/functions/notify-business-fund-friends/index.ts` | Redeployer (deja modifie) |
| `supabase/functions/whatsapp-webhook/index.ts` | Redeployer (deja modifie) |
| `supabase/functions/test-whatsapp-send/index.ts` | Creer (endpoint diagnostic) |

### Verification manuelle requise

Apres le deploiement, il faudra :
1. Appeler `test-whatsapp-send` avec un numero de test pour verifier le token et le template
2. Verifier le statut du template dans [Meta Business Manager](https://business.facebook.com/wa/manage/message-templates/)
3. Si tout est OK, relancer la notification pour la cagnotte de Francoise
