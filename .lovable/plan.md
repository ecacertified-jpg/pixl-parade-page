
# Plan de Continuation : Système d'Assignation de Livreurs

## Situation Actuelle

La migration de base de données a été appliquée avec succès. Les tables et colonnes suivantes existent :

- **Table `delivery_partners`** : 17 colonnes (id, user_id, company_name, phone, vehicle_type, coverage_zones, is_verified, etc.)
- **Table `delivery_tracking`** : 7 colonnes (id, order_id, partner_id, status, location, notes, created_at)
- **Colonnes ajoutées à `business_orders`** : delivery_partner_id, delivery_status, delivery_fee, delivery_assigned_at, etc.

## Prochaines Etapes

### Phase 2A : Types TypeScript

**Fichier à créer : `src/types/delivery.ts`**

Définir les interfaces pour :
- `DeliveryPartner` : Représente un livreur partenaire
- `DeliveryTracking` : Suivi d'une livraison
- `DeliveryStatus` : Statuts possibles ('pending' | 'assigned' | 'picked_up' | 'delivered')

### Phase 2B : Hook useDeliveryPartners

**Fichier à créer : `src/hooks/useDeliveryPartners.ts`**

Fonctionnalités :
- `loadPartners()` : Charger les livreurs actifs et vérifiés
- `getAvailablePartners(zone)` : Filtrer par zone de couverture
- Gestion des états loading, error

### Phase 2C : Hook useOrderDelivery

**Fichier à créer : `src/hooks/useOrderDelivery.ts`**

Fonctionnalités :
- `assignPartner(orderId, partnerId)` : Assigner un livreur à une commande
- `updateDeliveryStatus(orderId, status)` : Mettre à jour le statut
- `addTrackingEntry()` : Ajouter une entrée de suivi

### Phase 2D : Modal d'Assignation

**Fichier à créer : `src/components/AssignDeliveryModal.tsx`**

Interface permettant de :
- Afficher la liste des livreurs disponibles
- Voir leurs informations (nom, véhicule, note, téléphone)
- Sélectionner et confirmer l'assignation
- Ajouter des notes pour le livreur

### Phase 2E : Integration dans BusinessOrdersSection

**Fichier à modifier : `src/components/BusinessOrdersSection.tsx`**

Ajouter :
- Bouton "Assigner un livreur" sur les commandes confirmées/traitées
- Affichage des infos du livreur assigné
- Statut de livraison visible

## Details Techniques

### Structure du Type DeliveryPartner

```text
DeliveryPartner {
  id: string
  user_id: string | null
  company_name: string
  contact_name: string
  phone: string
  email: string | null
  vehicle_type: 'moto' | 'voiture' | 'velo' | 'camionnette'
  coverage_zones: { name: string, radius: number }[]
  is_active: boolean
  is_verified: boolean
  rating: number
  total_deliveries: number
  latitude: number | null
  longitude: number | null
}
```

### Flux d'Assignation

```text
┌─────────────────┐
│ Commande        │
│ status=confirmed│
└────────┬────────┘
         │ Bouton "Assigner livreur"
         ▼
┌─────────────────┐
│ Modal           │
│ AssignDelivery  │──► Liste des livreurs actifs
└────────┬────────┘
         │ Selection + Confirmation
         ▼
┌─────────────────┐
│ business_orders │
│ delivery_partner│
│ _id = partner   │
│ delivery_status │
│ = 'assigned'    │
└────────┬────────┘
         │ Notification envoyee
         ▼
┌─────────────────┐
│ Livreur notifie │
│ Recoit contacts │
└─────────────────┘
```

### Fichiers Impactes

| Fichier | Action |
|---------|--------|
| `src/types/delivery.ts` | Creer |
| `src/hooks/useDeliveryPartners.ts` | Creer |
| `src/hooks/useOrderDelivery.ts` | Creer |
| `src/components/AssignDeliveryModal.tsx` | Creer |
| `src/components/BusinessOrdersSection.tsx` | Modifier |
| `src/hooks/useAdminOrders.ts` | Modifier (ajouter champs livreur) |

## Ordre d'Implementation

1. Creer les types TypeScript
2. Creer le hook useDeliveryPartners
3. Creer le hook useOrderDelivery
4. Creer le composant AssignDeliveryModal
5. Integrer dans BusinessOrdersSection
6. Ajouter l'affichage dans AdminOrderDetailsModal
