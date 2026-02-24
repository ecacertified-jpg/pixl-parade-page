
# Notification WhatsApp client : statut de commande

## Contexte

Actuellement, quand un prestataire accepte ou refuse une commande via `handle-order-action`, le client recoit :
- Une notification in-app (avec un bug `data` au lieu de `metadata`)
- Une notification Push
- Un SMS

Il manque la notification **WhatsApp** via un template HSM, qui est le canal le plus fiable pour les utilisateurs africains.

## Templates WhatsApp a creer dans Meta Business Manager

Deux templates de categorie **Utility** en francais :

### Template 1 : `joiedevivre_order_confirmed`
```
Bonne nouvelle {{1}} ! Votre commande de {{2}} XOF chez {{3}} a ete confirmee. Suivez votre commande sur joiedevivre-africa.com
```
- `{{1}}` : Prenom du client
- `{{2}}` : Montant formate
- `{{3}}` : Nom du prestataire

### Template 2 : `joiedevivre_order_rejected`
```
{{1}}, votre commande de {{2}} XOF chez {{3}} n'a pas pu etre acceptee. Contactez-nous sur joiedevivre-africa.com pour plus d'informations.
```
- `{{1}}` : Prenom du client
- `{{2}}` : Montant formate
- `{{3}}` : Nom du prestataire

**Action manuelle requise** : Ces templates doivent etre soumis et approuves dans le Meta Business Manager avant de fonctionner.

## Modifications techniques

### Fichier : `supabase/functions/handle-order-action/index.ts`

**1. Ajouter les imports WhatsApp**

Importer `sendWhatsAppTemplate` et `formatPhoneForTwilio` depuis le module partage, et le routage SMS intelligent.

**2. Corriger le bug `data` -> `metadata`**

Ligne 182 : remplacer `data:` par `metadata:` dans l'insertion de notification in-app (meme bug que `notify-business-order`).

**3. Ajouter l'envoi WhatsApp au client**

Apres le bloc SMS existant (ligne 268), ajouter un nouveau bloc qui :
- Recupere le prenom du client depuis la table `profiles` (via `customer_id`)
- Determine le template a utiliser selon l'action (`joiedevivre_order_confirmed` ou `joiedevivre_order_rejected`)
- Envoie le template via `sendWhatsAppTemplate` avec les 3 parametres
- Applique le routage intelligent par prefixe pays (WhatsApp toujours, SMS conditionnel)
- Log le resultat

### Structure du nouveau bloc WhatsApp

```text
1. Recuperer le phone du client (donor_phone ou beneficiary_phone)
2. Recuperer le prenom du client (query profiles si customer_id existe, sinon "Client")
3. Choisir le template :
   - accept -> 'joiedevivre_order_confirmed'
   - reject -> 'joiedevivre_order_rejected'
4. Appeler sendWhatsAppTemplate(phone, templateName, 'fr', [prenom, montant, nomBoutique])
5. Logger le resultat
```

## Resultat attendu dans les logs

```
[handle-order-action] Processing action: accept for order: xxx
Accepting order
Customer in-app notification created (metadata OK)
Push sent to: ...
SMS sent: SMxxx
[WhatsApp] Sending joiedevivre_order_confirmed to customer
[WhatsApp] Status notification sent: wamid.xxx
Order xxx accepted successfully
```

## Points d'attention

- Les templates doivent etre approuves par Meta avant de fonctionner (sinon erreur silencieuse loguee)
- Le WhatsApp est envoye en best-effort : un echec ne bloque pas le flux
- La correction `data` -> `metadata` est incluse pour eviter l'erreur schema cache deja connue
