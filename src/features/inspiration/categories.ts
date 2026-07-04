export type InspirationCategory = "divertissement" | "astuces" | "conseils" | "formations";
export type InspirationMediaType = "video" | "image" | "text";

export const INSPIRATION_CATEGORIES: {
  key: InspirationCategory;
  label: string;
  subcategories: { key: string; label: string }[];
}[] = [
  {
    key: "divertissement",
    label: "Divertissement",
    subcategories: [
      { key: "films", label: "Films" },
      { key: "musique", label: "Musique" },
      { key: "spectacles", label: "Spectacles" },
      { key: "people", label: "People" },
    ],
  },
  {
    key: "astuces",
    label: "Astuces",
    subcategories: [
      { key: "beaute", label: "Beauté" },
      { key: "cuisine", label: "Cuisine" },
      { key: "autres", label: "Autres" },
    ],
  },
  {
    key: "conseils",
    label: "Conseils",
    subcategories: [
      { key: "bien-etre", label: "Bien-être" },
      { key: "sante", label: "Santé" },
      { key: "business", label: "Business" },
      { key: "motivation", label: "Motivation" },
    ],
  },
  {
    key: "formations",
    label: "Formations & apprentissage",
    subcategories: [
      { key: "diplome", label: "Diplôme" },
      { key: "certification", label: "Certification" },
      { key: "autres", label: "Autres" },
    ],
  },
];

export function findCategoryLabel(key: string): string {
  return INSPIRATION_CATEGORIES.find((c) => c.key === key)?.label ?? key;
}

export function findSubcategoryLabel(cat: string, sub: string): string {
  const c = INSPIRATION_CATEGORIES.find((c) => c.key === cat);
  return c?.subcategories.find((s) => s.key === sub)?.label ?? sub;
}