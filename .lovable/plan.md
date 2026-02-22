
## Monitoring automatique du taux de succes WhatsApp OTP

### Objectif
Creer une Edge Function CRON qui calcule periodiquement le taux de succes des OTP WhatsApp et genere une alerte admin quand il descend sous un seuil configurable (defaut: 80%).

### Architecture

Le systeme s'integre dans l'infrastructure d'alertes existante en reutilisant :
- La table `admin_notifications` pour les alertes (avec `type = 'otp_success_rate_drop'`)
- La table `growth_alert_thresholds` pour le seuil configurable (nouveau `metric_type = 'whatsapp_otp_success_rate'`)
- Le pattern des CRON jobs existants (pg_cron + net.http_post)

### Etapes

#### 1. Migration SQL
- Inserer un seuil par defaut dans `growth_alert_thresholds` :
  - `metric_type`: `whatsapp_otp_success_rate`
  - `threshold_type`: `minimum_percentage`
  - `threshold_value`: `80`
  - `comparison_period`: `1h` (fenetre glissante d'1 heure)
  - `is_active`: true

#### 2. Edge Function `check-whatsapp-otp-health`
Nouvelle fonction qui :
1. Lit le seuil depuis `growth_alert_thresholds` (ou utilise 80% par defaut)
2. Calcule les stats OTP sur la derniere heure depuis `whatsapp_otp_codes` :
   - Nombre total envoyes
   - Nombre verifies (`verified_at IS NOT NULL`)
   - Taux de succes = verifies / total * 100
3. Ne declenche l'alerte que si le volume est significatif (minimum 5 OTP sur la periode, pour eviter les faux positifs)
4. Verifie si une alerte similaire a deja ete envoyee dans les 2 dernieres heures (anti-spam)
5. Si le taux est sous le seuil ET pas d'alerte recente :
   - Insere dans `admin_notifications` avec severity `critical`
   - Inclut dans les metadata : taux actuel, seuil, nombre d'OTP, periode
6. Logue un rapport structure en JSON

#### 3. Configuration CRON
- Job `check-whatsapp-otp-health-hourly` execute toutes les heures
- Appel via `net.http_post` avec cle `service_role`

#### 4. Config TOML
- Ajouter l'entree pour `check-whatsapp-otp-health` avec `verify_jwt = false`

### Details techniques

**Format de l'alerte admin** :
| Champ | Valeur |
|-------|--------|
| type | `otp_success_rate_drop` |
| title | `Alerte OTP WhatsApp : taux de succes bas` |
| message | `Le taux de succes OTP est de X% (seuil: 80%) sur la derniere heure. Y OTP envoyes, Z verifies.` |
| severity | `critical` |
| action_url | `/admin/whatsapp-otp` |
| metadata | `{ success_rate, threshold, total_sent, total_verified, period_hours }` |

**Anti-spam** : Verification dans `admin_notifications` qu'aucune alerte `otp_success_rate_drop` n'existe dans les 2 dernieres heures avant d'en creer une nouvelle.

**Seuil minimum de volume** : 5 OTP minimum sur la periode pour eviter les alertes quand il n'y a quasi aucun trafic (ex: 1 echec sur 1 envoi = 0% mais non significatif).

### Fichiers concernes
- **Nouveau** : `supabase/functions/check-whatsapp-otp-health/index.ts`
- **Modifie** : `supabase/config.toml` (ajout verify_jwt = false)
- **Migration SQL** : seuil par defaut + job CRON
