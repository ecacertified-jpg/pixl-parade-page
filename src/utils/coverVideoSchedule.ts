/**
 * Helpers for the birthday cover-video carousel.
 * Schedule kinds drive which video is shown depending on the visitor's local time
 * and the calendar date.
 */

export type CoverVideoScheduleKind =
  | "greeting_morning"
  | "greeting_afternoon"
  | "greeting_evening"
  | "greeting_night"
  | "calendar_event"
  | "birthday_day";

export interface CoverVideoItem {
  id: string;
  video_url: string;
  poster_url: string | null;
  schedule_kind: CoverVideoScheduleKind;
  calendar_month?: number | null;
  calendar_day?: number | null;
  priority?: number | null;
  display_order?: number | null;
  title?: string | null;
  source: "user" | "library";
}

export function currentGreetingKind(now = new Date()): CoverVideoScheduleKind {
  const h = now.getHours();
  if (h >= 5 && h < 12) return "greeting_morning";
  if (h >= 12 && h < 18) return "greeting_afternoon";
  if (h >= 18 && h < 22) return "greeting_evening";
  return "greeting_night";
}

export function isBirthdayToday(birthday: string | null, now = new Date()): boolean {
  if (!birthday) return false;
  const [, mm, dd] = birthday.split("-").map((v) => parseInt(v, 10));
  return now.getMonth() + 1 === mm && now.getDate() === dd;
}

/**
 * Match a calendar event around today (±1 day window so eves/days-after also count).
 */
export function isCalendarEventActive(
  month: number | null | undefined,
  day: number | null | undefined,
  now = new Date(),
): boolean {
  if (!month || !day) return false;
  const target = new Date(now.getFullYear(), month - 1, day);
  const diffDays = Math.abs((target.getTime() - now.getTime()) / 86_400_000);
  return diffDays <= 1;
}

export const SCHEDULE_KIND_LABELS: Record<CoverVideoScheduleKind, string> = {
  greeting_morning: "Bonjour (matin)",
  greeting_afternoon: "Bon après-midi",
  greeting_evening: "Bonsoir",
  greeting_night: "Bonne nuit",
  calendar_event: "Fête calendaire",
  birthday_day: "Jour de l'anniversaire",
};

/**
 * Build the visitor's playlist from user-uploaded + library videos.
 * Priority: birthday_day > calendar_event (matching today) > current greeting.
 * User videos shadow library videos for the same schedule_kind.
 */
export function buildPlaylist(
  userVideos: CoverVideoItem[],
  libraryVideos: CoverVideoItem[],
  birthday: string | null,
  now = new Date(),
): CoverVideoItem[] {
  const sortFn = (a: CoverVideoItem, b: CoverVideoItem) =>
    (a.display_order ?? a.priority ?? 0) - (b.display_order ?? b.priority ?? 0);

  const pickFor = (kind: CoverVideoScheduleKind, filter?: (v: CoverVideoItem) => boolean): CoverVideoItem[] => {
    const userPick = userVideos
      .filter((v) => v.schedule_kind === kind && (!filter || filter(v)))
      .sort(sortFn);
    if (userPick.length) return userPick;
    return libraryVideos
      .filter((v) => v.schedule_kind === kind && (!filter || filter(v)))
      .sort(sortFn);
  };

  const result: CoverVideoItem[] = [];

  if (isBirthdayToday(birthday, now)) {
    result.push(...pickFor("birthday_day"));
  }

  result.push(
    ...pickFor("calendar_event", (v) => isCalendarEventActive(v.calendar_month, v.calendar_day, now)),
  );

  result.push(...pickFor(currentGreetingKind(now)));

  // Deduplicate by id
  const seen = new Set<string>();
  return result.filter((v) => (seen.has(v.id) ? false : (seen.add(v.id), true)));
}