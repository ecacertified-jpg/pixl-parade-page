
# Plan : Système de Notifications SMS Bidirectionnelles pour Anniversaires

## Contexte

L'utilisateur souhaite que lorsqu'un contact est ajouté dans son cercle d'amis :
1. **Le contact ajouté reçoit un SMS** l'informant qu'il a été ajouté par X pour son prochain anniversaire dans N jours
2. **Le contact ajouté est ensuite informé de l'anniversaire de X** (celui qui l'a ajouté) selon un calendrier progressif
3. **Les intervalles de rappel sont configurables** dans les paramètres (par défaut : J-10, J-5, J-3, J-2, J-1, Jour-J)

## Architecture Proposee

```text
+-------------------+        +------------------------+
|   Dashboard.tsx   |        |  contact_alert_prefs   |
| (Ajout contact)   |        | (Préférences user)     |
+--------+----------+        +-----------+------------+
         |                               |
         v                               v
+------------------------+    +-------------------------+
| notify-contact-added   |<---| birthday_contact_alerts |
| (Edge Function)        |    | (Table de suivi)        |
+------------------------+    +-------------------------+
         |
         v
+------------------------+    +-------------------------+
| check-birthday-alerts  |<---| CRON quotidien 00:30    |
| -for-contacts          |    | pg_cron                 |
| (Edge Function)        |    +-------------------------+
+------------------------+
         |
    +----+----+
    |         |
    v         v
+------+  +----------+
| SMS  |  | WhatsApp |
+------+  +----------+
```

## Etape 1 : Mettre a jour le Schema de Preferences

### Migration SQL

Modifier la table `contact_alert_preferences` pour supporter les nouveaux intervalles personnalisables :

**Nouvelles colonnes :**

| Colonne | Type | Defaut | Description |
|---------|------|--------|-------------|
| alert_10_days | boolean | true | Rappel J-10 |
| alert_5_days | boolean | true | Rappel J-5 |
| alert_3_days | boolean | true | Rappel J-3 |
| alert_2_days | boolean | true | Rappel J-2 |
| alert_1_day | boolean | true | Rappel J-1 |
| alert_day_of | boolean | true | Rappel Jour-J |
| notify_of_adder_birthday | boolean | true | Etre notifie de l'anniversaire de celui qui m'ajoute |

**Suppression des colonnes obsoletes :**
- alert_30_days (remplace par intervalle plus court)
- alert_14_days (remplace par intervalle plus court)
- alert_10_days_daily (remplace par intervalles individuels)

---

## Etape 2 : Creer la Fonction notify-contact-added

### Fichier : `supabase/functions/notify-contact-added/index.ts`

Declenchee immediatement lors de l'ajout d'un contact dans le Dashboard.

**Flux :**

1. Recevoir les donnees du contact ajoute (nom, telephone, anniversaire)
2. Verifier les preferences de l'utilisateur (alerts_enabled, alert_on_contact_add)
3. Calculer le nombre de jours avant l'anniversaire du contact
4. Envoyer un SMS/WhatsApp au contact ajoute
5. Enregistrer l'alerte dans `birthday_contact_alerts`

**Message SMS (exemple) :**
```text
JoieDvivre: {userName} vous a ajoute(e) a son cercle d'amis. 
Votre anniversaire est dans {daysUntil} jours! 
Creez votre liste de souhaits: {link}
```

**Logique bidirectionnelle :**
- Si le contact a aussi un compte JoieDvivre, lui envoyer l'anniversaire de l'ajouteur
- Sinon, lui proposer de s'inscrire

---

## Etape 3 : Creer la Fonction check-birthday-alerts-for-contacts

### Fichier : `supabase/functions/check-birthday-alerts-for-contacts/index.ts`

Executee quotidiennement via CRON pour envoyer les rappels progressifs.

**Flux :**

1. Recuperer tous les contacts avec numero de telephone
2. Pour chaque contact, calculer les jours avant l'anniversaire du proprietaire (l'utilisateur qui l'a ajoute)
3. Verifier les preferences de l'utilisateur
4. Si le jour correspond a un rappel configure (J-10, J-5, J-3, J-2, J-1, Jour-J) :
   - Verifier si l'alerte n'a pas deja ete envoyee
   - Envoyer le SMS/WhatsApp
   - Enregistrer dans `birthday_contact_alerts`

**Messages SMS par intervalle :**

