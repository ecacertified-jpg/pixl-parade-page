/**
 * Shared font loader for OG image generation.
 * Uses .ttf format which is compatible with og_edge/satori (woff2 is NOT supported).
 */

// Poppins Bold TTF - compatible with satori/og_edge
const POPPINS_BOLD_TTF_URL =
  "https://github.com/google/fonts/raw/main/ofl/poppins/Poppins-Bold.ttf";

let cachedFont: ArrayBuffer | null = null;

/**
 * Load Poppins Bold font as ArrayBuffer (.ttf format).
 * Returns null if loading fails — caller should render without custom font.
 */
export async function loadPoppinsFont(): Promise<ArrayBuffer | null> {
  if (cachedFont && cachedFont.byteLength > 0) {
    return cachedFont;
  }

  try {
    const res = await fetch(POPPINS_BOLD_TTF_URL);
    if (!res.ok) {
      console.error("Font fetch failed:", res.status, res.statusText);
      return null;
    }
    cachedFont = await res.arrayBuffer();
    if (!cachedFont || cachedFont.byteLength === 0) {
      console.error("Font fetch returned empty buffer");
      return null;
    }
    return cachedFont;
  } catch (err) {
    console.error("Error loading font:", err);
    return null;
  }
}

/**
 * Build the fonts array for ImageResponse options.
 * Returns an empty array if font loading failed (graceful fallback).
 */
export async function getPoppinsFontConfig() {
  const fontData = await loadPoppinsFont();
  if (!fontData) return [];
  return [
    {
      name: "Poppins",
      data: fontData,
      style: "normal" as const,
      weight: 700 as const,
    },
  ];
}
