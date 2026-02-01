
# Système d'Assignation de Livreurs aux Commandes

## Vue d'Ensemble

Cette fonctionnalité permet de rattacher un service de livraison (livreur partenaire) à une commande. Le livreur reçoit les coordonnées du prestataire, le contacte pour récupérer le colis, puis l'achemine vers l'adresse du client.

## Architecture Proposée

```text
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│    Client       │     │   Prestataire    │     │    Livreur      │
│  (Commande)     │────▶│  (Confirme)      │────▶│  (Récupère +    │
│                 │     │                  │     │   Livre)        │
└─────────────────┘     └──────────────────┘     └─────────────────┘
         │                      │                        │
         │    Notification      │    Notification        │
         │    "Commande créée"  │    "Livreur assigné"   │
         ▼                      ▼                        ▼
┌──────────────────────────────────────────────────────────────────┐
│                    Table: business_orders                         │
│  + delivery_partner_id (uuid)                                     │
│  + delivery_assigned_at (timestamp)                               │
│  + delivery_pickup_at (timestamp)                                 │
│  + delivery_status ('pending'|'assigned'|'picked_up'|'delivered') │
└──────────────────────────────────────────────────────────────────┘
```

## Modifications de la Base de Données

### 1. Nouvelle Table: `delivery_partners`

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | uuid | Clé primaire |
| `user_id` | uuid | FK vers auth.users (le livreur est un utilisateur) |
| `company_name` | text | Nom du service de livraison |
| `contact_name` | text | Nom du responsable |
| `phone` | text | Téléphone principal |
| `email` | text | Email de contact |
| `vehicle_type` | text | 'moto', 'voiture', 'vélo', 'camionnette' |
| `coverage_zones` | jsonb | Zones géographiques couvertes |
| `is_active` | boolean | Statut actif/inactif |
| `is_verified` | boolean | Vérifié par l'admin |
| `rating` | numeric | Note moyenne |
| `total_deliveries` | integer | Nombre total de livraisons |
| `latitude` | numeric | Position GPS |
| `longitude` | numeric | Position GPS |
| `created_at` | timestamp | Date de création |

### 2. Colonnes Additionnelles sur `business_orders`

| Colonne | Type | Description |
|---------|------|-------------|
| `delivery_partner_id` | uuid | FK vers delivery_partners |
| `delivery_assigned_at` | timestamp | Quand le livreur a été assigné |
| `delivery_pickup_at` | timestamp | Quand le livreur a récupéré le colis |
| `delivery_status` | text | Statut de livraison spécifique |
| `delivery_notes` | text | Instructions pour le livreur |
| `estimated_delivery_time` | text | Durée estimée |
| `delivery_fee` | numeric | Frais de livraison |

### 3. Table de Suivi: `delivery_tracking`

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | uuid | Clé primaire |
| `order_id` | uuid | FK vers business_orders |
| `partner_id` | uuid | FK vers delivery_partners |
| `status` | text | État de la livraison |
| `location` | jsonb | Position GPS actuelle |
| `notes` | text | Notes du livreur |
| `created_at` | timestamp | Horodatage |

## Flux de Travail Proposé

### Étape 1: Commande Confirmée par le Prestataire
1. Le prestataire reçoit une commande et la confirme
2. Le statut passe à `confirmed`
3. Un bouton "Assigner un livreur" apparaît

