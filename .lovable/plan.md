
# Envoi SMS + WhatsApp simultane lors de l'ajout d'un contact

## Objectif
Modifier la fonction `notify-contact-added` pour envoyer les notifications sur **les deux canaux** (SMS et WhatsApp) au lieu d'un seul, selon les preferences de l'utilisateur.

## Changements

### Fichier : `supabase/functions/notify-contact-added/index.ts`

**1. Construire deux messages distincts (SMS + WhatsApp)**

Au lieu de choisir un seul canal et un seul message, la fonction construira systematiquement :
- Un **message SMS** (court, sans emojis, moins de 160 caracteres)
- Un **message WhatsApp** (avec emojis, plus detaille)

**2. Envoyer sur les deux canaux en parallele**

Remplacer la logique "soit SMS soit WhatsApp" par un envoi simultane :
- Si `sms_enabled` dans les preferences : envoyer le SMS
- Si `whatsapp_enabled` dans les preferences : envoyer le WhatsApp
- Les deux envois se font en parallele via `Promise.allSettled()`

**3. Enregistrer un log par canal**

Au lieu d'un seul enregistrement dans `birthday_contact_alerts`, inserer une ligne par canal utilise (SMS et/ou WhatsApp) pour un suivi precis.

**4. Reponse enrichie**

La reponse inclura le resultat de chaque canal (succes/echec par canal).

## Details techniques

La structure du code modifie sera :

```text
1. Construire smsMessage (court, sans emoji)
2. Construire whatsappMessage (avec emojis, detaille)
3. Lancer en parallele :
   - sendSms() si preferences.sms_enabled
   - sendWhatsApp() si preferences.whatsapp_enabled
4. Inserer un log par canal dans birthday_contact_alerts
5. Retourner le resultat combine
```

## Impact
- La fonction sera redeployee automatiquement apres modification
- Aucun changement de base de donnees necessaire (la table `birthday_contact_alerts` supporte deja plusieurs lignes par contact)
- Les preferences utilisateur (`sms_enabled`, `whatsapp_enabled`) sont respectees individuellement
