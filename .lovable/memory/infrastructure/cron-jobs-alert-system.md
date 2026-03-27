# CRON Jobs & Alert System

Quinze tâches CRON sont configurées dans Supabase via pg_cron pour automatiser les opérations :

1. **escalate-alerts-daily** — 08h00 UTC
2. **check-growth-alerts-hourly** — toutes les heures
3. **check-business-performance-daily** — 07h00 UTC
4. **check-birthday-alerts-for-contacts-daily** — 00h30 UTC
5. **check-fund-reminders-daily** — 06h00 UTC
6. **check-whatsapp-otp-health-hourly** — toutes les heures
7. **check-friends-circle-reminders-daily** — 09h00 UTC
8. **check-whatsapp-delivery-health-6h** — toutes les 6 heures
9. **check-inactive-users-daily** — 10h00 UTC
10. **notify-admin-birthdays-daily** — 00h15 UTC
11. **birthday-reminder-with-suggestions-daily** — 01h00 UTC
12. **notify-birthday-suggestions-daily** — quotidien
13. **check-delivery-confirmation-reminder-hourly** — toutes les heures
14. **notify-contacts-join-reminder-weekly** — tous les dimanches à 10h00 UTC
15. **check-whatsapp-template-health-6h** — toutes les 6 heures (à :30)

Les fonctions sont déclenchées via `net.http_post` avec les privilèges `service_role`.

## Détail : check-whatsapp-template-health-6h

- **Fonction** : `check-whatsapp-template-health`
- **Fréquence** : toutes les 6 heures (`30 */6 * * *`)
- **Rôle** : Analyse les logs des dernières 24h pour les 21 templates WhatsApp. Crée des `admin_notifications` de type `whatsapp_template_health` avec sévérité `critical` (failing = 100% échecs) ou `warning` (degraded = succès < 80%, minimum 5 envois). Anti-spam de 6h par template. Email groupé aux admins via Resend.
