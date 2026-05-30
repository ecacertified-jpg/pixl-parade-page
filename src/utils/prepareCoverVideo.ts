import { compressVideo, formatBytes, type CompressionProgress } from "./videoCompressor";
import { trimVideo, type TrimProgress } from "./videoTrimmer";
import { getVideoMetadata } from "./videoValidation";

export interface PrepareProgress {
  stage: "analyzing" | "trimming" | "compressing" | "done";
  progress: number; // 0-100
  message: string;
}

export interface PrepareResult {
  file: File;
  originalSize: number;
  finalSize: number;
  originalDuration: number;
  finalDuration: number;
  trimmed: boolean;
  compressed: boolean;
}

const MAX_DURATION_SECONDS = 30;
const COMPRESS_THRESHOLD_BYTES = 25 * 1024 * 1024;
const HARD_MAX_SOURCE_BYTES = 300 * 1024 * 1024;

/**
 * Prepare a cover video for upload :
 *  - rejects sources > 300 MB,
 *  - trims the first 30s if the source is longer,
 *  - aggressively compresses if the resulting file is still > 25 MB.
 */
export async function prepareCoverVideoForUpload(
  file: File,
  onProgress?: (p: PrepareProgress) => void,
): Promise<PrepareResult> {
  if (file.size > HARD_MAX_SOURCE_BYTES) {
    throw new Error(`Vidéo source trop lourde (${formatBytes(file.size)}, max 300 Mo)`);
  }

  onProgress?.({ stage: "analyzing", progress: 5, message: "Analyse de la vidéo…" });
  const meta = await getVideoMetadata(file);
  const originalDuration = meta.duration || 0;
  const originalSize = file.size;

  let working = file;
  let trimmed = false;

  if (originalDuration > MAX_DURATION_SECONDS) {
    onProgress?.({
      stage: "trimming",
      progress: 15,
      message: `Découpe des ${MAX_DURATION_SECONDS} premières secondes…`,
    });
    const r = await trimVideo(file, 0, MAX_DURATION_SECONDS, (p: TrimProgress) => {
      onProgress?.({
        stage: "trimming",
        progress: 15 + Math.round(p.progress * 0.35),
        message: p.message,
      });
    });
    working = r.trimmedFile;
    trimmed = true;
  }

  let compressed = false;
  if (working.size > COMPRESS_THRESHOLD_BYTES) {
    onProgress?.({
      stage: "compressing",
      progress: 55,
      message: "Compression…",
    });
    const result = await compressVideo(
      working,
      (p: CompressionProgress) => {
        onProgress?.({
          stage: "compressing",
          progress: 55 + Math.round((p.progress / 100) * 40),
          message: p.message,
        });
      },
      { crf: 30, maxWidth: 1280, maxHeight: 720, preset: "fast", audioBitrate: "96k" },
    );
    working = result.compressedFile;
    compressed = true;
  }

  const finalMeta = trimmed || compressed ? await getVideoMetadata(working) : meta;

  onProgress?.({ stage: "done", progress: 100, message: "Prête à uploader" });

  return {
    file: working,
    originalSize,
    finalSize: working.size,
    originalDuration,
    finalDuration: finalMeta.duration || originalDuration,
    trimmed,
    compressed,
  };
}