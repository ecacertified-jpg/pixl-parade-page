import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCompactNumber(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${Math.floor(value / 1000)}K`;
  }
  return value.toString();
}

export function isValidImageUrl(url: string | null | undefined): boolean {
  return !!(url && url.trim() !== '' && (url.startsWith('http') || url.startsWith('/') || url.startsWith('data:')));
}

export function getDaysUntilBirthday(birthdayStr: string | Date | null | undefined): number {
  if (!birthdayStr) return 0;

  let month: number, day: number;
  if (typeof birthdayStr === 'string') {
    const parts = birthdayStr.split('-');
    month = parseInt(parts[1], 10) - 1;
    day = parseInt(parts[2], 10);
  } else {
    month = birthdayStr.getMonth();
    day = birthdayStr.getDate();
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const nextBirthday = new Date(today.getFullYear(), month, day);
  nextBirthday.setHours(0, 0, 0, 0);

  if (nextBirthday < today) {
    nextBirthday.setFullYear(today.getFullYear() + 1);
  }

  return Math.round((nextBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}
