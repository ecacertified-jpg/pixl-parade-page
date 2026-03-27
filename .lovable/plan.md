

# Plan : Alertes automatiques pour templates WhatsApp failing/degraded

## Contexte

Deux health checks CRON existent déjà (`check-whatsapp-otp-health`, `check-whatsapp-delivery-health`) mais ils surveillent des métriques globales (OTP, livraison), pas le statut individuel de chaque template. L'objectif est de créer un système qui analyse les 21 templates et alerte quand l'un d'eux passe en statut `failing` (100% échecs) ou `degraded` (taux de succès < 80%).

## Approche

Créer une nouvelle Edge Function `check-whatsapp-template-health` qui :
1. Récupère les logs des dernières 24h depuis `whatsapp_template_logs`
2. Calcule le statut de chaque template (même logique que `computeStatus`)
3. Pour chaque template `failing` ou `degraded`, vérifie l'anti-spam (pas d'alerte similaire dans les 6 dernières heures)
4. Crée une `admin_notification` avec sévérité `critical` (failing) ou `warning` (degraded)
5. Envoie un email aux admins via Resend si configuré

Planifier un CRON toutes les 6 heures pour exécuter cette fonction.

## Détails techniques

### 1. Edge Function `supabase/functions/check-whatsapp-template-health/index.ts`

- Liste statique des 21 templates (miroir de `KNOWN_TEMPLATES`)
- Requête `whatsapp_template_logs` des dernières 24h, groupée par `template_name`
- Seuils : `failing` = 100% échecs, `degraded` = succès < 80%, minimum 5 envois
- Anti-spam par template : vérifie `admin_notifications` avec `type = 'whatsapp_template_health'` et `entity_id = template_name` dans les 6 dernières heures
- Notification : titre = nom du template, message = taux de succès et détails, `action_url = '/admin/whatsapp-templates'`
- Email groupé : un seul email listant tous les templates problématiques (pas un email par template)

### 2. CRON job (SQL via insert tool)

Planifier `check-whatsapp-template-health` toutes les 6 heures via `pg_cron`.

### 3. Mise à jour mémoire

Ajouter le nouveau CRON dans `.lovable/memory` pour le suivi.

## Fichiers créés/modifiés

- `supabase/functions/check-whatsapp-template-health/index.ts` (nouveau)
- `.lovable/memory/infrastructure/cron-jobs-alert-system.md` (mise à jour)

