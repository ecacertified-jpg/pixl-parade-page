# Memory: features/birthday-celebration-flow
Updated: now

## Système de célébration d'anniversaire

### Notifications de compte à rebours (J-7, J-5, J-3, J-1)
- **Edge Function** : `birthday-wishes` enrichie avec logique de countdown
- **Template WhatsApp** : `joiedevivre_birthday_countdown` (MARKETING, à créer dans Meta)
  - Header texte : "Joie de Vivre 🎂"
  - Body : "Salut {{1}}, ton anniversaire arrive dans {{2}} jour(s) ! 🎉..."
  - CTA : "Mettre à jour ma wishlist" → https://joiedevivre-africa.com/wishlist
  - Params : {{1}} = Prénom, {{2}} = Nombre de jours
- **Notifications** : In-app (`birthday_countdown`), Push, WhatsApp
- **Déduplication** : Via `birthday_contact_alerts` (alert_type = 'birthday_countdown', days_before = X)
- **Contacts non-inscrits** : WhatsApp envoyé directement + notification in-app au propriétaire

### Célébration au jour J (Dashboard)
- **Table SQL** : `birthday_wishes_messages` — stocke les messages des proches
  - Colonnes : birthday_user_id, sender_id, sender_name, message_text, is_from_fund, fund_id, celebration_year, thanks_sent
  - RLS : le birthday person peut lire, les authenticated peuvent insérer
- **Composant** : `BirthdayCelebrationModal.tsx` — Modal plein écran mobile
  - Étape 1 : Confettis (canvas-confetti) + message puissant personnalisé par âge
  - Étape 2 : Vidéo plein écran depuis bucket `birthday-videos` (autoplay, muted→unmute)
  - Étape 3 : Messages des proches (depuis `birthday_wishes_messages`)
  - Étape 4 : Remerciements personnalisés (textarea + envoi à tous)
- **Edge Function** : `send-birthday-thanks` — envoie des remerciements automatiques
  - Déclenché automatiquement quand la vidéo commence à jouer
  - Remercie les auteurs de messages + contributeurs aux cagnottes
  - In-app + Push
  - Déduplication via `thanks_sent` flag
- **Intégration** : `SmartNotificationsSection.tsx` ouvre automatiquement le modal pour `birthday_wish_ai`
- **Composant notification** : `BirthdayCountdownNotifCard.tsx` — carte in-app pour countdown avec urgence colorée

### Templates WhatsApp
- `joiedevivre_birthday_countdown` : countdown J-7/5/3/1 (needsMetaCreation: true)
- `joiedevivre_birthday_celebration` : vidéo jour J (existant)
- `joiedevivre_birthday_reminder` : rappel utilisateur (existant)
- `joiedevivre_birthday_friend_alert` : alerte amis du cercle (existant)
