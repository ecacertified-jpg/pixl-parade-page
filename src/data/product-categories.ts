import { 
  Gift, Gem, Sparkles, Smartphone, Shirt, Hammer, 
  UtensilsCrossed, Home, Gamepad2, Baby, Briefcase,
  Hotel, PartyPopper, GraduationCap, Star, Camera,
  Palette, Heart, LucideIcon 
} from "lucide-react";

/**
 * Définitions centralisées des catégories de produits et expériences
 * Utilisé par Shop.tsx et CategoryPage.tsx pour cohérence
 */

export interface CategoryDefinition {
  name: string;        // Nom affiché (utilisé dans la base de données)
  slug: string;        // URL slug (kebab-case)
  icon: LucideIcon;    // Icône Lucide
  isExperience: boolean;
  description?: string; // Description pour SEO
}

// Catégories de produits physiques
export const PRODUCT_CATEGORIES: CategoryDefinition[] = [
  { 
    name: "Bijoux & Accessoires", 
    slug: "bijoux-accessoires", 
    icon: Gem, 
    isExperience: false,
    description: "Bijoux artisanaux, montres, sacs et accessoires de mode"
  },
  { 
    name: "Parfums & Beauté", 
    slug: "parfums-beaute", 
    icon: Sparkles, 
    isExperience: false,
    description: "Parfums, cosmétiques et soins beauté"
  },
  { 
    name: "Tech & Électronique", 
    slug: "tech-electronique", 
    icon: Smartphone, 
    isExperience: false,
    description: "Gadgets, smartphones et accessoires high-tech"
  },
  { 
    name: "Mode & Vêtements", 
    slug: "mode-vetements", 
    icon: Shirt, 
    isExperience: false,
    description: "Vêtements, chaussures et mode africaine"
  },
  { 
    name: "Artisanat Ivoirien", 
    slug: "artisanat-ivoirien", 
    icon: Hammer, 
    isExperience: false,
    description: "Artisanat traditionnel et créations locales"
  },
  { 
    name: "Gastronomie & Délices", 
    slug: "gastronomie-delices", 
    icon: UtensilsCrossed, 
    isExperience: false,
    description: "Produits gourmands, chocolats et spécialités locales"
  },
  { 
    name: "Décoration & Maison", 
    slug: "decoration-maison", 
    icon: Home, 
    isExperience: false,
    description: "Décoration intérieure et objets pour la maison"
  },
  { 
    name: "Loisirs & Divertissement", 
    slug: "loisirs-divertissement", 
    icon: Gamepad2, 
    isExperience: false,
    description: "Jeux, livres et divertissement"
  },
  { 
    name: "Bébé & Enfants", 
    slug: "bebe-enfants", 
    icon: Baby, 
    isExperience: false,
    description: "Cadeaux et articles pour bébés et enfants"
  },
  { 
    name: "Affaires & Bureau", 
    slug: "affaires-bureau", 
    icon: Briefcase, 
    isExperience: false,
    description: "Accessoires professionnels et fournitures de bureau"
  }
];

// Catégories d'expériences
export const EXPERIENCE_CATEGORIES: CategoryDefinition[] = [
  { 
    name: "Restaurants & Gastronomie", 
    slug: "restaurants-gastronomie", 
    icon: UtensilsCrossed, 
    isExperience: true,
    description: "Expériences culinaires et restaurants"
  },
  { 
    name: "Bien-être & Spa", 
    slug: "bien-etre-spa", 
    icon: Sparkles, 
    isExperience: true,
    description: "Soins spa, massages et bien-être"
  },
  { 
    name: "Séjours & Hébergement", 
    slug: "sejours-hebergement", 
    icon: Hotel, 
    isExperience: true,
    description: "Séjours hôteliers et hébergements de charme"
  },
  { 
    name: "Événements & Célébrations", 
    slug: "evenements-celebrations", 
    icon: PartyPopper, 
    isExperience: true,
    description: "Organisation d'événements et célébrations"
  },
  { 
    name: "Formation & Développement", 
    slug: "formation-developpement", 
    icon: GraduationCap, 
    isExperience: true,
    description: "Formations, ateliers et développement personnel"
  },
  { 
    name: "Expériences VIP", 
    slug: "experiences-vip", 
    icon: Star, 
    isExperience: true,
    description: "Expériences exclusives et sur-mesure"
  },
  { 
    name: "Souvenirs & Photographie", 
    slug: "souvenirs-photographie", 
    icon: Camera, 
    isExperience: true,
    description: "Services photo et création de souvenirs"
  },
  { 
    name: "Culture & Loisirs", 
    slug: "culture-loisirs", 
    icon: Palette, 
    isExperience: true,
    description: "Activités culturelles et loisirs créatifs"
  },
  { 
    name: "Mariage & Fiançailles", 
    slug: "mariage-fiancailles", 
    icon: Heart, 
    isExperience: true,
    description: "Services et cadeaux pour mariages"
  },
  { 
    name: "Occasions Spéciales", 
    slug: "occasions-speciales", 
    icon: Gift, 
    isExperience: true,
    description: "Cadeaux pour toutes les occasions spéciales"
  }
];

// Toutes les catégories combinées
export const ALL_CATEGORIES: CategoryDefinition[] = [
  ...PRODUCT_CATEGORIES,
  ...EXPERIENCE_CATEGORIES
];

/**
 * Récupère une catégorie par son slug URL
 */
export function getCategoryBySlug(slug: string): CategoryDefinition | undefined {
  return ALL_CATEGORIES.find(cat => cat.slug === slug);
}

/**
 * Récupère une catégorie par son nom (utilisé en base de données)
 */
export function getCategoryByName(name: string): CategoryDefinition | undefined {
  return ALL_CATEGORIES.find(cat => cat.name === name);
}

/**
 * Génère un slug à partir d'un nom de catégorie
 */
export function generateSlugFromName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Supprime les accents
    .replace(/[&]/g, "")
    .replace(/\s+/g, "-")
    .replace(/--+/g, "-")
    .trim();
}

/**
 * Catégorie "Tous" pour les filtres
 */
export const ALL_CATEGORY: Omit<CategoryDefinition, 'slug' | 'isExperience' | 'description'> = {
  name: "Tous",
  icon: Gift
};
