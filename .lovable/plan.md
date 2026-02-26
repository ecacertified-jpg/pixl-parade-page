
## Dashboard Monitoring Delivrabilite WhatsApp vs SMS

### Contexte

Les donnees de delivrabilite sont principalement stockees dans la table `birthday_contact_alerts` qui enregistre chaque envoi avec le canal (`whatsapp`/`sms`), le statut (`sent`/`failed`), le type d'alerte, le message d'erreur et le timestamp. Actuellement, 142 envois WhatsApp (sent) et 1 SMS (failed) sont enregistres. La table `whatsapp_otp_codes` couvre uniquement les OTP et a deja son propre dashboard.

### Architecture

Creer une nouvelle page admin `/admin/messaging-delivery` avec un hook dedie et une fonction RPC pour agreger les statistiques cote serveur.

### Composants a creer

#### 1. Fonction RPC SQL : `get_messaging_delivery_stats`

Agregation serveur depuis `birthday_contact_alerts` :
- KPIs globaux : total envoyes, taux succes WhatsApp, taux succes SMS, taux echec global
- Repartition par canal (whatsapp vs sms) avec comptages sent/failed
- Repartition par type d'alerte (friends_circle_reminder, birthday_reminder, contribution_reminder, etc.)
- Tendances quotidiennes sur N jours (parametre `days_back`)
- Top erreurs (groupees par `error_message`)
- Repartition par prefixe pays (extraction des 4 premiers caracteres de `contact_phone`)

Parametres : `days_back integer DEFAULT 30`

#### 2. Hook : `src/hooks/useMessagingDeliveryStats.ts`

- Appel RPC `get_messaging_delivery_stats` via TanStack Query
- Interfaces TypeScript pour les donnees retournees
- Refresh automatique toutes les 60 secondes

#### 3. Page : `src/pages/Admin/MessagingDeliveryDashboard.tsx`

Structure visuelle (suivant le pattern de NotificationAnalytics/WhatsAppOtpAnalytics) :

```text
+-------------------------------------------+
| Delivrabilite SMS & WhatsApp              |
| [Selecteur periode] [Rafraichir]          |
+-------------------------------------------+
| KPI Cards (4 colonnes)                    |
| Total Envoyes | WhatsApp OK% | SMS OK% | Echecs |
+-------------------------------------------+
| Graphique AreaChart - Tendances par jour  |
| (lignes: whatsapp_sent, whatsapp_failed,  |
|  sms_sent, sms_failed)                    |
+-------------------------------------------+
| PieChart Canal | PieChart Status           |
+-------------------------------------------+
| Tableau par type d'alerte                 |
| (alert_type, wa_sent, wa_failed,          |
|  sms_sent, sms_failed, taux_succes)       |
+-------------------------------------------+
| Tableau par pays (prefixe tel)            |
| (+225, +229, +221...) avec taux par canal |
+-------------------------------------------+
| Top erreurs recentes                      |
+-------------------------------------------+
```

#### 4. Integration

- Ajouter la route `/admin/messaging-delivery` dans `App.tsx`
- Ajouter l'entree dans `navItems` de `AdminLayout.tsx` (icone `MessageSquare` ou `Smartphone`, titre "Delivrabilite SMS/WA")

### Fichiers modifies/crees

| Fichier | Action |
|---------|--------|
| Migration SQL (RPC `get_messaging_delivery_stats`) | Creer |
| `src/hooks/useMessagingDeliveryStats.ts` | Creer |
| `src/pages/Admin/MessagingDeliveryDashboard.tsx` | Creer |
| `src/components/AdminLayout.tsx` | Ajouter nav item |
| `src/App.tsx` | Ajouter route |
| `src/integrations/supabase/types.ts` | Mis a jour automatiquement apres migration |

### Details techniques

La fonction RPC sera `SECURITY DEFINER` avec verification admin (pattern existant de `get_whatsapp_otp_stats`). Les graphiques utiliseront `recharts` (deja installe). Le selecteur de periode reprendra le composant `SimplePeriodSelector` existant.
