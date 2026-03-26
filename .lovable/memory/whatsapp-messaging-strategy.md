La stratégie de messagerie WhatsApp privilégie les modèles HSM (Highly Structured Messages) pour contourner la 'fenêtre de 24 heures' de Meta. L'utilitaire 'sendWhatsAppTemplate' est utilisé pour les notifications suivantes :

## Templates actifs

- `joiedevivre_otp` — Vérification OTP
- `joiedevivre_contact_added` — Notification d'ajout de contact
- `joiedevivre_birthday_reminder` — Rappel d'anniversaire (à l'utilisateur)
- `joiedevivre_birthday_friend_alert` — Alerte aux amis du cercle quand l'anniversaire d'un bénéficiaire approche (avec CTA vers cagnotte). 4 paramètres body : prénom bénéficiaire, jours restants, prénom organisateur, montant objectif. Header image. Bouton CTA : /f/{fund_id}
- `joiedevivre_birthday_create_fund_nudge` — Incite les proches à CRÉER une cagnotte quand aucune n'existe (J-15). 4 paramètres body : prénom bénéficiaire, dayLabel, prénom destinataire, 'JOIE DE VIVRE'. Header image. Bouton CTA dynamique : /go/birthday?for={{1}}. Remplace `joiedevivre_birthday_no_fund_alert` pour la notification sans cagnotte.
- `joiedevivre_birthday_celebration` — Vidéo de célébration envoyée à l'utilisateur le jour de son anniversaire. 2 paramètres body : prénom, message personnalisé. **Header vidéo** (MP4, max 16 Mo). Bouton CTA : /dashboard/{suffix}. Fallback texte libre si template échoue.
- `joiedevivre_refund_alert` — Alerte de remboursement
- `joiedevivre_contribution_reminder` — Rappel de contribution
- `joiedevivre_gift_order` — Notification de cadeau commandé
- `joiedevivre_group_contribution` — Invitation aux cagnottes groupées (amis du bénéficiaire)
- `joiedevivre_fund_beneficiary_invite` — Invitation du bénéficiaire non inscrit
- `joiedevivre_contribution_update` — **Template unifié** : informe contributeurs ET non-contributeurs de la progression (%) et des jours restants. Remplace l'ancien template `joiedevivre_contribution_nudge` qui a été abandonné (rejeté par Meta pour similarité avec `_contribution_reminder`).
- `joiedevivre_fund_ready` — Alerte prestataire quand la cagnotte atteint 100%
- `joiedevivre_fund_completed` — Félicitations envoyées à tous les amis (contributeurs + non-contributeurs) quand la cagnotte atteint 100%. 4 paramètres : prénom, titre cagnotte, nom bénéficiaire, montant. Bouton CTA : /f/{fund_id}
- `joiedevivre_new_order` — Notification au prestataire lors d'une nouvelle commande. 3 paramètres body : `{{1}}` nom client, `{{2}}` montant, `{{3}}` résumé commande. Body : `*Nouvelle commande sur Joie de Vivre !* Client : {{1}} Montant : {{2}} XOF Commande : {{3}} Connectez-vous pour accepter ou refuser cette commande.` Bouton CTA statique : "Connectez-vous" → `https://joiedevivre-africa.com/business-account?tab=orders`. Fonction Edge : `notify-business-order`.
- `joiedevivre_order_confirmed` — Confirmation de commande envoyée au client. 3 paramètres body : `{{1}}` prénom client, `{{2}}` montant, `{{3}}` nom boutique. Body : `Bonne nouvelle {{1}} ! Votre commande de {{2}} XOF chez {{3}} a ete confirmee. Suivez votre commande sur joiedevivre-africa.com`. Pas de bouton CTA. Fonction Edge : `handle-order-action`.
- `joiedevivre_order_rejected` — Rejet de commande envoyé au client. 3 paramètres body : `{{1}}` prénom client, `{{2}}` montant, `{{3}}` nom boutique. Body : `Bonjour {{1}}, votre commande de {{2}} XOF chez {{3}} n'a pas pu etre acceptee. Contactez-nous sur joiedevivre-africa.com pour plus d'informations.` Pas de bouton CTA. Fonction Edge : `handle-order-action`.
- `joiedevivre_join_reminder` — Rappel d'inscription envoyé aux contacts non inscrits ajoutés il y a > 7 jours. 1 paramètre body : nom de l'ami qui a ajouté. Bouton CTA : lien vers joiedevivre-africa.com. Fonction Edge : `notify-contacts-join-reminder`.
- `joiedevivre_delivery_reminder` — Rappel de confirmation de livraison au client. 3 paramètres body : prénom client, ID commande, nom boutique. Bouton CTA dynamique : `/orders/{{1}}`. Fonction Edge : `check-delivery-confirmation-reminder`.
- `joiedevivre_welcome_add_friends` — Message de bienvenue post-inscription incitant à ajouter des amis. 1 paramètre body : prénom utilisateur. Bouton CTA : /contacts. Fonction Edge : `check-friends-circle-reminders` (envoi unique après inscription).
- `joiedevivre_friends_circle_reminder` — Rappel périodique pour étoffer son cercle d'amis. 1 paramètre body : prénom utilisateur. Bouton CTA : /contacts. Fonction Edge : `check-friends-circle-reminders` (CRON).

