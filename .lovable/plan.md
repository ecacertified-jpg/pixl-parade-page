

# Notification WhatsApp : rappel cercle d'amis

## Contexte

Quand un utilisateur s'inscrit ou n'a pas encore atteint le minimum de 2 amis dans son cercle, il faut lui envoyer un rappel WhatsApp pour l'encourager a ajouter des amis. Le message doit aussi mentionner que plus il ajoute d'amis, plus il maximise ses chances de recevoir un cadeau de sa liste de souhaits.

## Templates WhatsApp a creer dans Meta Business Manager

Deux templates de categorie **Utility** en francais :

### Template 1 : `joiedevivre_welcome_add_friends`
Usage : envoye juste apres l'inscription, quand le profil est complete (birthday + city renseignes).

```
Bienvenue {{1}} ! Ajoute au moins 2 amis a ton cercle pour commencer a recevoir des cadeaux. Plus tu ajoutes d'amis, plus tu maximises tes chances d'obtenir un cadeau de ta liste de souhaits. Commence ici: joiedevivre-africa.com/contacts
```
- `{{1}}` : Prenom de l'utilisateur

### Template 2 : `joiedevivre_friends_circle_reminder`
Usage : envoye par le CRON quotidien aux utilisateurs qui n'ont pas encore 2 amis.

```
{{1}}, ton cercle d'amis n'est pas encore complet ! Ajoute des proches pour maximiser tes chances de recevoir un cadeau de ta liste de souhaits. Tu peux ajouter autant d'amis que tu veux. Ajoute-les ici: joiedevivre-africa.com/contacts
```
- `{{1}}` : Prenom de l'utilisateur

**Action manuelle requise** : Ces templates doivent etre soumis et approuves dans le Meta Business Manager avant de fonctionner.

## Modifications techniques

### 1. Nouvelle Edge Function : `check-friends-circle-reminders`

CRON quotidien (a configurer a 09h00 UTC par exemple) qui :

1. Recupere tous les utilisateurs avec profil complet (birthday + city non null)
2. Pour chaque utilisateur, compte ses contacts dans la table `contacts`
3. Si le nombre de contacts est inferieur a 2 :
   - Verifie qu'un rappel n'a pas deja ete envoye dans les dernieres 72h (table `birthday_contact_alerts` avec `alert_type = 'friends_circle_reminder'`)
   - Recupere le telephone et prenom de l'utilisateur depuis `profiles`
   - Envoie le template `joiedevivre_friends_circle_reminder` via `sendWhatsAppTemplate`
   - Enregistre le resultat dans `birthday_contact_alerts`

```text
Fichier : supabase/functions/check-friends-circle-reminders/index.ts

Imports :
  - serve, createClient
  - sendWhatsAppTemplate, sendSms, getPreferredChannel depuis _shared/sms-sender.ts

Logique :
  1. Query: SELECT user_id, first_name, phone FROM profiles WHERE birthday IS NOT NULL AND city IS NOT NULL AND phone IS NOT NULL
  2. Pour chaque user:
     a. COUNT contacts WHERE user_id = user.user_id
     b. Si count < 2:
        - Check birthday_contact_alerts pour alert_type='friends_circle_reminder' dans les 72 dernieres heures
        - Si pas de rappel recent: envoyer WhatsApp template + SMS (si canal fiable)
        - Inserer dans birthday_contact_alerts avec alert_type='friends_circle_reminder'
  3. Retourner le nombre de rappels envoyes
```

### 2. Modifier `useFriendsCircleReminder.ts` (hook client)

Ajouter l'envoi du template WhatsApp de bienvenue (`joiedevivre_welcome_add_friends`) dans la logique existante. Quand le profil est complete et que l'utilisateur a 0 contacts :

- Ajouter une fonction `sendWelcomeWhatsApp` qui appelle une Edge Function existante ou cree une invocation directe
- Utiliser un flag localStorage `friends_circle_welcome_wa_sent_{userId}` pour eviter les doublons
- Declenchement : dans le `checkReminderStatus`, apres avoir determine que `isProfileComplete && contactsCount === 0`

Concretement, ajouter un appel a `supabase.functions.invoke('check-friends-circle-reminders', { body: { user_id: user.id, mode: 'welcome' } })` pour declencher l'envoi du template de bienvenue a l'utilisateur lui-meme.

### 3. Mettre a jour l'Edge Function pour supporter le mode "welcome"

L'Edge Function `check-friends-circle-reminders` acceptera un parametre optionnel `mode`:
- `mode: 'welcome'` : envoie le template `joiedevivre_welcome_add_friends` a un seul utilisateur (appele depuis le client)
- Pas de mode (CRON) : parcourt tous les utilisateurs pour le rappel periodique `joiedevivre_friends_circle_reminder`

### 4. Configuration CRON

Ajouter une tache CRON dans Supabase via SQL :

```text
SELECT cron.schedule(
  'check-friends-circle-reminders-daily',
  '0 9 * * *',
  net.http_post(
    url := 'https://vaimfeurvzokepqqqrsl.supabase.co/functions/v1/check-friends-circle-reminders',
    headers := '{"Authorization": "Bearer SERVICE_ROLE_KEY", "Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  )
);
```

## Resultat attendu

### A l'inscription (mode welcome)
```
[check-friends-circle-reminders] Welcome mode for user: xxx
[WhatsApp Template] Sending "joiedevivre_welcome_add_friends" to 22507***
[WhatsApp Template] Sent successfully: wamid.xxx
```

### CRON quotidien
```
Starting check-friends-circle-reminders CRON job...
Found 15 users with incomplete circles
User xxx: 0 contacts, sending reminder
[WhatsApp Template] Sending "joiedevivre_friends_circle_reminder" to 22507***
[WhatsApp Template] Sent successfully: wamid.xxx
CRON completed: 8 reminders sent, 0 errors
```

## Points d'attention

- Les templates doivent etre approuves par Meta avant de fonctionner
- Le rappel CRON est espace de 72h pour eviter le spam
- Le message de bienvenue n'est envoye qu'une seule fois (flag localStorage + check en base)
- Le WhatsApp est en best-effort : un echec ne bloque pas le flux
- La table `birthday_contact_alerts` est reutilisee avec un nouveau `alert_type` pour eviter de creer une nouvelle table

