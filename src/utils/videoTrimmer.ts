import { loadFFmpeg, formatBytes, CompressionProgress } from './videoCompressor';

export interface TrimProgress {
  stage: 'loading' | 'trimming' | 'done' | 'error';
  progress: number; // 0-100
  message: string;
}

export interface TrimResult {
  trimmedFile: File;
  originalDuration: number;
  trimmedDuration: number;
  originalSize: number;
  trimmedSize: number;
}

/**
 * Format seconds to HH:MM:SS.mmm for FFmpeg
 */
export function formatTimeForFFmpeg(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toFixed(3).padStart(6, '0')}`;
}

/**
 * Format seconds to user-friendly MM:SS format
 */
export function formatTimeDisplay(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Trim a video file using FFmpeg.wasm
 */
export async function trimVideo(
  file: File,
  startTime: number,
  endTime: number,
  onProgress?: (progress: TrimProgress) => void
): Promise<TrimResult> {
  const originalSize = file.size;
  const originalDuration = endTime - startTime; // This is actually the new duration
  
  try {
    // Load FFmpeg
    onProgress?.({
      stage: 'loading',
      progress: 0,
      message: 'Chargement du moteur de traitement...',
    });
    
    const ffmpegInstance = await loadFFmpeg((p: CompressionProgress) => {
      if (p.stage === 'loading') {
        onProgress?.({
          stage: 'loading',
          progress: p.progress,
          message: p.message,
        });
      }
    });

    onProgress?.({
      stage: 'trimming',
      progress: 0,
      message: 'Préparation de la découpe...',
    });

    // Set up progress tracking
    ffmpegInstance.on('progress', ({ progress }) => {
      const percent = Math.round(progress * 100);
      onProgress?.({
        stage: 'trimming',
        progress: percent,
        message: `Découpe en cours... ${percent}%`,
      });
    });

    // Write input file to FFmpeg virtual filesystem
    const inputFileName = 'input_trim' + getFileExtension(file.name);
    const outputFileName = 'output_trimmed.mp4';
    
    const { fetchFile } = await import('@ffmpeg/util');
    await ffmpegInstance.writeFile(inputFileName, await fetchFile(file));

    onProgress?.({
      stage: 'trimming',
      progress: 10,
      message: 'Découpe en cours...',
    });

    // Run trimming with re-encoding for accuracy
    await ffmpegInstance.exec([
      '-i', inputFileName,
      '-ss', formatTimeForFFmpeg(startTime),
      '-to', formatTimeForFFmpeg(endTime),
      '-c:v', 'libx264',
      '-preset', 'fast',
      '-crf', '23',
      '-c:a', 'aac',
      '-b:a', '128k',
      '-movflags', '+faststart',
      '-y',
      outputFileName,
    ]);

    onProgress?.({
      stage: 'trimming',
      progress: 95,
      message: 'Finalisation...',
    });

    // Read trimmed file
    const data = await ffmpegInstance.readFile(outputFileName);
    
    // Handle FFmpeg output - could be Uint8Array or string
    let trimmedBlob: Blob;
    if (typeof data === 'string') {
      const encoder = new TextEncoder();
      trimmedBlob = new Blob([encoder.encode(data)], { type: 'video/mp4' });
    } else {
      // Create a new ArrayBuffer copy to avoid SharedArrayBuffer issues
      const buffer = new ArrayBuffer(data.length);
      const view = new Uint8Array(buffer);
      view.set(data);
      trimmedBlob = new Blob([buffer], { type: 'video/mp4' });
    }
    
    const trimmedSize = trimmedBlob.size;

    // Clean up
    await ffmpegInstance.deleteFile(inputFileName);
    await ffmpegInstance.deleteFile(outputFileName);

    // Create trimmed file
    const trimmedFile = new File(
      [trimmedBlob],
      file.name.replace(/\.[^.]+$/, '_trimmed.mp4'),
      { type: 'video/mp4' }
    );

    const trimmedDuration = endTime - startTime;

    onProgress?.({
      stage: 'done',
      progress: 100,
      message: `Découpe terminée ! Durée : ${formatTimeDisplay(trimmedDuration)}`,
    });

    return {
      trimmedFile,
      originalDuration: 0, // Will be set by caller with actual original duration
      trimmedDuration,
      originalSize,
      trimmedSize,
    };
  } catch (error) {
    onProgress?.({
      stage: 'error',
      progress: 0,
      message: 'Erreur lors de la découpe',
    });
    throw error;
  }
}

/**
 * Get file extension from filename
 */
function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  if (parts.length > 1) {
    return '.' + parts[parts.length - 1].toLowerCase();
  }
  return '.mp4';
}
