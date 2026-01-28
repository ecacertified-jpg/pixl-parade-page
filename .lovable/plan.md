
# Système de Notifications SMS/WhatsApp pour les Anniversaires Utilisateur

## Objectif
Créer un système qui envoie automatiquement des notifications SMS ou WhatsApp aux contacts ajoutés par un utilisateur pour les informer de son prochain anniversaire, selon un calendrier progressif.

## Calendrier des Rappels

| Moment | Type | Priorité |
|--------|------|----------|
| À l'ajout du contact | Notification immédiate | Low |
| 1 mois avant (J-30) | Rappel anticipé | Low |
| 2 semaines avant (J-14) | Rappel standard | Medium |
| 10 jours avant (J-10) | Début rappels quotidiens | High |
| J-9 à J-1 | Rappel quotidien | High → Critical |

## Architecture Technique

```text
┌─────────────────────────────────────────────────────────────────┐
│                      FLUX D'EXÉCUTION                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Ajout d'un contact                                             │
│       │                                                         │
│       ▼                                                         │
│  [Dashboard.tsx] ──► [send-birthday-alert-to-contact]           │
│       │              (notification immédiate)                   │
│       │                                                         │
│       ▼                                                         │
│  [birthday_contact_alerts] ◄── Table de suivi                   │
│       │                                                         │
│       │                                                         │
│  Cron Job quotidien (00:30 UTC)                                 │
│       │                                                         │
│       ▼                                                         │
│  [check-birthday-alerts-for-contacts]                           │
│       │                                                         │
│       ├── Vérifie J-30, J-14, J-10 à J-1                        │
│       │                                                         │
│       ▼                                                         │
│  [send-birthday-alert-to-contact]                               │
│       │                                                         │
│       ├── SMS (via Twilio - si smsReliability = reliable)       │
│       └── WhatsApp (si whatsappFallbackEnabled = true)          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Détails Techniques

### 1. Nouvelle Table: `birthday_contact_alerts`

Cette table suit les alertes envoyées pour éviter les doublons.

| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid | Clé primaire |
| user_id | uuid | Propriétaire du contact (celui qui fête son anniv) |
| contact_id | uuid | Contact notifié |
| contact_phone | text | Téléphone du contact |
| alert_type | text | 'immediate', 'month', 'two_weeks', 'daily' |
| days_before | integer | Nombre de jours avant l'anniversaire |
| channel | text | 'sms' ou 'whatsapp' |
| status | text | 'pending', 'sent', 'failed' |
| sent_at | timestamp | Quand l'alerte a été envoyée |
| error_message | text | Message d'erreur si échec |
| created_at | timestamp | Date de création |

### 2. Edge Function: `send-birthday-alert-to-contact`

**Responsabilités:**
- Recevoir les infos: user_id, contact (phone, name), days_before, alert_type
- Déterminer le canal (SMS ou WhatsApp) basé sur le pays du contact
- Envoyer le message personnalisé
- Enregistrer le résultat dans `birthday_contact_alerts`

**Messages par type:**

| Type | Message |
|------|---------|
| Immediate | "🎂 [Prénom] vous a ajouté(e) comme ami(e) sur JOIE DE VIVRE ! Son anniversaire est le [date]. Inscrivez-vous pour lui préparer une surprise : [lien]" |
| J-30 | "📅 L'anniversaire de [Prénom] approche (le [date]) ! Pensez à lui préparer quelque chose de spécial sur joiedevivre.ci 🎁" |
| J-14 | "🎉 Plus que 2 semaines avant l'anniversaire de [Prénom] ! Rejoignez sa cagnotte ou offrez-lui un cadeau : [lien]" |
| J-10 à J-1 | "⏰ L'anniversaire de [Prénom] est dans [X] jour(s) ! Ne manquez pas cette occasion 🎁 → [lien]" |

### 3. Edge Function: `check-birthday-alerts-for-contacts`

**Exécution:** Cron job quotidien à 00:30 UTC (1h30 en Côte d'Ivoire)

**Logique:**
1. Récupérer tous les utilisateurs avec un anniversaire configuré
2. Pour chaque utilisateur, vérifier les contacts avec téléphone
3. Calculer les jours restants avant l'anniversaire
4. Si correspond à J-30, J-14, ou J-10 à J-1:
   - Vérifier si alerte déjà envoyée (via `birthday_contact_alerts`)
   - Si non, appeler `send-birthday-alert-to-contact`

### 4. Modifications Frontend: `Dashboard.tsx`

Après l'ajout d'un contact avec téléphone:
- Appeler `send-birthday-alert-to-contact` avec alert_type = 'immediate'
- Uniquement si l'utilisateur a un anniversaire configuré dans son profil

### 5. Intégration SMS (Twilio)

**Nouveau secret nécessaire:** `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`

- Pour la Côte d'Ivoire (smsReliability = 'reliable'): SMS via Twilio
- Pour le Bénin/Sénégal (smsReliability != 'reliable'): WhatsApp via Meta Cloud API

### 6. Intégration WhatsApp (existante)

Utilise les credentials déjà configurés:
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`

**Template suggéré pour Meta Business:**
- Nom: `birthday_reminder`
- Catégorie: Marketing
- Variables: `{{1}}` = Prénom utilisateur, `{{2}}` = Date anniversaire

---

## Fichiers à Créer/Modifier

| Action | Fichier | Description |
|--------|---------|-------------|
| Créer | `supabase/functions/send-birthday-alert-to-contact/index.ts` | Envoi SMS/WhatsApp |
| Créer | `supabase/functions/check-birthday-alerts-for-contacts/index.ts` | Cron quotidien |
| Modifier | `src/pages/Dashboard.tsx` | Appel après ajout de contact |
| Créer | Migration SQL | Table `birthday_contact_alerts` |
| Modifier | `supabase/config.toml` | Ajouter cron job |

---

## Sécurité et Limites

### Rate Limiting
- Maximum 100 SMS/WhatsApp par jour par utilisateur (éviter le spam)
- Délai minimum de 1 heure entre deux messages au même contact

### Opt-out
- Les contacts peuvent répondre "STOP" pour ne plus recevoir de messages
- Géré via la colonne `opted_out` dans `birthday_contact_alerts`

### Confidentialité
- Les numéros de téléphone ne sont pas exposés côté client
- RLS sur `birthday_contact_alerts` : accès limité à l'utilisateur propriétaire

---

## Prérequis

### Secrets Manquants
Pour activer les SMS via Twilio, il faudra ajouter :
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`

Les secrets WhatsApp sont déjà configurés.

### Template WhatsApp
Un template "birthday_reminder" devra être créé et approuvé dans Meta Business Manager pour les messages de rappel (hors fenêtre des 24h).

---

## Estimation

- **Complexité:** Moyenne
- **Tables:** 1 nouvelle
- **Edge Functions:** 2 nouvelles
- **Modifications Frontend:** 1 fichier
- **Dépendances externes:** Twilio (optionnel), WhatsApp Cloud API (existant)