| Jour | Message |
|------|---------|
| J-10 | "{name} fete son anniversaire dans 10 jours. Preparez une surprise!" |
| J-5 | "{name} fete son anniversaire dans 5 jours. Avez-vous trouve le cadeau parfait?" |
| J-3 | "Plus que 3 jours avant l'anniversaire de {name}! Decouvrez nos idees cadeaux." |
| J-2 | "L'anniversaire de {name} approche (dans 2 jours). Commandez votre cadeau!" |
| J-1 | "DEMAIN c'est l'anniversaire de {name}! Dernier jour pour commander." |
| Jour-J | "Aujourd'hui c'est l'anniversaire de {name}! Souhaitez-lui une bonne fete." |

**Gestion des rate limits :**
- Max 100 SMS/jour par utilisateur
- Minimum 1 heure entre 2 messages au meme contact
- Respect du fuseau horaire (envoi entre 8h-20h locale)

---

## Etape 4 : Modifier le Dashboard pour Declencher la Notification

### Fichier : `src/pages/Dashboard.tsx`

Apres la creation du contact dans la base, appeler la fonction Edge `notify-contact-added`.

**Code a ajouter :**

```typescript
// Apres l'insertion du contact reussie
if (newContact.phone) {
  await supabase.functions.invoke('notify-contact-added', {
    body: {
      contact_id: newContactId,
      contact_name: newFriend.name,
      contact_phone: newFriend.phone,
      birthday: newFriend.birthday.toISOString()
    }
  });
}
```

---

## Etape 5 : Mettre a jour l'Interface des Preferences

### Fichier : `src/components/preferences/ContactAlertPreferencesSection.tsx`

Remplacer les anciens intervalles par les nouveaux :

**Nouvelle interface :**

- Checkbox "J-10 (10 jours avant)"
- Checkbox "J-5 (5 jours avant)"
- Checkbox "J-3 (3 jours avant)"
- Checkbox "J-2 (2 jours avant)"
- Checkbox "J-1 (Veille)"
- Checkbox "Jour-J"

**Nouvelle option :**
- Toggle "Etre notifie de l'anniversaire de mes contacts qui m'ajoutent"

---

## Etape 6 : Ajouter le CRON Job

### Migration SQL

```sql
SELECT cron.schedule(
  'check-birthday-alerts-for-contacts-daily',
  '30 0 * * *',
  $$
  SELECT net.http_post(
    url := 'https://PROJECT.supabase.co/functions/v1/check-birthday-alerts-for-contacts',
    headers := '{"Authorization": "Bearer SERVICE_KEY"}'::jsonb
  );
  $$
);
```

---

## Etape 7 : Mettre a jour le Hook des Preferences

### Fichier : `src/hooks/useContactAlertPreferences.ts`

Ajouter les nouvelles proprietes de preferences.

---

## Fichiers a Creer

| Fichier | Description |
|---------|-------------|
| `supabase/functions/notify-contact-added/index.ts` | Notification immediate a l'ajout |
| `supabase/functions/check-birthday-alerts-for-contacts/index.ts` | Rappels quotidiens progressifs |
| `supabase/migrations/XXXXXX_update_alert_preferences.sql` | Nouvelles colonnes de preferences |
| `supabase/migrations/XXXXXX_cron_birthday_alerts.sql` | CRON job quotidien |

## Fichiers a Modifier

| Fichier | Modification |
|---------|--------------|
| `src/pages/Dashboard.tsx` | Appeler notify-contact-added apres ajout |
| `src/components/preferences/ContactAlertPreferencesSection.tsx` | Nouveaux intervalles J-10/5/3/2/1/0 |
| `src/hooks/useContactAlertPreferences.ts` | Nouvelles proprietes |
| `src/integrations/supabase/types.ts` | Types mis a jour automatiquement |
| `supabase/config.toml` | Ajouter les nouvelles fonctions |

---

## Logique de Routage SMS/WhatsApp

Utilisation du module existant `_shared/sms-sender.ts` :

| Prefixe | Pays | Canal |
|---------|------|-------|
| +225 | Cote d'Ivoire | SMS |
| +221 | Senegal | SMS |
| +229 | Benin | WhatsApp |
| Autres | - | WhatsApp |

---

## Securite

- **Verification du rate limit** : Max 100 messages/jour par utilisateur
- **Opt-out** : Les contacts peuvent repondre "STOP" pour ne plus recevoir de messages
- **Consentement** : L'utilisateur doit explicitement activer les alertes dans ses preferences
- **Service Role** : Les fonctions CRON utilisent le service role key

---

## Estimation du Travail

| Phase | Duree |
|-------|-------|
| Migration SQL (preferences + CRON) | 15 min |
| Edge Function notify-contact-added | 30 min |
| Edge Function check-birthday-alerts | 45 min |
| Modification Dashboard.tsx | 10 min |
| Mise a jour interface preferences | 20 min |
| Tests et validation | 20 min |
| **Total** | ~2h20 |
