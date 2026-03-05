

# Notifications push pour utilisateurs inactifs (7+ jours)

## Approche

Créer une edge function CRON qui s'exécute quotidiennement, identifie les utilisateurs sans session depuis 7 jours, et leur envoie une notification push de ré-engagement via le système `_shared/web-push.ts` existant. Tracker les envois pour éviter le spam.

## Modifications

### 1. Table `inactive_user_notifications` (migration)

```sql
CREATE TABLE public.inactive_user_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sent_at timestamptz NOT NULL DEFAULT now(),
  days_inactive integer NOT NULL,
  notification_type text NOT NULL DEFAULT 'push',
  message_variant text -- pour A/B testing futur
);
CREATE INDEX idx_inactive_notif_user ON inactive_user_notifications(user_id, sent_at DESC);
```

RLS : admins SELECT all, users SELECT own.

### 2. Edge function `check-inactive-users`

- Auth par service role (CRON only)
- Requête : utilisateurs dont la dernière session (`user_session_logs.last_active_at`) date de 7+ jours
- Exclure ceux déjà notifiés dans les 7 derniers jours (via `inactive_user_notifications`)
- Exclure les comptes suspendus
- Pour chaque utilisateur inactif : envoyer push via `_shared/web-push.ts` directement (pas via `send-push-notification` qui requiert auth utilisateur)
- Messages variés et engageants en français (rotation aléatoire parmi 5-6 messages)
- Insérer un log dans `inactive_user_notifications`
- Créer aussi une notification in-app dans la table `notifications`

### 3. Config CRON (via SQL insert)

Planifier l'exécution quotidienne à 10h00 UTC (midi heure Abidjan).

### 4. Config `supabase/config.toml`

Ajouter `[functions.check-inactive-users]` avec `verify_jwt = false`.

### Fichiers impactés

| Fichier | Action |
|---------|--------|
| Migration SQL | Créer `inactive_user_notifications` + RLS + index |
| `supabase/functions/check-inactive-users/index.ts` | Nouvelle edge function |
| `supabase/config.toml` | Ajouter config fonction |
| SQL insert (CRON) | Planifier job quotidien |

