import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

// Singleton FFmpeg instance
let ffmpeg: FFmpeg | null = null;
let isLoading = false;
let loadPromise: Promise<FFmpeg> | null = null;

// Abort controller for cancellation
let currentAbortController: AbortController | null = null;

export interface CompressionConfig {
  crf: number;
  maxWidth: number;
  maxHeight: number;
  preset: 'fast' | 'medium' | 'slow';
  audioBitrate?: string;
}

// Default compression configuration
const DEFAULT_CONFIG: CompressionConfig = {
  crf: 28,
  maxWidth: 1280,
  maxHeight: 720,
  preset: 'medium',
  audioBitrate: '128k',
};

export interface CompressionProgress {
  stage: 'loading' | 'compressing' | 'done' | 'error';
  progress: number; // 0-100
  message: string;
  estimatedTimeRemaining?: number; // in seconds
  elapsedTime?: number; // in seconds
  processedBytes?: number;
  totalBytes?: number;
}

export interface CompressionResult {
  compressedFile: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  duration: number; // compression duration in seconds
  resolution?: { width: number; height: number };
}

export interface TimeEstimation {
  minSeconds: number;
  maxSeconds: number;
  formatted: string;
}

/**
 * Estimate compression time based on file size
 * Base estimation: ~2-5 seconds per MB depending on complexity
 */
