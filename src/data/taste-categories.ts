import { Laptop, ShoppingBag, Plane, Music, Utensils, Dumbbell, Star, Heart, Gift, LucideIcon } from "lucide-react";

export interface TasteCategory {
  id: string;
  label: string;
  icon: LucideIcon;
  color: string;
}

export const TASTE_CATEGORIES: TasteCategory[] = [
  { id: 'tech', label: 'Tech', icon: Laptop, color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  { id: 'mode', label: 'Mode', icon: ShoppingBag, color: 'bg-pink-500/10 text-pink-500 border-pink-500/20' },
  { id: 'voyage', label: 'Voyage', icon: Plane, color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  { id: 'musique', label: 'Musique', icon: Music, color: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
  { id: 'gastronomie', label: 'Gastronomie', icon: Utensils, color: 'bg-orange-500/10 text-orange-500 border-orange-500/20' },
  { id: 'sport', label: 'Sport', icon: Dumbbell, color: 'bg-red-500/10 text-red-500 border-red-500/20' },
  { id: 'bijoux', label: 'Bijoux', icon: Star, color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
  { id: 'bien-etre', label: 'Bien-être', icon: Heart, color: 'bg-rose-500/10 text-rose-500 border-rose-500/20' },
];

export const ALL_TASTE: TasteCategory = {
  id: 'tous',
  label: 'Tous',
  icon: Gift,
  color: '',
};

/**
 * Mapping de chaque goût vers les noms de catégories produit en base de données.
 */
export const TASTE_TO_PRODUCT_CATEGORIES: Record<string, string[]> = {
  'tech': ['Tech & Électronique', 'Loisirs & Divertissement'],
  'mode': ['Mode & Vêtements', 'Bijoux & Accessoires'],
  'voyage': ['Séjours & Hébergement', 'Expériences VIP'],
  'musique': ['Loisirs & Divertissement', 'Culture & Loisirs'],
  'gastronomie': ['Gastronomie & Délices', 'Restaurants & Gastronomie'],
  'sport': ['Loisirs & Divertissement'],
  'bijoux': ['Bijoux & Accessoires', 'Parfums & Beauté'],
  'bien-etre': ['Bien-être & Spa', 'Parfums & Beauté'],
};

/**
 * Vérifie si un produit (par son categoryName) correspond à un goût sélectionné.
 */
export function matchesTaste(categoryName: string | undefined | null, tasteId: string): boolean {
  if (tasteId === 'tous') return true;
  if (!categoryName) return false;
  const mapped = TASTE_TO_PRODUCT_CATEGORIES[tasteId];
  if (!mapped) return false;
  return mapped.some(cat => categoryName.toLowerCase().includes(cat.toLowerCase()));
}
