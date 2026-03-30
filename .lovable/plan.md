

# Plan : Créer le CRON job manquant pour `birthday-wishes`

## Diagnostic

La fonction Edge `birthday-wishes` n'a **aucun CRON job** configuré dans `pg_cron`. Les logs sont vides car elle n'est tout simplement jamais appelée automatiquement.

Les 4 jobs birthday existants sont :
- `check-birthday-alerts-for-contacts-daily` (00h30) → appelle `check-birthday-alerts-for-contacts`
- `notify-admin-birthdays-daily` (00h15) → appelle `notify-admin-birthdays`
- `birthday-reminder-with-suggestions-daily` (01h00) → appelle `birthday-reminder-with-suggestions`
- `check-birthday-opportunities-daily` (08h00) → appelle `notify-business-birthday-opportunity`

**Aucun** n'appelle `birthday-wishes`.

## Correction

Créer un CRON job `birthday-wishes-daily` planifié à **00h01 UTC** (avant les autres jobs birthday) via SQL insert dans `cron.schedule`. Utiliser la clé `service_role` (comme le job `check-birthday-opportunities-daily`) car la fonction a besoin d'accéder aux données de tous les utilisateurs.

```sql
SELECT cron.schedule(
  'birthday-wishes-daily',
  '1 0 * * *',
  $$
  SELECT net.http_post(
    url := 'https://vaimfeurvzokepqqqrsl.supabase.co/functions/v1/birthday-wishes',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer <SERVICE_ROLE_KEY>"}'::jsonb,
    body := concat('{"timestamp": "', now(), '"}')::jsonb
  ) AS request_id;
  $$
);
```

Après création du CRON, déclencher manuellement la fonction via `supabase--curl_edge_functions` pour envoyer immédiatement le template `joiedevivre_birthday_celebration` aux 7 utilisateurs dont l'anniversaire est aujourd'hui (30 mars).

## Fichiers concernés

| Action | Détail |
|--------|--------|
| SQL insert via `cron.schedule` | Créer le job `birthday-wishes-daily` à 00h01 UTC |
| Invocation manuelle | Appeler `birthday-wishes` pour traiter les anniversaires du 30 mars |