## Templates supprimés / remplacés

- ~~`joiedevivre_contribution_nudge`~~ — Abandonné. Fusionné dans `joiedevivre_contribution_update`.
- ~~`joiedevivre_birthday_no_fund_alert`~~ — Remplacé par `joiedevivre_birthday_create_fund_nudge` qui incite à créer une cagnotte au lieu de rediriger vers /shop.

## Templates à créer dans Meta Business Manager

Les 5 templates suivants sont utilisés dans le code (Edge Functions) mais doivent encore être créés et approuvés dans Meta Business Manager :

| Template | Catégorie Meta | Paramètres body | Header | Bouton CTA | Fonction Edge |
|----------|---------------|-----------------|--------|------------|---------------|

| `joiedevivre_join_reminder` | MARKETING | `{{1}}` nom de l'ami qui a ajouté | — | CTA statique → `https://joiedevivre-africa.com` | `notify-contacts-join-reminder` |
| `joiedevivre_delivery_reminder` | UTILITY | `{{1}}` prénom client, `{{2}}` ID commande, `{{3}}` nom boutique | — | CTA dynamique → Base URL `https://joiedevivre-africa.com/orders/` + `{{1}}` | `check-delivery-confirmation-reminder` |
| `joiedevivre_welcome_add_friends` | MARKETING | `{{1}}` prénom utilisateur | — | CTA statique → `https://joiedevivre-africa.com/contacts` | `check-friends-circle-reminders` |
| `joiedevivre_friends_circle_reminder` | MARKETING | `{{1}}` prénom utilisateur | — | CTA statique → `https://joiedevivre-africa.com/contacts` | `check-friends-circle-reminders` |

## Notes techniques

- `sendWhatsAppTemplate` supporte `headerImageUrl` ET `headerVideoUrl` (mutuellement exclusifs ; vidéo prioritaire si les deux sont fournis).
- Un fallback vers `sendWhatsApp` (texte libre) est maintenu pour les conversations actives.
- Les fonctions Edge sont standardisées pour prioriser WhatsApp pour le Bénin, Togo, Mali et Burkina Faso.
- La vidéo de célébration est configurable via la variable d'environnement `BIRTHDAY_CELEBRATION_VIDEO_URL` (fallback vers Supabase Storage).
- L'image du nudge création cagnotte est configurable via `BIRTHDAY_CREATE_FUND_NUDGE_IMAGE_URL` (fallback vers `BIRTHDAY_NO_FUND_ALERT_IMAGE_URL`, puis `assets/birthday-no-fund-alert.jpg`).
