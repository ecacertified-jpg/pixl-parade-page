import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

// Singleton FFmpeg instance
let ffmpeg: FFmpeg | null = null;
let isLoading = false;
let loadPromise: Promise<FFmpeg> | null = null;

// Compression configuration
const COMPRESSION_CONFIG = {
  targetBitrate: '1M',      // 1 Mbps for quality/size balance
  maxWidth: 1280,           // Max width
  maxHeight: 720,           // 720p max
  crf: 28,                  // Constant Rate Factor (quality)
  preset: 'medium',         // Compression speed
  audioBitrate: '128k',     // Audio quality
};

export interface CompressionProgress {
  stage: 'loading' | 'compressing' | 'done' | 'error';
  progress: number; // 0-100
  message: string;
}

export interface CompressionResult {
  compressedFile: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
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
 * Compress a video file
 */
export async function compressVideo(
  file: File,
  onProgress?: (progress: CompressionProgress) => void
): Promise<CompressionResult> {
  const originalSize = file.size;

  // Check browser support
  if (!isCompressionSupported()) {
    throw new Error('Votre navigateur ne supporte pas la compression vidéo. La vidéo sera uploadée sans compression.');
  }

  try {
    // Load FFmpeg
    const ffmpegInstance = await loadFFmpeg(onProgress);

    onProgress?.({
      stage: 'compressing',
      progress: 0,
      message: 'Préparation de la vidéo...',
    });

    // Set up progress tracking
    ffmpegInstance.on('progress', ({ progress }) => {
      const percent = Math.round(progress * 100);
      onProgress?.({
        stage: 'compressing',
        progress: percent,
        message: `Compression en cours... ${percent}%`,
      });
    });

    // Write input file to FFmpeg virtual filesystem
    const inputFileName = 'input' + getFileExtension(file.name);
    const outputFileName = 'output.mp4';
    
    await ffmpegInstance.writeFile(inputFileName, await fetchFile(file));

    onProgress?.({
      stage: 'compressing',
      progress: 10,
      message: 'Compression en cours...',
    });

    // Run compression with H.264/AAC
    await ffmpegInstance.exec([
      '-i', inputFileName,
      // Video codec
      '-c:v', 'libx264',
      '-preset', COMPRESSION_CONFIG.preset,
      '-crf', COMPRESSION_CONFIG.crf.toString(),
      // Scale to max 720p while maintaining aspect ratio
      '-vf', `scale='min(${COMPRESSION_CONFIG.maxWidth},iw)':'min(${COMPRESSION_CONFIG.maxHeight},ih)':force_original_aspect_ratio=decrease`,
      // Audio codec
      '-c:a', 'aac',
      '-b:a', COMPRESSION_CONFIG.audioBitrate,
      // Output settings
      '-movflags', '+faststart',
      '-y',
      outputFileName,
    ]);

    onProgress?.({
      stage: 'compressing',
      progress: 95,
      message: 'Finalisation...',
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

    onProgress?.({
      stage: 'done',
      progress: 100,
      message: `Compression terminée ! ${formatBytes(originalSize)} → ${formatBytes(compressedSize)} (-${Math.round(compressionRatio * 100)}%)`,
    });

    return {
      compressedFile,
      originalSize,
      compressedSize,
      compressionRatio,
    };
  } catch (error) {
    onProgress?.({
      stage: 'error',
      progress: 0,
      message: 'Erreur lors de la compression',
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