### Étape 2: Assignation du Livreur
1. Le prestataire (ou l'admin) sélectionne un livreur partenaire
2. Le système vérifie que le livreur couvre la zone
3. La commande est mise à jour avec `delivery_partner_id`

### Étape 3: Notification au Livreur
Le livreur reçoit une notification (push + SMS) contenant :
- Nom et adresse du prestataire (pickup)
- Téléphone du prestataire
- Adresse de livraison (destination)
- Téléphone du bénéficiaire
- Montant (si paiement à la livraison)

### Étape 4: Récupération du Colis
1. Le livreur contacte le prestataire
2. Il se rend à la boutique pour récupérer le colis
3. Il marque la commande comme "récupérée" (`picked_up`)

### Étape 5: Livraison au Client
1. Le livreur livre au bénéficiaire
2. Il marque comme "livrée" (`delivered`)
3. Le client peut confirmer la réception

## Fichiers à Créer/Modifier

### Nouveaux Fichiers

| Fichier | Description |
|---------|-------------|
| `src/types/delivery.ts` | Types TypeScript pour les livreurs |
| `src/hooks/useDeliveryPartners.ts` | Hook pour gérer les livreurs |
| `src/hooks/useOrderDelivery.ts` | Hook pour l'assignation livraison |
| `src/components/DeliveryPartnerCard.tsx` | Carte affichant un livreur |
| `src/components/AssignDeliveryModal.tsx` | Modal pour assigner un livreur |
| `src/components/DeliveryTrackingCard.tsx` | Suivi de livraison |
| `src/pages/DeliveryDashboard.tsx` | Dashboard pour les livreurs |
| `src/pages/Admin/DeliveryPartnersManagement.tsx` | Gestion admin des livreurs |
| `supabase/functions/assign-delivery-partner/index.ts` | Edge function pour l'assignation |
| `supabase/functions/notify-delivery-partner/index.ts` | Notification au livreur |

### Fichiers à Modifier

| Fichier | Modification |
|---------|--------------|
| `src/components/BusinessOrdersSection.tsx` | Ajouter bouton "Assigner livreur" |
| `src/components/admin/AdminOrderDetailsModal.tsx` | Afficher info livreur + assignation |
| `src/hooks/useAdminOrders.ts` | Ajouter champs livreur |
| `src/pages/BusinessAccount.tsx` | Intégrer le suivi livraison |

### Migrations SQL

1. **Créer table `delivery_partners`**
2. **Ajouter colonnes à `business_orders`**
3. **Créer table `delivery_tracking`**
4. **Ajouter politiques RLS**

## Interface Utilisateur

### Pour le Prestataire
- Bouton "Assigner un livreur" sur les commandes confirmées
- Liste des livreurs disponibles dans la zone
- Suivi en temps réel de la livraison

### Pour le Livreur (Dashboard Dédié)
- Liste des commandes à récupérer
- Détails du prestataire (adresse, téléphone)
- Détails du client (adresse, téléphone)
- Boutons d'action (Récupéré, Livré)
- Historique des livraisons

### Pour l'Admin
- Gestion des livreurs partenaires (CRUD)
- Vue globale des livraisons en cours
- Statistiques de performance des livreurs
- Assignation manuelle si nécessaire

## Notifications

| Événement | Destinataire | Canal |
|-----------|--------------|-------|
| Livreur assigné | Livreur | Push + SMS |
| Colis récupéré | Client + Prestataire | Push |
| Colis livré | Client + Prestataire | Push |
| Livraison en retard | Admin | Push |

## Sécurité (RLS)

- Les livreurs ne voient que leurs propres commandes assignées
- Les prestataires voient les livreurs mais pas leurs autres commandes
- Les admins ont accès complet
- Les clients voient uniquement le statut de leur commande

## Estimation d'Effort

| Phase | Tâche | Complexité |
|-------|-------|------------|
| 1 | Migration DB + Types | Moyenne |
| 2 | Hooks et logique métier | Moyenne |
| 3 | UI Prestataire (assignation) | Faible |
| 4 | Dashboard Livreur | Haute |
| 5 | Admin Management | Moyenne |
| 6 | Notifications | Moyenne |
| 7 | Tests et ajustements | Moyenne |

## Prochaines Étapes Recommandées

1. **Phase 1** : Créer les migrations SQL et les types TypeScript
2. **Phase 2** : Implémenter le hook `useDeliveryPartners` et la modal d'assignation
3. **Phase 3** : Créer le dashboard livreur
4. **Phase 4** : Ajouter les notifications
5. **Phase 5** : Intégrer dans l'interface admin
