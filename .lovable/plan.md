
# Rappels SMS pour participation aux cagnottes

## Objectif

Envoyer des SMS d'incitation aux amis du bénéficiaire d'une cagnotte pour les encourager à contribuer :
- **Déclenchement** : Dès la création de la cagnotte
- **Fréquence** : Tous les 2 jours
- **Fin des rappels** : 
  - Veille de l'anniversaire/deadline
  - OU quand l'objectif est atteint
  - OU après contribution de l'utilisateur

## Architecture

```text
┌─────────────────────────────────────┐
│  1. Création de cagnotte            │
│  (collective_funds INSERT)          │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  2. Trigger DB ou appel API         │
│  → Insère rappels planifiés dans    │
│    fund_contribution_reminders      │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  3. CRON quotidien (06h00 UTC)      │
│  check-fund-contribution-reminders  │
│  → Traite les rappels du jour       │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  4. Envoi SMS via sms-sender.ts     │
│  Canal: SMS (+225, +221) ou WhatsApp│
└─────────────────────────────────────┘
```

## Modèle de données

### Nouvelle table : `fund_contribution_reminders`

| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid | Clé primaire |
| fund_id | uuid | FK vers collective_funds |
| target_user_id | uuid | Utilisateur à notifier |
| target_phone | text | Numéro de téléphone |
| reminder_date | date | Date prévue d'envoi |
| reminder_number | integer | 1er, 2ème, 3ème rappel... |
| status | text | 'pending', 'sent', 'skipped', 'cancelled' |
| skip_reason | text | Raison si skipped (contributed, goal_reached) |
| sent_at | timestamp | Date/heure d'envoi effectif |
| created_at | timestamp | Date de création |

### Politique RLS

- Les utilisateurs peuvent voir leurs propres rappels
- Seul le service role peut modifier

## Messages SMS (moins de 160 caractères)

| Rappel | Message |
|--------|---------|
| 1er (création) | `[Ami] a lancé une cagnotte pour [Bénéficiaire]! Objectif: X XOF. Participe: joiedevivre-africa.com/c/[token]` |
| 2ème+ | `Rappel: La cagnotte pour [Bénéficiaire] a atteint X%. Plus que Y jours! joiedevivre-africa.com/c/[token]` |
| Dernier (J-1) | `DERNIER JOUR: Cagnotte pour [Bénéficiaire] à X%. Contribue maintenant! joiedevivre-africa.com/c/[token]` |

## Logique de planification des rappels

Lors de la création d'une cagnotte avec deadline :

```text
Exemple: Cagnotte créée le 1er février, deadline le 15 février

Rappels planifiés:
- 1er février (J0) : Premier rappel (création)
- 3 février (J+2) : 2ème rappel
- 5 février (J+4) : 3ème rappel
- 7 février (J+6) : 4ème rappel
- 9 février (J+8) : 5ème rappel
- 11 février (J+10): 6ème rappel
- 13 février (J+12): 7ème rappel
- 14 février (J-1) : DERNIER rappel
```

## Fichiers a creer/modifier

### 1. Migration SQL
**`supabase/migrations/[timestamp]_fund_contribution_reminders.sql`**

- Creation de la table `fund_contribution_reminders`
- Politiques RLS
- Index sur (fund_id, target_user_id, reminder_date)
- Trigger sur INSERT de collective_funds pour generer les rappels

### 2. Edge Function CRON
**`supabase/functions/check-fund-contribution-reminders/index.ts`**

Responsabilites:
- Recuperer les rappels du jour (reminder_date = aujourd'hui, status = 'pending')
- Verifier pour chaque rappel:
  - La cagnotte est-elle encore active?
  - L'objectif est-il atteint?
  - L'utilisateur a-t-il deja contribue?
- Si conditions OK: envoyer SMS via `sms-sender.ts`
- Mettre a jour le statut du rappel

### 3. Configuration CRON
**Ajout d'un job pg_cron** (SQL a executer)

```sql
SELECT cron.schedule(
  'check-fund-reminders-daily',
  '0 6 * * *', -- 06h00 UTC = 06h00 Abidjan
  $$
  SELECT net.http_post(
    url:='https://vaimfeurvzokepqqqrsl.supabase.co/functions/v1/check-fund-contribution-reminders',
    headers:='{"Authorization": "Bearer SERVICE_ROLE_KEY"}'::jsonb,
    body:='{}'::jsonb
  );
  $$
);
```

### 4. Mise a jour config.toml
```toml
[functions.check-fund-contribution-reminders]
verify_jwt = false
```

## Flux de donnees detaille

```text
CREATION DE CAGNOTTE
━━━━━━━━━━━━━━━━━━━━

1. INSERT INTO collective_funds
   │
   ▼
2. TRIGGER: generate_contribution_reminders()
   │
   ├── Recuperer les amis du createur (contact_relationships)
   │
   ├── Pour chaque ami avec can_see_funds = true:
   │   │
   │   └── Recuperer son numero de telephone (profiles.phone)
   │
   └── Calculer les dates de rappel (tous les 2 jours jusqu'a J-1)
       │
       └── INSERT INTO fund_contribution_reminders (1 ligne par ami par date)


EXECUTION QUOTIDIENNE (CRON)
━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. SELECT * FROM fund_contribution_reminders
   WHERE reminder_date = CURRENT_DATE
   AND status = 'pending'
   │
   ▼
2. Pour chaque rappel:
   │
   ├── SELECT status, current_amount, target_amount 
   │   FROM collective_funds WHERE id = fund_id
   │
   ├── Si status != 'active' → UPDATE status = 'skipped', skip_reason = 'fund_closed'
   │
   ├── Si current_amount >= target_amount → UPDATE status = 'skipped', skip_reason = 'goal_reached'
   │
   ├── SELECT count(*) FROM fund_contributions
   │   WHERE fund_id = X AND contributor_id = target_user_id
   │   Si > 0 → UPDATE status = 'skipped', skip_reason = 'already_contributed'
   │
   └── SINON:
       ├── Construire le message SMS
       ├── sendSms(target_phone, message)
       └── UPDATE status = 'sent', sent_at = NOW()
```

## Securite

1. **Authentification CRON** : Service role key obligatoire
2. **RLS** : Les utilisateurs ne peuvent que consulter leurs rappels
3. **Pas de donnees sensibles** : Les SMS contiennent uniquement le prenom et un lien court
4. **Desinscription** : Option future pour se desabonner des rappels

## Estimation de volume

| Scenario | Rappels/jour estimes |
|----------|---------------------|
| 10 cagnottes actives, 5 amis chacune | ~25 SMS/jour |
| 50 cagnottes actives, 5 amis chacune | ~125 SMS/jour |
| 100 cagnottes actives, 5 amis chacune | ~250 SMS/jour |

## Resume des fichiers

| Type | Fichier | Action |
|------|---------|--------|
| Migration | `supabase/migrations/[timestamp]_fund_contribution_reminders.sql` | Creer table + trigger |
| Edge Function | `supabase/functions/check-fund-contribution-reminders/index.ts` | Nouvelle fonction CRON |
| Config | `supabase/config.toml` | Ajouter configuration fonction |
| SQL (manuel) | Job pg_cron | Planifier execution quotidienne |
