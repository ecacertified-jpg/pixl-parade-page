

# Notifications admin automatiques pour anniversaires J-1

## Objectif

Créer une Edge Function CRON qui s'exécute quotidiennement et insère des notifications dans `admin_notifications` pour tous les anniversaires (utilisateurs + contacts) qui tombent dans les prochaines 24h. Les admins verront ces alertes dans leur centre de notifications existant.

## Architecture

### 1. Nouvelle Edge Function : `supabase/functions/notify-admin-birthdays/index.ts`

- Récupère tous les `profiles` et `contacts` avec un birthday non null
- Calcule `daysUntilBirthday` pour chacun
- Filtre ceux avec `daysUntil === 0` (jour J) et `daysUntil === 1` (demain)
- Récupère tous les admins actifs depuis `admin_users`
- Vérifie les doublons via `admin_notifications` (même `entity_id` + `type` aujourd'hui)
- Insère une notification par admin pour chaque anniversaire imminent :
  - `type`: `'birthday_approaching'`
  - `severity`: `'info'` (J-1) ou `'warning'` (Jour J)
  - `title`: "🎂 Anniversaire demain : {nom}" ou "🎂 Anniversaire aujourd'hui : {nom}"
  - `entity_type`: `'user'` ou `'contact'`
  - `entity_id`: l'id du profil/contact
  - `action_url`: `/admin/birthdays`

### 2. Config CRON

Ajouter dans `supabase/config.toml` la vérification JWT désactivée pour cette fonction.

Fournir le SQL pour créer le CRON job via pg_cron (à exécuter manuellement) — exécution quotidienne à 00h15 UTC, juste avant le CRON existant des alertes contacts (00h30).

### 3. Type NotificationType

Ajouter `'birthday_approaching'` au type dans `admin-notify-critical` n'est pas nécessaire car on insère directement dans `admin_notifications` sans passer par cette fonction.

## Fichiers

| Fichier | Action |
|---------|--------|
| `supabase/functions/notify-admin-birthdays/index.ts` | Créer |
| `supabase/config.toml` | Ajouter `[functions.notify-admin-birthdays]` |

Aucune migration DB — la table `admin_notifications` existe déjà avec les colonnes nécessaires.

