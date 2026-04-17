# Memory: features/birthday-celebration-flow
Updated: now

## Système de célébration d'anniversaire

### Notifications de compte à rebours pour le célébré (J-7, J-5, J-3, J-1)
- **Edge Function** : `birthday-wishes` (PART A) — countdown au célébré
- **Template WhatsApp** : `joiedevivre_birthday_countdown` (MARKETING ✅)
- **Déduplication** : `birthday_contact_alerts` (alert_type = 'birthday_countdown', days_before = X)

### Invitations aux amis du célébré (J-45, 40, 35, 30, 25, 20, 15, 13, 11, 9, 7, 5, 4, 3, 2, 1)
- **Edge Function** : `birthday-wishes` (PART A2) — invite friends to engage on birthday page
- **Template WhatsApp** : `joiedevivre_birthday_page_invite` (MARKETING)
  - Header image : env `BIRTHDAY_PAGE_INVITE_IMAGE_URL` ou bucket `assets/birthday-page-invite.jpeg`
  - Body 4 params : {{1}} prénom destinataire, {{2}} prénom célébré, {{3}} jours, {{4}} slug page (bouton)
  - CTA URL : `https://joiedevivre-africa.com/birthday/{{1}}` (slug page)
- **Cibles** : amis inscrits via `contact_relationships` + contacts non-inscrits du célébré
- **Déduplication** : `birthday_contact_alerts` (alert_type = 'friend_page_invite', days_before, contact_phone)
- **Pré-requis** : page d'anniversaire active (`birthday_pages.is_active=true`) — créée auto à l'onboarding

### Notifications d'activité au célébré (temps réel)
- **Edge Function** : `notify-birthday-page-activity` (verify_jwt = true)
- **Template WhatsApp** : `joiedevivre_birthday_page_activity` (UTILITY)
  - Body 3 params : {{1}} prénom célébré, {{2}} prénom ami, {{3}} action label
  - CTA URL : `https://joiedevivre-africa.com/birthday/{{1}}` (slug page)
- **Triggers** (depuis le client) :
  - Photo / Vidéo / Souvenir → `FeedCardActions.tsx` après insert dans `birthday_page_photos`
  - Promesse de cadeau → `FeedCardActions.tsx` après insert dans `page_gift_promises`
  - Contribution cagnotte → `ContributionModal.tsx` après insert dans `fund_contributions` (si fund lié à birthday_page)
- **Anti-spam** : table `birthday_page_activity_notifs` — déduplique `(page_id, actor_id, action_type)` sur 1h
- **Garde-fou** : ignore si actor === célébré (auto-action)
- **Notification in-app** : `scheduled_notifications` (notification_type = 'birthday_page_activity')

### Célébration au jour J (Dashboard)
- **Table SQL** : `birthday_wishes_messages`
- **Composant** : `BirthdayCelebrationModal.tsx` — modal 4 étapes (confettis, vidéo, messages, remerciements)
- **Edge Function** : `send-birthday-thanks` (auto au lancement vidéo)

### Templates WhatsApp (synchronisés Meta ✅ ou à créer 🟡)
- `joiedevivre_birthday_countdown` ✅ — countdown utilisateur inscrit
- `joiedevivre_birthday_countdown_invite` ✅ — countdown contact non-inscrit
- `joiedevivre_birthday_celebration` ✅ — vidéo jour J
- `joiedevivre_birthday_reminder` ✅ — rappel utilisateur
- `joiedevivre_birthday_friend_alert` ✅ — alerte amis du cercle
- `joiedevivre_birthday_page_invite` 🟡 — **À créer dans Meta** (MARKETING, 4 params, header image, bouton URL slug)
- `joiedevivre_birthday_page_activity` 🟡 — **À créer dans Meta** (UTILITY, 3 params, bouton URL slug)
