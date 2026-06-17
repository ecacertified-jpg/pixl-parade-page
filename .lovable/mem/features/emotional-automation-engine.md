---
name: Emotional automation engine
description: Orchestrateur émotionnel — table emotional_campaigns + cron "On This Day" + dashboard admin
type: feature
---

## Moteur d'automatisation émotionnelle

### Table `emotional_campaigns`
Pilotée par admins (RLS admin-only). Colonnes : key, name, trigger_type, channel (in_app/whatsapp/email/push), cooldown_hours, audience_filter (jsonb), is_active, last_run_at, last_run_stats.

5 campagnes seedées : `on_this_day`, `birthday_countdown`, `inactive_reengagement`, `event_countdown`, `gratitude_nudge`.

### Edge function `notify-on-this-day`
Cron quotidien `15 7 * * *` (jobid 36, `notify-on-this-day-daily`). Scanne `birthday_page_photos` + `event_page_photos` créées le même MM-DD les années précédentes. Pour chaque uploader, prend le souvenir le plus ancien et crée une `scheduled_notifications` (type `on_this_day`, smart_notification_category `memory`, action_url `/souvenirs`). Anti-spam via table `on_this_day_log` (unique user_id + memory_date + source).

### Dashboard admin `/admin/emotional-campaigns`
CRUD light : toggle is_active, édition cooldown, bouton "Lancer" qui invoque la fonction associée (FUNCTION_MAP).

### Briques existantes mappées
- Rappels anniversaires → `birthday-wishes`
- Rappels événements → `notify-upcoming-events`
- Suggestions messages → `suggest-birthday-message`
- Suggestions cadeaux → `ai-gift-recommendations`
- Relances inactifs → `check-inactive-users`
- Souvenirs hebdo → `notify-weekly-memories`