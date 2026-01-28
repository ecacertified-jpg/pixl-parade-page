
# Page de Préférences de Notification pour Alertes Anniversaire Contacts

## Contexte

L'utilisateur souhaite pouvoir configurer comment et quand ses **contacts** reçoivent des alertes SMS/WhatsApp pour son propre anniversaire. C'est l'inverse du système actuel qui notifie l'utilisateur des anniversaires de ses contacts.

## Architecture Existante

### Ce qui existe déjà
- Table `notification_preferences` : préférences pour les notifications reçues par l'utilisateur
- Table `birthday_contact_alerts` : suivi des alertes envoyées aux contacts (créée récemment)
- Page `/notification-settings` : configuration des notifications personnelles
- Composant `BirthdayReminderTimingSettings` : sélection des jours de rappel

### Ce qui manque
- Aucune table pour les préférences d'alertes vers les contacts
- Aucune interface utilisateur pour configurer ces alertes

---

## Plan d'Implémentation

### 1. Migration Base de Données

Créer une nouvelle table `contact_alert_preferences` pour stocker les préférences de l'utilisateur concernant les alertes envoyées à ses contacts.

**Colonnes :**
| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid | Clé primaire |
| user_id | uuid | FK vers auth.users (unique) |
| alerts_enabled | boolean | Activer/désactiver les alertes |
| sms_enabled | boolean | Utiliser le canal SMS |
| whatsapp_enabled | boolean | Utiliser le canal WhatsApp |
| email_enabled | boolean | Utiliser le canal Email |
| alert_on_contact_add | boolean | Alerter immédiatement à l'ajout |
| alert_30_days | boolean | Rappel à J-30 |
| alert_14_days | boolean | Rappel à J-14 |
| alert_10_days_daily | boolean | Rappels quotidiens J-10 à J-1 |
| custom_message | text | Message personnalisé (optionnel) |
| created_at | timestamp | Date de création |
| updated_at | timestamp | Date de mise à jour |

**Politiques RLS :**
- SELECT : utilisateur peut voir ses propres préférences
- INSERT/UPDATE : utilisateur peut modifier ses propres préférences

---

### 2. Hook React : `useContactAlertPreferences`

**Fichier :** `src/hooks/useContactAlertPreferences.ts`

**Fonctionnalités :**
- Charger les préférences de l'utilisateur connecté
- Créer les préférences par défaut si absentes
- Mettre à jour les préférences avec feedback toast
- Retourner l'état de chargement et sauvegarde

**Valeurs par défaut :**
```typescript
const defaultPreferences = {
  alerts_enabled: true,
  sms_enabled: true,
  whatsapp_enabled: true,
  email_enabled: false,
  alert_on_contact_add: true,
  alert_30_days: true,
  alert_14_days: true,
  alert_10_days_daily: true,
  custom_message: null,
};
```

---

### 3. Composant : `ContactAlertPreferencesSection`

**Fichier :** `src/components/preferences/ContactAlertPreferencesSection.tsx`

**Interface utilisateur :**

```text
┌──────────────────────────────────────────────────────────────┐
│  📲 Alertes pour vos contacts                                │
│  Configurez comment vos amis sont informés de votre          │
│  anniversaire                                                │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  [Switch] Activer les alertes anniversaire pour mes contacts │
│                                                              │
│  ─────────────────────────────────────────────────────────── │
│                                                              │
│  CANAUX DE COMMUNICATION                                     │
│                                                              │
│  [Switch] SMS      │  [Switch] WhatsApp  │  [Switch] Email   │
│                                                              │
│  ─────────────────────────────────────────────────────────── │
│                                                              │
│  CALENDRIER DES RAPPELS                                      │
│                                                              │
│  [Checkbox] À l'ajout d'un contact                           │
│             "Notification immédiate quand vous ajoutez       │
│              un ami avec numéro de téléphone"                │
│                                                              │
│  [Checkbox] 1 mois avant (J-30)                              │
│             "Premier rappel pour planifier"                  │
│                                                              │
│  [Checkbox] 2 semaines avant (J-14)                          │
│             "Rappel pour commander un cadeau"                │
│                                                              │
│  [Checkbox] 10 jours avant → Veille (quotidien)              │
│             "Rappels quotidiens intensifs"                   │
│                                                              │
│  ─────────────────────────────────────────────────────────── │
│                                                              │
│  MESSAGE PERSONNALISÉ (optionnel)                            │
│                                                              │
│  [Textarea]                                                  │
│  "Ce message sera inclus dans les notifications..."          │
│                                                              │
│  ─────────────────────────────────────────────────────────── │
│                                                              │
│  💡 Info: Les messages sont envoyés via SMS en Côte d'Ivoire │
│     et via WhatsApp dans les autres pays.                    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

### 4. Intégration dans la Page Preferences

**Fichier :** `src/pages/Preferences.tsx`

**Modifications :**
- Ajouter un nouvel onglet "Alertes" avec l'icône `Bell`
- Intégrer le composant `ContactAlertPreferencesSection`
- Mettre à jour le TabsList pour 6 onglets

```typescript
<TabsTrigger value="alerts" className="flex gap-1 text-xs">
  <Bell className="h-3 w-3" aria-hidden />
  <span className="hidden sm:inline">Alertes</span>
</TabsTrigger>

// ...

<TabsContent value="alerts" className="mt-6">
  <ContactAlertPreferencesSection />
</TabsContent>
```

---

### 5. Mise à jour du Hook Notification

Le hook existant `useNotificationPreferences` restera inchangé car il gère les notifications **reçues** par l'utilisateur. Le nouveau hook `useContactAlertPreferences` gère les alertes **envoyées** aux contacts.

---

## Fichiers à Créer/Modifier

| Action | Fichier | Description |
|--------|---------|-------------|
| Créer | Migration SQL | Table `contact_alert_preferences` avec RLS |
| Créer | `src/hooks/useContactAlertPreferences.ts` | Hook de gestion des préférences |
| Créer | `src/components/preferences/ContactAlertPreferencesSection.tsx` | UI du composant |
| Modifier | `src/pages/Preferences.tsx` | Ajouter onglet "Alertes" |

---

## Points Techniques

### Gestion des Canaux

L'interface permet de choisir plusieurs canaux simultanément. La logique d'envoi dans l'Edge Function déterminera automatiquement le canal optimal selon :
1. Le pays du contact (SMS fiable en CI, WhatsApp ailleurs)
2. Les préférences de l'utilisateur
3. La disponibilité du canal

### Sauvegarde Automatique

Chaque modification déclenche une sauvegarde immédiate (comme les autres sections de préférences) avec un toast de confirmation.

### Désactivation des Options

Quand `alerts_enabled` est `false`, toutes les autres options sont visuellement désactivées (grisées) mais conservent leur état pour réactivation ultérieure.

---

## Estimation

- **Complexité** : Faible à moyenne
- **Nouvelles tables** : 1
- **Nouveaux composants** : 1
- **Nouveaux hooks** : 1
- **Fichiers modifiés** : 1 (Preferences.tsx)
