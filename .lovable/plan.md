

## Plan : Mise à jour du Knowledge "Database Schema"

Le document Knowledge actuel "Compliance Requirements" contient le schema DB mais il est incomplet -- il manque de nombreuses tables ajoutees recemment. Voici le contenu mis a jour a copier dans l'onglet Knowledge de Lovable (Settings > Manage Knowledge > document "Compliance Requirements" ou creer un document dedie "Database Schema").

### Tables a ajouter au Knowledge

**1. contact_requests** -- Demandes d'amitie entre utilisateurs

| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid | PK |
| requester_id | uuid | FK profiles.user_id |
| target_id | uuid | FK profiles.user_id |
| status | text | 'pending', 'accepted', 'rejected' (default 'pending') |
| message | text | Message optionnel |
| requested_at | timestamptz | Date de la demande |
| responded_at | timestamptz | Date de reponse |
| expires_at | timestamptz | Expiration (default now() + 7 jours) |
| metadata | jsonb | Donnees supplementaires |

**2. contact_relationships** -- Relations d'amitie etablies (symetriques)

| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid | PK |
| user_a | uuid | FK auth.users (LEAST des 2 UUIDs) |
| user_b | uuid | FK auth.users (GREATEST des 2 UUIDs) |
| relationship_type | text | 'friend' (default) |
| established_at | timestamptz | Date d'etablissement |
| can_see_events | boolean | Permission evenements (default true) |
| can_see_funds | boolean | Permission cagnottes (default true) |

Index unique symetrique : `idx_contact_relationships_symmetric` sur `(LEAST(user_a, user_b), GREATEST(user_a, user_b))` pour empecher les doublons inverses.

**3. payment_splits** -- Repartition des paiements vendeur/plateforme

| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid | PK |
| business_order_id | uuid | FK business_orders |
| total_client_amount | numeric | Montant total client |
| vendor_amount | numeric | Part vendeur |
| platform_amount | numeric | Commission plateforme |
| currency | text | 'XOF' |
| markup_rate | numeric | Taux de marge (%) |
| vendor_wave_phone | text | Tel Wave vendeur |
| platform_wave_phone | text | Tel Wave plateforme |
| vendor_transfer_status | text | 'pending', 'simulated', 'completed' |
| platform_transfer_status | text | 'pending', 'simulated', 'completed' |
| vendor_transfer_ref | text | Reference transfert vendeur |
| platform_transfer_ref | text | Reference transfert plateforme |
| payment_method | text | 'wave' (default) |
| processed_at | timestamptz | Date de traitement |

**4. seo_sync_queue** -- File d'attente d'indexation SEO

| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid | PK |
| entity_type | text | 'product', 'business', 'fund', 'page' |
| entity_id | text | ID de l'entite |
| action | text | 'create', 'update', 'delete' |
| url | text | URL a indexer |
| priority | text | 'high', 'normal', 'low' |
| metadata | jsonb | Contexte additionnel |
| processed | boolean | Traite ou non |
| processed_at | timestamptz | Date de traitement |

**5. seo_sync_stats** -- Statistiques de synchronisation SEO

| Colonne | Type | Description |
|---------|------|-------------|
| stat_type | text | PK ('last_sync', 'platform_stats', 'daily_stats') |
| stat_value | jsonb | Valeurs des statistiques |
| last_updated | timestamptz | Derniere mise a jour |

**6. contact_events** -- Evenements lies aux contacts

| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid | PK |
| contact_id | uuid | FK contacts |
| event_type | text | Type d'evenement |
| event_date | date | Date de l'evenement |
| title | text | Titre |
| description | text | Description |
| is_recurring | boolean | Recurrent (default true) |

**7. contact_alert_preferences** -- Preferences d'alerte par utilisateur

| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid | PK |
| user_id | uuid | FK auth.users |
| alerts_enabled | boolean | Alertes actives |
| sms/whatsapp/email_enabled | boolean | Canaux |
| alert_30/21/14/7/5/3/2/1_days | boolean | Jours avant l'evenement |
| alert_day_of | boolean | Le jour meme |
| notify_of_adder_birthday | boolean | Notifier l'ajouteur |

**8. delivery_partners** -- Partenaires de livraison

| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid | PK |
| company_name | text | Nom societe |
| contact_name | text | Nom contact |
| phone | text | Telephone |
| vehicle_type | text | 'moto' (default) |
| coverage_zones | jsonb | Zones couvertes |
| is_active/is_verified | boolean | Statuts |
| rating | numeric | Note moyenne |
| total_deliveries | integer | Nombre de livraisons |

**9. delivery_tracking** -- Suivi de livraison en temps reel

| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid | PK |
| order_id | uuid | FK business_orders |
| partner_id | uuid | FK delivery_partners |
| status | text | Statut actuel |
| location | jsonb | Position GPS |
| notes | text | Notes |

**10. detected_duplicate_accounts** -- Comptes dupliques detectes

| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid | PK |
| type | text | Type de doublon |
| match_criteria | text[] | Criteres de correspondance |
| confidence | text | 'low', 'medium', 'high' |
| account_ids | uuid[] | UUIDs des comptes concernes |
| primary_user_id | uuid | Compte principal |
| status | text | 'pending', 'merged', 'dismissed' |
| reviewed_by/reviewed_at | uuid/timestamptz | Admin review |
| admin_notes | text | Notes admin |

**11. platform_settings** -- Parametres globaux de la plateforme

| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid | PK |
| setting_key | text | Cle unique |
| setting_value | jsonb | Valeur |
| description | text | Description |

### Colonnes ajoutees aux tables existantes

**business_accounts** : `country_code`, `latitude`, `longitude`, `wave_merchant_phone`, `mobile_money_merchant_phone`, `deleted_at`, `deleted_by`, `rejection_date`, `resubmission_count`, `corrections_message`

**business_orders** : `customer_confirmed_at`, `customer_rating`, `customer_review_text`, `refund_reason`, `refund_requested_at`, `delivery_partner_id`, `delivery_assigned_at`, `delivery_pickup_at`, `delivery_delivered_at`, `delivery_status`, `delivery_notes`, `estimated_delivery_time`, `delivery_fee`

### Action requise

Copiez ce contenu dans **Settings > Manage Knowledge** dans Lovable. Vous pouvez soit :
1. Mettre a jour le document existant "Compliance Requirements" (qui contient deja le schema DB) en ajoutant ces sections
2. Creer un document dedie "Database Schema - Tables Recentes" pour garder les documents separes et modulaires (recommande)

