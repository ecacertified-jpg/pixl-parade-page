# Plan : Enrichir les notifications aux contacts

## Constat

Le système de notifications est déjà **largement en place**. Quatre ajustements sont proposés pour combler les lacunes identifiées.

## Changements proposés

### 1. Rappel périodique aux contacts non-inscrits (nouvelle Edge Function)

Créer `notify-contacts-join-reminder` — un CRON hebdomadaire qui :

- Identifie les contacts ajoutés il y a plus de 7 jours qui n'ont toujours pas de compte utilisateur
- Leur envoie un WhatsApp template les invitant à créer leur cercle d'amis
- Limite : 1 rappel tous les 2 semaines par contact (déduplication via `birthday_contact_alerts`)
- Template : `joiedevivre_join_reminder` avec paramètres `[nom_ami_qui_a_ajouté]`
- Message : "{Prénom} t'a ajouté à son cercle d'amis sur Joie de Vivre. Crée ton cercle pour profiter aussi de la générosité de tes proches 👉 joiedevivre-africa.com"

**Note** : Ce template WhatsApp devra être créé et approuvé dans Meta Business Manager avant de fonctionner. En attendant, le système utilisera un fallback SMS.

### 2. Notification de cotisation aux contacts proches d'un anniversaire

Enrichir `check-birthday-alerts-for-contacts` pour ajouter un message de cotisation dans les rappels J-14 et J-7 :

- Vérifier si une cagnotte existe pour l'anniversaire du contact
- Si oui : inclure le lien de la cagnotte dans le message
- Si non : suggérer de créer une cotisation
- Modifier les messages `j14` et `j7` pour inclure l'appel à cotisation

### 3. CRON job pour le rappel hebdomadaire

Ajouter un job pg_cron hebdomadaire (dimanche 10h UTC) pour déclencher `notify-contacts-join-reminder`.

### 4. Migration — aucune nouvelle table nécessaire

La table `birthday_contact_alerts` existante sera réutilisée avec un nouveau `alert_type: 'join_reminder'` pour la déduplication.

## Fichiers modifiés / créés

- **Nouveau** : `supabase/functions/notify-contacts-join-reminder/index.ts`
- **Modifié** : `supabase/functions/check-birthday-alerts-for-contacts/index.ts` (messages J-14/J-7 enrichis avec liens cagnotte)
- **SQL** : nouveau CRON job via insert

## Détails techniques

### Edge Function `notify-contacts-join-reminder`

```text
CRON (dimanche 10h) → 
  SELECT contacts sans linked_user_id, ajoutés il y a > 7 jours →
  FILTER pas de join_reminder envoyé dans les 30 derniers jours →
  SEND WhatsApp template (fallback SMS) →
  INSERT birthday_contact_alerts (alert_type = 'join_reminder')
```

### Messages J-14/J-7 enrichis

```text
Avant : "L'anniversaire de {nom} est dans 2 semaines. Découvrez nos idées cadeaux!"
Après : "L'anniversaire de {nom} est dans 2 semaines. Participez à sa cagnotte 👉 {lien_cagnotte} ou offrez-lui un cadeau sur joiedevivre-africa.com"
```