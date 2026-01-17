import { useState, useRef, useEffect } from 'react';
import { Upload, X, Video, Image, Play, Loader2, Link2, CheckCircle2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  getVideoSource, 
  isValidVideoUrl, 
  getVideoThumbnail,
  getVideoPlatformInfo,
  extractYouTubeId,
  extractVimeoId
} from '@/utils/videoHelpers';
import { 
  shouldCompress, 
  compressVideo, 
  isCompressionSupported,
  formatBytes,
  CompressionProgress 
} from '@/utils/videoCompressor';
import { VideoCompressionProgress } from '@/components/VideoCompressionProgress';
import { 
  getVideoMetadata, 
  validateVideoDuration, 
  formatDuration,
  VIDEO_VALIDATION_CONFIG 
} from '@/utils/videoValidation';

interface VideoUploaderProps {
  videoUrl: string | null;
  thumbnailUrl: string | null;
  onVideoChange: (videoUrl: string | null) => void;
  onThumbnailChange: (thumbnailUrl: string | null) => void;
  disabled?: boolean;
}

const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50 MB
const MAX_THUMBNAIL_SIZE = 5 * 1024 * 1024; // 5 MB
const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'];
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function VideoUploader({
  videoUrl,
  thumbnailUrl,
  onVideoChange,
  onThumbnailChange,
  disabled = false,
}: VideoUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('upload');
  const [externalUrl, setExternalUrl] = useState('');
  const [isValidatingUrl, setIsValidatingUrl] = useState(false);
  const [urlValidation, setUrlValidation] = useState<{ valid: boolean; platform?: string } | null>(null);
  const [autoThumbnail, setAutoThumbnail] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState<CompressionProgress | null>(null);
  const [originalFileSize, setOriginalFileSize] = useState<number | null>(null);
  const [validatingDuration, setValidatingDuration] = useState(false);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  // Determine current video source type
  const currentSource = videoUrl ? getVideoSource(videoUrl) : null;
  const isExternalVideo = currentSource === 'youtube' || currentSource === 'vimeo';

  // Validate external URL when it changes
  useEffect(() => {
    if (!externalUrl) {
      setUrlValidation(null);
      setAutoThumbnail(null);
      return;
    }

    const validateUrl = async () => {
      setIsValidatingUrl(true);
      
      const source = getVideoSource(externalUrl);
      const isValid = isValidVideoUrl(externalUrl);
      
      if (isValid && (source === 'youtube' || source === 'vimeo')) {
        const platformInfo = getVideoPlatformInfo(externalUrl);
        setUrlValidation({ valid: true, platform: platformInfo.name });
        
        // Fetch auto thumbnail
        const thumbnail = await getVideoThumbnail(externalUrl);
        setAutoThumbnail(thumbnail);
      } else if (externalUrl.length > 10) {
        setUrlValidation({ valid: false });
        setAutoThumbnail(null);
      } else {
        setUrlValidation(null);
        setAutoThumbnail(null);
      }
      
      setIsValidatingUrl(false);
    };

    const debounce = setTimeout(validateUrl, 500);
    return () => clearTimeout(debounce);
  }, [externalUrl]);

  const handleVideoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_VIDEO_TYPES.includes(file.type)) {
      toast.error('Format non supporté. Utilisez MP4, MOV ou WebM.');
      return;
    }

    if (file.size > MAX_VIDEO_SIZE) {
      toast.error('La vidéo ne doit pas dépasser 50 MB.');
      return;
    }

    // Validate video duration
    setValidatingDuration(true);
    try {
      const metadata = await getVideoMetadata(file);
      
      if (!metadata.isValid) {
        toast.error(metadata.error || 'Impossible de lire la vidéo.');
        setValidatingDuration(false);
        return;
      }
      
      const durationCheck = validateVideoDuration(metadata.duration);
      if (!durationCheck.valid) {
        toast.error(
          `Vidéo trop longue (${formatDuration(metadata.duration)}). Maximum : ${VIDEO_VALIDATION_CONFIG.maxDurationFormatted}.`,
          { duration: 5000 }
        );
        setValidatingDuration(false);
        return;
      }
    } catch (error) {
      console.warn('Duration validation failed:', error);
      // Continue anyway as fallback
    } finally {
      setValidatingDuration(false);
    }

    let fileToUpload = file;
    setOriginalFileSize(file.size);

    // Compression if needed and supported
    if (shouldCompress(file) && isCompressionSupported()) {
      setIsCompressing(true);
      setCompressionProgress({
        stage: 'loading',
        progress: 0,
        message: 'Chargement du moteur de compression...',
      });

      try {
        const result = await compressVideo(file, setCompressionProgress);
        fileToUpload = result.compressedFile;
        toast.success(
          `Vidéo compressée : ${formatBytes(result.originalSize)} → ${formatBytes(result.compressedSize)} (-${Math.round(result.compressionRatio * 100)}%)`
        );
      } catch (error) {
        console.warn('Compression failed, uploading original:', error);
        toast.info('Compression impossible, upload du fichier original...');
        // Fallback: upload original file
      }
      setIsCompressing(false);
      setCompressionProgress(null);
    } else if (shouldCompress(file) && !isCompressionSupported()) {
      toast.info('Compression non disponible dans ce navigateur. Upload direct.');
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const fileExt = fileToUpload.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `videos/${fileName}`;

      // Simulate progress (Supabase doesn't provide real upload progress)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const { data, error } = await supabase.storage
        .from('product-videos')
        .upload(filePath, fileToUpload, {
          cacheControl: '3600',
          upsert: false,
        });

      clearInterval(progressInterval);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('product-videos')
        .getPublicUrl(data.path);

      setUploadProgress(100);
      onVideoChange(urlData.publicUrl);
      toast.success('Vidéo uploadée avec succès !');

      // Auto-generate thumbnail if none exists
      if (!thumbnailUrl) {
        generateThumbnailFromVideo(urlData.publicUrl);
      }
    } catch (error) {
      console.error('Error uploading video:', error);
      toast.error("Erreur lors de l'upload de la vidéo.");
    } finally {
      setUploading(false);
      setUploadProgress(0);
      setOriginalFileSize(null);
      if (videoInputRef.current) {
        videoInputRef.current.value = '';
      }
    }
  };

  const handleExternalUrlSubmit = () => {
    if (!urlValidation?.valid) {
      toast.error('URL invalide. Utilisez une URL YouTube ou Vimeo.');
      return;
    }

    onVideoChange(externalUrl);
    
    // Use auto-generated thumbnail if available and no custom thumbnail
    if (autoThumbnail && !thumbnailUrl) {
      onThumbnailChange(autoThumbnail);
    }
    
    toast.success(`Vidéo ${urlValidation.platform} ajoutée !`);
    setExternalUrl('');
    setUrlValidation(null);
    setAutoThumbnail(null);
  };

  const generateThumbnailFromVideo = (url: string) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.src = url;
    video.muted = true;
    video.currentTime = 1; // Capture at 1 second

    video.onloadeddata = () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(async (blob) => {
          if (blob) {
            await uploadThumbnailBlob(blob);
          }
        }, 'image/jpeg', 0.8);
      }
    };
  };

  const uploadThumbnailBlob = async (blob: Blob) => {
    setUploadingThumbnail(true);
    try {
      const fileName = `thumbnails/${crypto.randomUUID()}.jpg`;
      
      const { data, error } = await supabase.storage
        .from('product-videos')
        .upload(fileName, blob, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'image/jpeg',
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('product-videos')
        .getPublicUrl(data.path);

      onThumbnailChange(urlData.publicUrl);
    } catch (error) {
      console.error('Error uploading thumbnail:', error);
    } finally {
      setUploadingThumbnail(false);
    }
  };

  const handleThumbnailSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast.error('Format non supporté. Utilisez JPG, PNG ou WebP.');
      return;
    }

    if (file.size > MAX_THUMBNAIL_SIZE) {
      toast.error('La miniature ne doit pas dépasser 5 MB.');
      return;
    }

    setUploadingThumbnail(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `thumbnails/${crypto.randomUUID()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('product-videos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('product-videos')
        .getPublicUrl(data.path);

      onThumbnailChange(urlData.publicUrl);
      toast.success('Miniature uploadée !');
    } catch (error) {
      console.error('Error uploading thumbnail:', error);
      toast.error("Erreur lors de l'upload de la miniature.");
    } finally {
      setUploadingThumbnail(false);
      if (thumbnailInputRef.current) {
        thumbnailInputRef.current.value = '';
      }
    }
  };

  const handleRemoveVideo = async () => {
    // Remove from storage if it's a Supabase URL
    if (videoUrl?.includes('product-videos')) {
      try {
        const path = videoUrl.split('product-videos/')[1];
        if (path) {
          await supabase.storage.from('product-videos').remove([path]);
        }
      } catch (error) {
        console.error('Error removing video:', error);
      }
    }
    onVideoChange(null);
    onThumbnailChange(null);
  };

  const handleRemoveThumbnail = async () => {
    if (thumbnailUrl?.includes('product-videos')) {
      try {
        const path = thumbnailUrl.split('product-videos/')[1];
        if (path) {
          await supabase.storage.from('product-videos').remove([path]);
        }
      } catch (error) {
        console.error('Error removing thumbnail:', error);
      }
    }
    onThumbnailChange(null);
  };

  // Render video preview based on source type
  const renderVideoPreview = () => {
    if (!videoUrl) return null;

    const platformInfo = getVideoPlatformInfo(videoUrl);

    return (
      <div className="space-y-3">
        {/* Video preview */}
        <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
          {isExternalVideo ? (
            // External video preview (thumbnail with platform badge)
            <div className="relative w-full h-full">
              {thumbnailUrl ? (
                <img
                  src={thumbnailUrl}
                  alt="Aperçu vidéo"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
                  <Video className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
              
              {/* Play icon overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                  <Play className="h-7 w-7 text-white fill-white ml-1" />
                </div>
              </div>
              
              {/* Platform badge */}
              <div 
                className="absolute top-2 left-2 px-2 py-1 rounded text-xs font-medium text-white"
                style={{ backgroundColor: platformInfo.color }}
              >
                {platformInfo.name}
              </div>
            </div>
          ) : (
            // Direct video preview
            <video
              ref={videoPreviewRef}
              src={videoUrl}
              className="w-full h-full object-contain"
              controls
              preload="metadata"
            />
          )}
          
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8"
            onClick={handleRemoveVideo}
            disabled={disabled}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Thumbnail section */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">
            Miniature de couverture (affichée dans la boutique)
          </Label>
          
          {thumbnailUrl ? (
            <div className="relative w-32 h-20 rounded-lg overflow-hidden border">
              <img
                src={thumbnailUrl}
                alt="Miniature"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <Play className="h-6 w-6 text-white fill-white" />
              </div>
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-5 w-5"
                onClick={handleRemoveThumbnail}
                disabled={disabled || uploadingThumbnail}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : uploadingThumbnail ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Génération de la miniature...</span>
            </div>
          ) : null}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => thumbnailInputRef.current?.click()}
            disabled={disabled || uploadingThumbnail}
            className="gap-2"
          >
            <Image className="h-4 w-4" />
            {thumbnailUrl ? 'Changer la miniature' : 'Ajouter une miniature personnalisée'}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <Label className="text-sm font-medium">Vidéo du produit (optionnel)</Label>
      
      {/* Show video preview if we have a video */}
      {videoUrl ? (
        renderVideoPreview()
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload" className="gap-2">
              <Upload className="h-4 w-4" />
              Uploader
            </TabsTrigger>
            <TabsTrigger value="external" className="gap-2">
              <Link2 className="h-4 w-4" />
              Lien externe
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="mt-4">
            {/* Compression progress */}
            {isCompressing && compressionProgress && (
              <div className="mb-4">
                <VideoCompressionProgress 
                  progress={compressionProgress} 
                  originalSize={originalFileSize ?? undefined}
                />
              </div>
            )}

            <div
              onClick={() => !disabled && !uploading && !isCompressing && !validatingDuration && videoInputRef.current?.click()}
              className={`
                border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
                transition-colors duration-200
                ${disabled || uploading || isCompressing || validatingDuration
                  ? 'border-muted bg-muted/20 cursor-not-allowed' 
                  : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-primary/5'
                }
              `}
            >
              {validatingDuration ? (
                <div className="space-y-3">
                  <Clock className="h-10 w-10 mx-auto text-primary animate-pulse" />
                  <p className="text-sm text-muted-foreground">Vérification de la durée...</p>
                </div>
              ) : uploading ? (
                <div className="space-y-3">
                  <Loader2 className="h-10 w-10 mx-auto text-primary animate-spin" />
                  <p className="text-sm text-muted-foreground">Upload en cours...</p>
                  <Progress value={uploadProgress} className="w-full max-w-xs mx-auto" />
                </div>
              ) : !isCompressing ? (
                <>
                  <Video className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm font-medium">Cliquez pour ajouter une vidéo</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    MP4, MOV ou WebM • Max 50 MB • Max 3 min
                  </p>
                  <p className="text-xs text-primary/70 mt-2">
                    ✨ Compression automatique pour les fichiers volumineux
                  </p>
                </>
              ) : null}
            </div>
          </TabsContent>

          <TabsContent value="external" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                Collez l'URL de votre vidéo YouTube ou Vimeo
              </Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    placeholder="https://youtube.com/watch?v=... ou https://vimeo.com/..."
                    value={externalUrl}
                    onChange={(e) => setExternalUrl(e.target.value)}
                    disabled={disabled}
                    className="pr-10"
                  />
                  {isValidatingUrl && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                  {urlValidation?.valid && !isValidatingUrl && (
                    <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                  )}
                </div>
                <Button
                  type="button"
                  onClick={handleExternalUrlSubmit}
                  disabled={!urlValidation?.valid || disabled}
                >
                  Ajouter
                </Button>
              </div>
            </div>

            {/* Platform detection feedback */}
            {urlValidation && (
              <div className={`flex items-center gap-2 text-sm ${urlValidation.valid ? 'text-green-600' : 'text-destructive'}`}>
                {urlValidation.valid ? (
                  <>
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ 
                        backgroundColor: urlValidation.platform === 'YouTube' ? '#FF0000' : '#1AB7EA' 
                      }}
                    />
                    <span>Vidéo {urlValidation.platform} détectée</span>
                  </>
                ) : (
                  <span>URL non reconnue. Utilisez YouTube ou Vimeo.</span>
                )}
              </div>
            )}

            {/* Auto thumbnail preview */}
            {autoThumbnail && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Aperçu de la miniature automatique
                </Label>
                <div className="relative w-40 h-24 rounded-lg overflow-hidden border">
                  <img
                    src={autoThumbnail}
                    alt="Miniature automatique"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <Play className="h-6 w-6 text-white fill-white" />
                  </div>
                </div>
              </div>
            )}

            {/* Supported platforms info */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-red-600" />
                YouTube
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-[#1AB7EA]" />
                Vimeo
              </div>
            </div>
          </TabsContent>
        </Tabs>
      )}

      <input
        ref={videoInputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/webm"
        onChange={handleVideoSelect}
        className="hidden"
        disabled={disabled || uploading || isCompressing}
      />
      <input
        ref={thumbnailInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleThumbnailSelect}
        className="hidden"
        disabled={disabled || uploadingThumbnail}
      />
    </div>
  );
}
