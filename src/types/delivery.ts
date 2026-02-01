// Types pour le système de livraison

export type VehicleType = 'moto' | 'voiture' | 'velo' | 'camionnette';

export type DeliveryStatus = 'pending' | 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'failed';

export interface CoverageZone {
  name: string;
  radius: number;
}

export interface DeliveryPartner {
  id: string;
  user_id: string | null;
  company_name: string;
  contact_name: string;
  phone: string;
  email: string | null;
  vehicle_type: VehicleType;
  license_plate: string | null;
  coverage_zones: CoverageZone[];
  is_active: boolean;
  is_verified: boolean;
  rating: number;
  total_deliveries: number;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  updated_at: string;
}

export interface DeliveryTracking {
  id: string;
  order_id: string;
  partner_id: string;
  status: DeliveryStatus;
  location: {
    latitude: number;
    longitude: number;
  } | null;
  notes: string | null;
  created_at: string;
}

export interface OrderDeliveryInfo {
  delivery_partner_id: string | null;
  delivery_status: DeliveryStatus | null;
  delivery_fee: number | null;
  delivery_notes: string | null;
  delivery_assigned_at: string | null;
  delivery_pickup_at: string | null;
  delivery_delivered_at: string | null;
  estimated_delivery_time: string | null;
  partner?: DeliveryPartner;
}

// Labels pour les statuts de livraison
export const DELIVERY_STATUS_LABELS: Record<DeliveryStatus, string> = {
  pending: 'En attente d\'assignation',
  assigned: 'Livreur assigné',
  picked_up: 'Récupéré',
  in_transit: 'En livraison',
  delivered: 'Livré',
  failed: 'Échec de livraison'
};

// Couleurs pour les statuts de livraison
export const DELIVERY_STATUS_COLORS: Record<DeliveryStatus, string> = {
  pending: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  assigned: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  picked_up: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  in_transit: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  delivered: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
};

// Labels pour les types de véhicules
export const VEHICLE_TYPE_LABELS: Record<VehicleType, string> = {
  moto: 'Moto',
  voiture: 'Voiture',
  velo: 'Vélo',
  camionnette: 'Camionnette'
};

// Icônes pour les types de véhicules (Lucide icon names)
export const VEHICLE_TYPE_ICONS: Record<VehicleType, string> = {
  moto: 'Bike',
  voiture: 'Car',
  velo: 'Bike',
  camionnette: 'Truck'
};
