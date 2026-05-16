#!/usr/bin/env node
/**
 * Generates an optimized social-preview image at public/og-image.jpg
 * from a source file (default: public/og-image-source.png, fallback: public/og-image.png).
 *
 * Constraints:
 *  - Dimensions: 1200x630 (standard Open Graph ratio 1.91:1)
 *  - Format: JPEG (best ratio quality/size for WhatsApp)
 *  - Target size: < 300 KB (WhatsApp preview limit). Quality is auto-stepped down if needed.
 *  - Also writes a PNG fallback at public/og-image.png if it does not already exist.
 *
 * Run automatically via the `prebuild` npm script. Can also be invoked manually:
 *   node scripts/optimize-og-image.mjs
 */
import { existsSync, statSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const PUBLIC_DIR = resolve(ROOT, "public");

const SOURCE_CANDIDATES = [
  resolve(PUBLIC_DIR, "og-image-source.png"),
  resolve(PUBLIC_DIR, "og-image-source.jpg"),
  resolve(PUBLIC_DIR, "og-image.png"),
];
const TARGET_JPG = resolve(PUBLIC_DIR, "og-image.jpg");
const TARGET_PNG_FALLBACK = resolve(PUBLIC_DIR, "og-image.png");

const TARGET_WIDTH = 1200;
const TARGET_HEIGHT = 630;
const MAX_BYTES = 300 * 1024; // WhatsApp soft limit
const QUALITY_STEPS = [85, 82, 78, 74, 70, 65, 60, 55];

function findSource() {
  for (const candidate of SOURCE_CANDIDATES) {
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

function fmtBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

async function main() {
  const source = findSource();
  if (!source) {
    console.warn(
      `[og-image] No source image found at any of: ${SOURCE_CANDIDATES.join(", ")}. Skipping.`,
    );
    return;
  }

  console.log(`[og-image] Source: ${source} (${fmtBytes(statSync(source).size)})`);

  // Skip if up-to-date (target is newer than source and within size budget).
  if (existsSync(TARGET_JPG)) {
    const srcMtime = statSync(source).mtimeMs;
    const tgtStat = statSync(TARGET_JPG);
    if (tgtStat.mtimeMs >= srcMtime && tgtStat.size <= MAX_BYTES) {
      console.log(
        `[og-image] ${TARGET_JPG} is up-to-date (${fmtBytes(tgtStat.size)}). Skipping regeneration.`,
      );
      return;
    }
  }

  const base = sharp(source)
    .resize(TARGET_WIDTH, TARGET_HEIGHT, { fit: "cover", position: "center" });

  let finalBuffer = null;
  let finalQuality = null;
  for (const quality of QUALITY_STEPS) {
    const buffer = await base
      .clone()
      .jpeg({ quality, mozjpeg: true, progressive: true })
      .toBuffer();
    if (buffer.length <= MAX_BYTES) {
      finalBuffer = buffer;
      finalQuality = quality;
      break;
    }
  }

  if (!finalBuffer) {
    // Even the lowest quality exceeded budget — write the smallest attempt and warn.
    const lowest = QUALITY_STEPS[QUALITY_STEPS.length - 1];
    finalBuffer = await base
      .clone()
      .jpeg({ quality: lowest, mozjpeg: true, progressive: true })
      .toBuffer();
    finalQuality = lowest;
    console.warn(
      `[og-image] WARNING: could not get under ${fmtBytes(MAX_BYTES)} even at quality ${lowest}. ` +
        `Wrote ${fmtBytes(finalBuffer.length)} — consider simplifying the source image.`,
    );
  }

  await sharp(finalBuffer).toFile(TARGET_JPG);
  console.log(
    `[og-image] Wrote ${TARGET_JPG} (${TARGET_WIDTH}x${TARGET_HEIGHT}, q=${finalQuality}, ${fmtBytes(finalBuffer.length)})`,
  );

  // Optional PNG fallback — only generate if missing (don't overwrite an explicit user PNG).
  if (!existsSync(TARGET_PNG_FALLBACK) || source === TARGET_PNG_FALLBACK) {
    if (source !== TARGET_PNG_FALLBACK) {
      await sharp(source)
        .resize(TARGET_WIDTH, TARGET_HEIGHT, { fit: "cover", position: "center" })
        .png({ compressionLevel: 9, palette: true })
        .toFile(TARGET_PNG_FALLBACK);
      const pngSize = statSync(TARGET_PNG_FALLBACK).size;
      console.log(`[og-image] Wrote PNG fallback ${TARGET_PNG_FALLBACK} (${fmtBytes(pngSize)})`);
    }
  }
}

main().catch((err) => {
  console.error("[og-image] Failed:", err);
  process.exitCode = 1;
});