export function estimateCompressionTime(fileSize: number): TimeEstimation {
  const fileSizeMB = fileSize / (1024 * 1024);
  
  // Faster estimation for smaller files, slower for larger
  const minSecondsPerMB = 2;
  const maxSecondsPerMB = 5;
  
  const minSeconds = Math.max(10, Math.round(fileSizeMB * minSecondsPerMB));
  const maxSeconds = Math.max(20, Math.round(fileSizeMB * maxSecondsPerMB));
  
  // Format the time range
  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${mins}min ${secs}s` : `${mins}min`;
  };
  
  const formatted = minSeconds === maxSeconds
    ? formatTime(minSeconds)
    : `${formatTime(minSeconds)} - ${formatTime(maxSeconds)}`;
  
  return { minSeconds, maxSeconds, formatted };
}

/**
 * Check if SharedArrayBuffer is available (required for FFmpeg.wasm)
 */
export function isCompressionSupported(): boolean {
  try {
    return typeof SharedArrayBuffer !== 'undefined';
  } catch {
    return false;
  }
}

/**
 * Load FFmpeg.wasm (lazy loading with caching)
 */
export async function loadFFmpeg(
  onProgress?: (progress: CompressionProgress) => void
): Promise<FFmpeg> {
  // Return existing instance if available
  if (ffmpeg && ffmpeg.loaded) {
    return ffmpeg;
  }

  // Wait for ongoing load
  if (isLoading && loadPromise) {
    return loadPromise;
  }

  isLoading = true;
  
  loadPromise = (async () => {
    try {
      onProgress?.({
        stage: 'loading',
        progress: 0,
        message: 'Chargement du moteur de compression...',
      });

      ffmpeg = new FFmpeg();

      // Load FFmpeg core from CDN
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
      
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });

      onProgress?.({
        stage: 'loading',
        progress: 100,
        message: 'Moteur de compression prêt !',
      });

      return ffmpeg;
    } catch (error) {
      isLoading = false;
      loadPromise = null;
      throw error;
    }
  })();

  const result = await loadPromise;
  isLoading = false;
  return result;
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Format duration in seconds to human readable string
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return secs > 0 ? `${mins}min ${secs}s` : `${mins}min`;
}

/**
 * Check if compression is needed for the file
 */
export function shouldCompress(file: File): boolean {
  // Compress if larger than 10MB
  if (file.size > 10 * 1024 * 1024) {
    return true;
  }
  
  // Compress if not an optimized MP4
  if (file.type !== 'video/mp4') {
    return true;
  }
  
  return false;
}

/**
 * Cancel ongoing compression
 */
export function cancelCompression(): boolean {
  if (currentAbortController) {
    currentAbortController.abort();
    currentAbortController = null;
    return true;
  }
  return false;
}

/**
 * Check if compression is currently in progress
 */
export function isCompressionInProgress(): boolean {
  return currentAbortController !== null;
}

/**
 * Compress a video file with configurable settings
 */
export async function compressVideo(
  file: File,
  onProgress?: (progress: CompressionProgress) => void,
  config?: Partial<CompressionConfig>,
  abortSignal?: AbortSignal
): Promise<CompressionResult> {
  const originalSize = file.size;
  const startTime = Date.now();
  
  // Merge with default config
  const finalConfig: CompressionConfig = { ...DEFAULT_CONFIG, ...config };
  
  // Set up abort controller
  currentAbortController = new AbortController();
  const internalSignal = currentAbortController.signal;
  
  // Link external abort signal if provided
  if (abortSignal) {
    abortSignal.addEventListener('abort', () => {
      currentAbortController?.abort();
    });
  }

  // Check browser support
  if (!isCompressionSupported()) {
    currentAbortController = null;
    throw new Error('Votre navigateur ne supporte pas la compression vidéo. La vidéo sera uploadée sans compression.');
  }

  try {
    // Check if aborted before starting
    if (internalSignal.aborted) {
      throw new Error('Compression annulée');
    }

    // Load FFmpeg
    const ffmpegInstance = await loadFFmpeg(onProgress);

    if (internalSignal.aborted) {
      throw new Error('Compression annulée');
    }

    const estimation = estimateCompressionTime(file.size);
    let lastProgressUpdate = Date.now();

    onProgress?.({
      stage: 'compressing',
      progress: 0,
      message: 'Préparation de la vidéo...',
      estimatedTimeRemaining: estimation.maxSeconds,
      elapsedTime: 0,
      totalBytes: originalSize,
      processedBytes: 0,
    });

    // Set up progress tracking
    ffmpegInstance.on('progress', ({ progress }) => {
      if (internalSignal.aborted) return;
      
      const percent = Math.round(progress * 100);
      const elapsedTime = (Date.now() - startTime) / 1000;
      
      // Estimate remaining time based on progress
      let estimatedRemaining: number | undefined;
      if (percent > 5) {
        const totalEstimated = elapsedTime / (percent / 100);
        estimatedRemaining = Math.max(0, totalEstimated - elapsedTime);
      }
      
      // Throttle progress updates to avoid too many re-renders
      const now = Date.now();
      if (now - lastProgressUpdate > 200 || percent >= 100) {
        lastProgressUpdate = now;
        
        onProgress?.({
          stage: 'compressing',
          progress: percent,
          message: `Compression en cours... ${percent}%`,
          estimatedTimeRemaining: estimatedRemaining,
          elapsedTime,
          totalBytes: originalSize,
          processedBytes: Math.round(originalSize * (percent / 100)),
        });
      }
    });

    // Write input file to FFmpeg virtual filesystem
    const inputFileName = 'input' + getFileExtension(file.name);
    const outputFileName = 'output.mp4';
    
    await ffmpegInstance.writeFile(inputFileName, await fetchFile(file));

    if (internalSignal.aborted) {
      await ffmpegInstance.deleteFile(inputFileName);
      throw new Error('Compression annulée');
    }

    onProgress?.({
      stage: 'compressing',
      progress: 10,
      message: 'Compression en cours...',
      elapsedTime: (Date.now() - startTime) / 1000,
      totalBytes: originalSize,
    });

    // Run compression with configurable settings
    await ffmpegInstance.exec([
      '-i', inputFileName,
      // Video codec
      '-c:v', 'libx264',
      '-preset', finalConfig.preset,
      '-crf', finalConfig.crf.toString(),
      // Scale to max resolution while maintaining aspect ratio
      '-vf', `scale='min(${finalConfig.maxWidth},iw)':'min(${finalConfig.maxHeight},ih)':force_original_aspect_ratio=decrease`,
      // Audio codec
      '-c:a', 'aac',
      '-b:a', finalConfig.audioBitrate || '128k',
      // Output settings
      '-movflags', '+faststart',
      '-y',
      outputFileName,
    ]);

    if (internalSignal.aborted) {
      await ffmpegInstance.deleteFile(inputFileName);
      try {
        await ffmpegInstance.deleteFile(outputFileName);
      } catch {}
      throw new Error('Compression annulée');
    }

    const elapsedTime = (Date.now() - startTime) / 1000;

    onProgress?.({
      stage: 'compressing',
      progress: 95,
      message: 'Finalisation...',
      elapsedTime,
    });

    // Read compressed file
    const data = await ffmpegInstance.readFile(outputFileName);
    // Handle FFmpeg output - could be Uint8Array or string
    let compressedBlob: Blob;
    if (typeof data === 'string') {
      // If it's a string (shouldn't happen for binary output), convert it
      const encoder = new TextEncoder();
      compressedBlob = new Blob([encoder.encode(data)], { type: 'video/mp4' });
    } else {
      // It's a Uint8Array - create a new ArrayBuffer copy to avoid SharedArrayBuffer issues
      const buffer = new ArrayBuffer(data.length);
      const view = new Uint8Array(buffer);
      view.set(data);
      compressedBlob = new Blob([buffer], { type: 'video/mp4' });
    }
    const compressedSize = compressedBlob.size;

    // Clean up
    await ffmpegInstance.deleteFile(inputFileName);
    await ffmpegInstance.deleteFile(outputFileName);

    // Create compressed file
    const compressedFile = new File(
      [compressedBlob],
      file.name.replace(/\.[^.]+$/, '.mp4'),
      { type: 'video/mp4' }
    );

    const compressionRatio = 1 - (compressedSize / originalSize);
    const duration = (Date.now() - startTime) / 1000;

    onProgress?.({
      stage: 'done',
      progress: 100,
      message: `Compression terminée ! ${formatBytes(originalSize)} → ${formatBytes(compressedSize)} (-${Math.round(compressionRatio * 100)}%)`,
      elapsedTime: duration,
    });

    currentAbortController = null;

    return {
      compressedFile,
      originalSize,
      compressedSize,
      compressionRatio,
      duration,
      resolution: { width: finalConfig.maxWidth, height: finalConfig.maxHeight },
    };
  } catch (error) {
    currentAbortController = null;
    
    const isAborted = error instanceof Error && error.message === 'Compression annulée';
    
    onProgress?.({
      stage: 'error',
      progress: 0,
      message: isAborted ? 'Compression annulée' : 'Erreur lors de la compression',
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
