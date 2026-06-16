export interface DigitalGift {
  key: string;
  label: string;
  emoji: string;
  amount_xof: number;
  isPremium: boolean;
  animation: "float" | "burst" | "rain";
}

export const DIGITAL_GIFTS: DigitalGift[] = [
  { key: "heart", label: "Cœur", emoji: "💖", amount_xof: 0, isPremium: false, animation: "float" },
  { key: "kiss", label: "Bisou", emoji: "😘", amount_xof: 0, isPremium: false, animation: "float" },
  { key: "flower", label: "Fleur", emoji: "🌸", amount_xof: 0, isPremium: false, animation: "rain" },
  { key: "confetti", label: "Confetti", emoji: "🎉", amount_xof: 0, isPremium: false, animation: "burst" },
  { key: "rose", label: "Rose", emoji: "🌹", amount_xof: 500, isPremium: true, animation: "rain" },
  { key: "crown", label: "Couronne", emoji: "👑", amount_xof: 1000, isPremium: true, animation: "burst" },
  { key: "diamond", label: "Diamant", emoji: "💎", amount_xof: 2000, isPremium: true, animation: "burst" },
  { key: "bouquet", label: "Bouquet", emoji: "💐", amount_xof: 3000, isPremium: true, animation: "rain" },
];

export function getGift(key: string): DigitalGift | undefined {
  return DIGITAL_GIFTS.find((g) => g.key === key);
}