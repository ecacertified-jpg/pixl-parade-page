/**
 * About Data - Source unique de vérité
 * Utilisé par le composant About.tsx et le script de génération Markdown
 */

export interface Feature {
  iconName: string;
  title: string;
  description: string;
}

export interface GiftType {
  name: string;
  examples: string;
}

export interface PaymentMethod {
  method: string;
  availability: string;
}

export interface DeliveryZone {
  country: string;
  cities: string;
}

export const features: Feature[] = [
  {
    iconName: "Gift",
    title: "Cagnottes collectives",
    description: "Organisez des cadeaux de groupe pour toutes les occasions",
  },
  {
    iconName: "Bell",
    title: "Rappels d'anniversaires",
    description: "Ne manquez plus jamais une date importante",
  },
  {
    iconName: "ShoppingBag",
    title: "Boutique de cadeaux",
    description: "Découvrez des idées de cadeaux locaux et personnalisés",
  },
  {
    iconName: "Users",
    title: "Communauté",
    description: "Partagez vos moments de joie avec vos proches",
  },
];

export const giftTypes: GiftType[] = [
  { name: "Mode africaine", examples: "Boubous, wax, pagnes, vêtements traditionnels" },
  { name: "Bijoux", examples: "Créations artisanales en or, argent, perles" },
  { name: "Gastronomie", examples: "Gâteaux personnalisés, chocolats, paniers gourmands" },
  { name: "Fleurs", examples: "Bouquets et compositions florales" },
  { name: "Expériences", examples: "Spa, restaurants, ateliers créatifs" },
];

export const occasions: string[] = [
  "Anniversaires",
  "Mariages",
  "Naissances",
  "Promotions professionnelles",
  "Diplômes et réussites scolaires",
  "Pendaisons de crémaillère",
  "Fêtes religieuses (Tabaski, Noël)",
  "Départs en retraite",
];

export const paymentMethods: PaymentMethod[] = [
  { method: "Orange Money", availability: "Côte d'Ivoire, Sénégal, Mali" },
  { method: "MTN Mobile Money", availability: "Côte d'Ivoire, Bénin, Cameroun" },
  { method: "Wave", availability: "Sénégal, Côte d'Ivoire" },
  { method: "Flooz", availability: "Togo, Bénin" },
];

export const deliveryZones: DeliveryZone[] = [
  { country: "Côte d'Ivoire", cities: "Abidjan (toutes communes)" },
  { country: "Bénin", cities: "Cotonou" },
  { country: "Sénégal", cities: "Dakar" },
];
