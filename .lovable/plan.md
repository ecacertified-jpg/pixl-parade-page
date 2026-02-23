

# Notification SMS et Push au client lors de l'acceptation/refus de commande

## Probleme actuel

Quand un prestataire accepte ou refuse une commande dans `handle-order-action`, le client recoit uniquement une **notification in-app** (dans la base de donnees). Il manque :

- **Aucun SMS** envoye au client
- **Aucun push** reellement envoye (le code aux lignes 166-176 ne fait que logger sans envoyer)

Le client doit ouvrir l'application pour decouvrir le statut de sa commande, ce qui est une mauvaise experience.

## Solution

Ameliorer la Edge Function `handle-order-action` pour envoyer au client :
1. Un **SMS** avec le statut de sa commande (via le module `sms-sender.ts` existant)
2. Des **notifications push** reelles (via le meme pattern que `notify-business-order`)

## Changements techniques

### Fichier unique : `supabase/functions/handle-order-action/index.ts`

**1. Ajouter l'import du module SMS partage**
```text
import { sendSms, shouldUseSms } from "../_shared/sms-sender.ts";
```

**2. Recuperer le telephone du client dans la requete SQL existante**

Ajouter `donor_phone` et `beneficiary_phone` dans le SELECT de la commande pour avoir le numero du client.

**3. Envoyer les push notifications au client** (remplacer le bloc commentaire lignes 166-176)

Utiliser le meme pattern que `notify-business-order` :
- Recuperer les `push_subscriptions` actives du client
- Envoyer via `fetch()` vers l'endpoint de chaque subscription
- Mettre a jour `last_used_at` ou desactiver les subscriptions echouees

**4. Envoyer un SMS au client**

Apres les push, envoyer un SMS au numero du client (priorite `donor_phone`) :
- Acceptation : `JoieDvivre: Bonne nouvelle! Votre commande #XXXXXXXX chez {nom} est confirmee. Suivez-la sur joiedevivre-africa.com`
- Refus : `JoieDvivre: Votre commande #XXXXXXXX chez {nom} n'a pas pu etre acceptee. Contactez-nous sur joiedevivre-africa.com`

Messages optimises a moins de 160 caracteres, ton informel, sans emojis (pour la delivrabilite SMS).

### Aucun autre fichier modifie

Le module `sms-sender.ts` et l'infrastructure push existent deja. Pas de migration SQL necessaire.

## Deploiement

La Edge Function `handle-order-action` devra etre deployee manuellement via le CLI Supabase :
```text
supabase functions deploy handle-order-action --project-ref vaimfeurvzokepqqqrsl
```

