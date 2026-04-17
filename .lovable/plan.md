

# Plan : 2 nouveaux templates WhatsApp pour engager les amis et notifier l'utilisateur

## Objectifs

1. **Template A — `joiedevivre_birthday_page_invite`** : envoyé aux amis (inscrits + non-inscrits) du célébré à **17 jalons** (J-45, 40, 35, 30, 25, 20, 15, 13, 11, 9, 7, 5, 4, 3, 2, 1) pour les inciter à laisser un mot, photo, vidéo, ou contribution sur la page d'anniversaire.
2. **Template B — `joiedevivre_birthday_page_activity`** : envoyé au célébré chaque fois qu'un ami ajoute une photo / vidéo / souvenir / promesse / contribution.

## 1. Templates WhatsApp à créer dans Meta Business Manager

### Template A — `joiedevivre_birthday_page_invite`
- **Catégorie** : MARKETING — Langue : `fr`
- **Header image** (statique, configurable via `BIRTHDAY_PAGE_INVITE_IMAGE_URL`)
- **Body** (4 paramètres) :
  > Salut {{1}} 👋
  > L'anniversaire de **{{2}}** approche : plus que **{{3}} jour(s)** ! 🎂
  > 
  > Sa page-souvenir est ouverte. Tu peux y ajouter :
  > 📸 une photo, 🎥 une vidéo, ✍️ un petit mot, ou 🎁 contribuer à sa cagnotte.
  > 
  > Fais-lui une belle surprise dès maintenant 💜
- **Footer** : `JOIE DE VIVRE — Célébrons ensemble`
- **Bouton CTA dynamique** (URL) : "Ouvrir la page" → `https://joiedevivre-africa.com/birthday/{{1}}` (paramètre = slug de la page)
- Paramètres : `{{1}}` prénom destinataire, `{{2}}` prénom célébré, `{{3}}` nombre de jours, `{{4}}` slug page (bouton)

### Template B — `joiedevivre_birthday_page_activity`
- **Catégorie** : UTILITY — Langue : `fr`
- **Body** (3 paramètres) :
  > 🎉 {{1}}, **{{2}}** vient de {{3}} sur ta page d'anniversaire !
  > 
  > Va voir sa belle attention et remercie-le/la 💜
- **Footer** : `JOIE DE VIVRE`
- **Bouton CTA dynamique** (URL) : "Voir la page" → `https://joiedevivre-africa.com/birthday/{{1}}` (slug)
- Paramètres : `{{1}}` prénom célébré, `{{2}}` prénom de l'ami, `{{3}}` action ("ajouter une photo" / "ajouter une vidéo" / "écrire un souvenir" / "promettre un cadeau" / "contribuer 5 000 XOF")

## 2. Changements code

### A. Étendre `birthday-wishes` (CRON quotidien existant)

