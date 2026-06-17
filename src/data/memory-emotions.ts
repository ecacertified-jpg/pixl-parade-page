export type MemoryEmotion = 'joie' | 'amour' | 'famille' | 'fierte' | 'gratitude' | 'nostalgie';

export const EMOTION_META: Record<MemoryEmotion, { label: string; emoji: string; color: string }> = {
  joie: { label: 'Joie', emoji: '🎉', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200' },
  amour: { label: 'Amour', emoji: '💞', color: 'bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-200' },
  famille: { label: 'Famille', emoji: '👨‍👩‍👧', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200' },
  fierte: { label: 'Fierté', emoji: '🏆', color: 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200' },
  gratitude: { label: 'Gratitude', emoji: '🙏', color: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200' },
  nostalgie: { label: 'Nostalgie', emoji: '🌅', color: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200' },
};

const OCCASION_TO_EMOTION: Record<string, MemoryEmotion> = {
  birthday: 'joie',
  anniversary: 'joie',
  wedding: 'amour',
  mariage: 'amour',
  engagement: 'amour',
  baptism: 'famille',
  bapteme: 'famille',
  baby_shower: 'famille',
  baby: 'famille',
  graduation: 'fierte',
  promotion: 'fierte',
  achievement: 'fierte',
  memorial: 'gratitude',
  thanks: 'gratitude',
  retirement: 'nostalgie',
};

export function emotionForOccasion(occasion?: string | null): MemoryEmotion {
  if (!occasion) return 'joie';
  const key = occasion.toLowerCase().trim();
  return OCCASION_TO_EMOTION[key] ?? 'joie';
}