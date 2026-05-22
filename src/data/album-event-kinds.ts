/**
 * Catalogue des événements rattachables à un média d'album anniversaire.
 * `parent` regroupe les sous-types dans la grille (Mariage, Réussite, ...).
 */

export type AlbumEventKind =
  | "anniversaire"
  | "mariage_traditionnel"
  | "mariage_religieux"
  | "mariage_civil"
  | "reussite_academique"
  | "reussite_scolaire"
  | "promotion_pro";

export interface AlbumEventKindDef {
  key: AlbumEventKind;
  label: string;
  parent: string; // group label
  emoji: string;
}

export const ALBUM_EVENT_KINDS: AlbumEventKindDef[] = [
  { key: "anniversaire", label: "Anniversaire", parent: "Anniversaire", emoji: "🎂" },
  { key: "mariage_traditionnel", label: "Mariage traditionnel", parent: "Mariage", emoji: "💍" },
  { key: "mariage_religieux", label: "Mariage religieux", parent: "Mariage", emoji: "⛪" },
  { key: "mariage_civil", label: "Mariage civil", parent: "Mariage", emoji: "📜" },
  { key: "reussite_academique", label: "Réussite académique", parent: "Réussite", emoji: "🎓" },
  { key: "reussite_scolaire", label: "Réussite scolaire", parent: "Réussite", emoji: "📚" },
  { key: "promotion_pro", label: "Promotion professionnelle", parent: "Promotion", emoji: "🏆" },
];

export const ALBUM_EVENT_KIND_MAP: Record<AlbumEventKind, AlbumEventKindDef> =
  ALBUM_EVENT_KINDS.reduce(
    (acc, k) => {
      acc[k.key] = k;
      return acc;
    },
    {} as Record<AlbumEventKind, AlbumEventKindDef>,
  );

export function getEventLabel(kind: string | null | undefined): string {
  if (!kind) return "Non classé";
  return ALBUM_EVENT_KIND_MAP[kind as AlbumEventKind]?.label ?? kind;
}

export function getEventEmoji(kind: string | null | undefined): string {
  if (!kind) return "📁";
  return ALBUM_EVENT_KIND_MAP[kind as AlbumEventKind]?.emoji ?? "📁";
}