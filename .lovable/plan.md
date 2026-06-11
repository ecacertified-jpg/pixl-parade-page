## Plan d'implémentation

### Contexte (audit cron)
24 crons pg_cron sont déjà actifs (vérifié via `cron.job`), dont `generate-daily-notifications` (9h), `birthday-wishes-daily`, `check-birthday-opportunities-daily`, `check-fund-reminders-daily`, etc. → **Aucun cron manquant pour le quotidien.** Il manque seulement des déclencheurs push pour les 5 événements émotionnels ci-dessous et un cron hebdomadaire pour les "souvenirs" (memories).

---

### 1. Compléter les 5 notifications émotionnelles manquantes

Toutes utilisent l'edge function existante `send-push-notification` (OneSignal) + insèrent dans `notifications` + `notification_analytics`. Respect des préférences via `notification_preferences`.

| # | Événement | Trigger | Implémentation |
|---|---|---|---|
| 1 | **Mariage proche** (J-7, J-1, jour J) | Cron quotidien | Nouvelle edge `notify-upcoming-weddings` (lit `event_pages` où `event_type='wedding'` + organisateurs/invités). Cron `0 7 * * *`. |
| 2 | **Nouveaux visiteurs** sur sa page anniversaire | Trigger DB `AFTER INSERT` sur `birthday_page_photo_views` → appelle edge `notify-page-visitor` (rate-limit 1/jour/visiteur via `birthday_page_activity_notifs`). |
| 3 | **Nouvelles réactions** (posts + album) | Trigger DB sur `post_reactions` et `album_photo_reactions` → edge `notify-new-reaction` (groupé : "Aminata et 3 autres ont réagi"). |
| 4 | **Nouveaux souvenirs** (photos albums) | Trigger sur `birthday_page_photos` (INSERT) → edge `notify-new-memory` envoyée aux amis de la page (via `birthday_page_friends`). + Cron hebdo `notify-weekly-memories` (dimanche 18h) résumé "Cette semaine, 5 nouveaux souvenirs". |
| 5 | **Activité familiale** | Étendre `notify-birthday-page-activity` (déjà existant) pour pousser AUSSI via push (actuellement WhatsApp/in-app seulement). Ajout d'un canal `push` aux `delivery_methods`. |

**Anti-spam** : dédup 1h via tables existantes (`birthday_page_activity_notifs`) ou nouvelle `push_notif_dedup` si besoin.

---

### 2. Page Historique des notifications push

**Route** : `/notifications/history` (lien depuis Dashboard + `/notification-settings`).

**Composant** : `src/pages/NotificationHistory.tsx`
- Liste paginée des `notification_analytics` où `user_id = auth.uid()` et `notification_type = 'push'`
- Filtres : catégorie (birthday/fund/gift/gratitude/order/other), date
- Pour chaque ligne : icône catégorie, titre, body, date relative ("il y a 2h"), badge statut (envoyée/cliquée), `action_url` cliquable
- État vide illustré ("Aucune notification reçue pour l'instant")
- Realtime via `supabase.channel` pour ajout en direct

**RLS** : `notification_analytics` a déjà policy `Users can view own analytics` (vérifier en migration au besoin).

---

### 3. Vérification & complétion des crons

**Déjà OK** (vérifié) :
- `generate-daily-notifications` (9h)
- `birthday-wishes-daily` (00h01)
- `check-birthday-opportunities-daily` (8h)
- `check-fund-reminders-daily` (6h)
- `notify-admin-birthdays-daily` (00h15)
- `check-birthday-alerts-for-contacts-daily` (00h30)

**À ajouter** :
1. `notify-upcoming-weddings-daily` → `0 7 * * *`
2. `notify-weekly-memories-digest` → `0 18 * * 0` (dimanche 18h)

Via `supabase--insert` + `cron.schedule(...)` (avec URL projet + anon key, pas migration).

---

### Détails techniques

**Edge functions à créer** :
- `supabase/functions/notify-upcoming-weddings/index.ts`
- `supabase/functions/notify-page-visitor/index.ts`
- `supabase/functions/notify-new-reaction/index.ts`
- `supabase/functions/notify-new-memory/index.ts`
- `supabase/functions/notify-weekly-memories/index.ts`

**Triggers DB** (migration) :
- `trg_push_on_page_visit` AFTER INSERT ON `birthday_page_photo_views`
- `trg_push_on_post_reaction` AFTER INSERT ON `post_reactions`
- `trg_push_on_album_reaction` AFTER INSERT ON `album_photo_reactions`
- `trg_push_on_new_memory` AFTER INSERT ON `birthday_page_photos`

Chaque trigger appelle `net.http_post` vers l'edge correspondante avec `service_role` headers.

**Préférences** : étendre `notification_preferences` avec colonnes booléennes si manquantes : `push_new_visitor`, `push_new_reaction`, `push_new_memory`, `push_wedding_reminder`, `push_family_activity` (par défaut `true`).

**Fichiers frontend** :
- `src/pages/NotificationHistory.tsx` (nouveau)
- `src/App.tsx` (route)
- `src/pages/NotificationSettings.tsx` (toggles + lien Historique)
- `src/components/Dashboard*.tsx` (bouton "Historique")

**Modifs minimes** :
- `supabase/functions/notify-birthday-page-activity/index.ts` : ajouter push après WhatsApp

---

### Vérification finale
1. Crons listés via `SELECT * FROM cron.job` → 26 actifs (24 + 2 nouveaux)
2. Test edge functions via `supabase--curl_edge_functions`
3. Page `/notifications/history` accessible et chargée
4. Triggers DB testés en insérant manuellement une réaction/visite

---

### Hors scope (à confirmer si besoin)
- Pas de refonte de `send-push-notification` (déjà fonctionnelle)
- Pas de nouvelle UI de préférences détaillée (les toggles s'ajoutent à `NotificationSettings.tsx` existante)