| Changement | Détail |
|---|---|
| **Constante COUNTDOWN_DAYS étendue** | `[45, 40, 35, 30, 25, 20, 15, 13, 11, 9, 7, 5, 4, 3, 2, 1]` (nouvelle constante `FRIEND_INVITE_DAYS`, distincte de l'actuelle `[7,5,3,1]` qui reste pour notifier le célébré lui-même) |
| **Nouvelle phase "PART A2"** | Pour chaque profil avec birthday + page active, récupérer `birthday_pages.slug` (année courante) et la liste de ses amis via `contact_relationships` (join `profiles` côté ami pour prénom/téléphone) + ses `contacts` non-inscrits |
| **Envoi template A** | `sendWhatsAppTemplate(friend.phone, 'joiedevivre_birthday_page_invite', 'fr', [friendFirstName, celebratedFirstName, daysUntil, pageSlug], [pageSlug], pageInviteImageUrl)` |
| **Déduplication** | Réutiliser `birthday_contact_alerts` avec `alert_type='friend_page_invite'` + `days_before=N` + `contact_phone=friend.phone` (étendre le CHECK constraint) |

### B. Création automatique de la page à l'inscription (déjà OK)

`OnboardingExperience.handleCreateBirthdayPage` crée déjà la `birthday_page` avec slug. Aucun changement nécessaire — le CRON `birthday-wishes` détectera la page le lendemain.

### C. Nouvelle Edge Function `notify-birthday-page-activity`

Déclenchée à chaque action sur la page de quelqu'un d'autre :

| Trigger côté UI | Action passée au template |
|---|---|
| `birthday_page_photos.insert` (image) | "ajouter une photo 📸" |
| `birthday_page_photos.insert` (vidéo) | "ajouter une vidéo 🎥" |
| `birthday_page_photos.insert` (memory_text) | "écrire un souvenir ✍️" |
| `page_gift_promises.insert` | "promettre un cadeau 🎁" |
| `fund_contributions.insert` (fund lié à birthday_page) | "contribuer {montant} XOF 💜" |

**Fonction Edge** :
- Reçoit `{ birthdayPageId, actorUserId, actionType, amount? }`
- Charge le célébré (profile + phone), l'acteur (prénom), la page (slug)
- Garde-fou : ignore si `actorUserId === celebratedUserId` (auto-action)
- Anti-spam : table `birthday_page_activity_notifs` (déduplique par `(page_id, actor_id, action_type)` sur 1h pour éviter le bruit lors de batch d'uploads)
- Envoi : `sendWhatsAppTemplate(celebrated.phone, 'joiedevivre_birthday_page_activity', 'fr', [celebratedFirstName, actorFirstName, actionLabel], [pageSlug])`
- Notification in-app `scheduled_notifications` en parallèle

### D. Appels client → Edge Function

Ajouter `supabase.functions.invoke('notify-birthday-page-activity', ...)` après chaque succès dans :
- `src/components/FeedCardActions.tsx` → après `birthday_page_photos.insert` (3 cas : photo, vidéo, souvenir) et après `page_gift_promises.insert`
- Composant de contribution à la cagnotte (rechercher `fund_contributions.insert` lié à birthday_page) → ajouter le hook

## 3. Migration SQL

```sql
-- Étendre les types d'alerte
ALTER TABLE birthday_contact_alerts DROP CONSTRAINT birthday_contact_alerts_alert_type_check;
ALTER TABLE birthday_contact_alerts ADD CONSTRAINT birthday_contact_alerts_alert_type_check 
  CHECK (alert_type = ANY (ARRAY['immediate','month','two_weeks','daily','contact_added',
    'friends_circle_welcome','friends_circle_reminder','birthday_countdown','friend_page_invite']));

-- Table anti-spam pour notifs d'activité
CREATE TABLE public.birthday_page_activity_notifs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  birthday_page_id uuid NOT NULL,
  actor_user_id uuid NOT NULL,
  action_type text NOT NULL,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_bpan_dedup ON birthday_page_activity_notifs(birthday_page_id, actor_user_id, action_type, created_at);
ALTER TABLE birthday_page_activity_notifs ENABLE ROW LEVEL SECURITY;
-- Service-role only (pas de policy → bloqué pour clients)
```

## 4. Fichiers concernés

| Fichier | Changement |
|---|---|
| Migration SQL | Étendre CHECK + créer `birthday_page_activity_notifs` |
| `supabase/functions/birthday-wishes/index.ts` | Nouvelle phase A2 (17 jalons, amis du célébré, template A) |
| `supabase/functions/notify-birthday-page-activity/index.ts` | **Nouveau** — envoie template B au célébré |
| `supabase/config.toml` | Déclarer la nouvelle fonction `verify_jwt = true` |
| `src/components/FeedCardActions.tsx` | Invoquer la fonction après photo/vidéo/souvenir/promesse |
| Composant contribution cagnotte (à identifier) | Invoquer après contribution réussie |
| `.lovable/memory/whatsapp-messaging-strategy.md` + memory `birthday-celebration-flow` | Documenter les 2 nouveaux templates |

## 5. Action utilisateur requise

Créer manuellement les **2 templates** dans **Meta Business Manager** avec exactement les paramètres ci-dessus avant que le code soit fonctionnel. Les templates seront en attente d'approbation Meta (24-48h).

