import { useState, useRef, useCallback } from 'react';
import { Video, X, Plus, GripVertical, Play, Link2, Upload, Loader2, CheckCircle2, Clock, Scissors } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { VideoItem } from '@/types/video';
import { 
  getVideoSource, 
  isValidVideoUrl, 
  getVideoThumbnail,
  getVideoPlatformInfo,
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
  validateVideoDurationWithConfig, 
  formatDuration,
  VIDEO_VALIDATION_CONFIG 
} from '@/utils/videoValidation';
import { VideoTrimEditor } from '@/components/VideoTrimEditor';

interface MultiVideoUploaderProps {
  videos: VideoItem[];
  onChange: (videos: VideoItem[]) => void;
  maxVideos?: number;
  maxDurationSeconds?: number;
  productType?: 'experience' | 'product';
  disabled?: boolean;
}

const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50 MB
const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'];

export function MultiVideoUploader({
  videos,
  onChange,
  maxVideos = 5,
  maxDurationSeconds,
  productType,
  disabled = false,
}: MultiVideoUploaderProps) {
  // Use configured max or fallback to default
  const effectiveMaxDuration = maxDurationSeconds ?? VIDEO_VALIDATION_CONFIG.maxDurationSeconds;
  const maxDurationFormatted = effectiveMaxDuration >= 60
    ? `${Math.round(effectiveMaxDuration / 60)} min`
    : `${effectiveMaxDuration} sec`;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('upload');
  const [externalUrl, setExternalUrl] = useState('');
  const [urlValidation, setUrlValidation] = useState<{ valid: boolean; platform?: string } | null>(null);
  const [autoThumbnail, setAutoThumbnail] = useState<string | null>(null);
  const [isValidatingUrl, setIsValidatingUrl] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState<CompressionProgress | null>(null);
  const [originalFileSize, setOriginalFileSize] = useState<number | null>(null);
  const [validatingDuration, setValidatingDuration] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  // Trim editor state
  const [showTrimEditor, setShowTrimEditor] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingVideoDuration, setPendingVideoDuration] = useState(0);
  
  const videoInputRef = useRef<HTMLInputElement>(null);
  const canAddMore = videos.length < maxVideos;

  // Validate external URL
  const validateExternalUrl = useCallback(async (url: string) => {
    if (!url) {
      setUrlValidation(null);
      setAutoThumbnail(null);
      return;
    }

    setIsValidatingUrl(true);
    const source = getVideoSource(url);
    const isValid = isValidVideoUrl(url);
    
    if (isValid && (source === 'youtube' || source === 'vimeo')) {
      const platformInfo = getVideoPlatformInfo(url);
      setUrlValidation({ valid: true, platform: platformInfo.name });
      
      const thumbnail = await getVideoThumbnail(url);
      setAutoThumbnail(thumbnail);
    } else if (url.length > 10) {
      setUrlValidation({ valid: false });
      setAutoThumbnail(null);
    } else {
      setUrlValidation(null);
      setAutoThumbnail(null);
    }
    
    setIsValidatingUrl(false);
  }, []);

  const handleExternalUrlChange = (url: string) => {
    setExternalUrl(url);
    const debounce = setTimeout(() => validateExternalUrl(url), 500);
    return () => clearTimeout(debounce);
  };

  const handleExternalUrlSubmit = () => {
    if (!urlValidation?.valid) {
      toast.error('URL invalide. Utilisez une URL YouTube ou Vimeo.');
      return;
    }

    const source = getVideoSource(externalUrl) as 'youtube' | 'vimeo';
    const newVideo: VideoItem = {
      id: crypto.randomUUID(),
      url: externalUrl,
      thumbnailUrl: autoThumbnail,
      source,
      order: videos.length,
    };

    onChange([...videos, newVideo]);
    toast.success(`Vidéo ${urlValidation.platform} ajoutée !`);
    
    setExternalUrl('');
    setUrlValidation(null);
    setAutoThumbnail(null);
    setIsModalOpen(false);
  };

  // Process video upload (after potential trim)
  const processVideoUpload = async (file: File) => {
    let fileToUpload = file;
    setOriginalFileSize(file.size);

    // Compression if needed
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
          `Vidéo compressée : ${formatBytes(result.originalSize)} → ${formatBytes(result.compressedSize)}`
        );
      } catch (error) {
        console.warn('Compression failed, uploading original:', error);
        toast.info('Compression impossible, upload du fichier original...');
      }
      setIsCompressing(false);
      setCompressionProgress(null);
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const fileExt = fileToUpload.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `videos/${fileName}`;

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

      // Generate thumbnail
      const thumbnailUrl = await generateThumbnailFromVideo(urlData.publicUrl);

      const newVideo: VideoItem = {
        id: crypto.randomUUID(),
        url: urlData.publicUrl,
        thumbnailUrl,
        source: 'direct',
        order: videos.length,
      };

      onChange([...videos, newVideo]);
      toast.success('Vidéo uploadée avec succès !');
      setIsModalOpen(false);
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

  // Handle trim completion
  const handleTrimComplete = async (trimmedFile: File) => {
    setShowTrimEditor(false);
    setPendingFile(null);
    setPendingVideoDuration(0);
    await processVideoUpload(trimmedFile);
  };

  // Cancel trim
  const handleTrimCancel = () => {
    setShowTrimEditor(false);
    setPendingFile(null);
    setPendingVideoDuration(0);
    if (videoInputRef.current) {
      videoInputRef.current.value = '';
    }
  };

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
      
      const durationCheck = validateVideoDurationWithConfig(metadata.duration, effectiveMaxDuration, productType);
      if (!durationCheck.valid) {
        // Video is too long - offer trim editor
        setValidatingDuration(false);
        setPendingFile(file);
        setPendingVideoDuration(metadata.duration);
        setShowTrimEditor(true);
        toast.info(
          `Vidéo trop longue (${formatDuration(metadata.duration)}). Utilisez l'éditeur pour la raccourcir.`,
          { duration: 4000, icon: <Scissors className="h-4 w-4" /> }
        );
        return;
      }
    } catch (error) {
      console.warn('Duration validation failed:', error);
      // Continue anyway as fallback
    } finally {
      setValidatingDuration(false);
    }

    // Video duration is OK, proceed with upload
    await processVideoUpload(file);
  };


  const generateThumbnailFromVideo = async (url: string): Promise<string | null> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.src = url;
      video.muted = true;
      video.currentTime = 1;

      video.onloadeddata = async () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          canvas.toBlob(async (blob) => {
            if (blob) {
              try {
                const fileName = `thumbnails/${crypto.randomUUID()}.jpg`;
                const { data, error } = await supabase.storage
                  .from('product-videos')
                  .upload(fileName, blob, {
                    cacheControl: '3600',
                    contentType: 'image/jpeg',
                  });

                if (!error && data) {
                  const { data: urlData } = supabase.storage
                    .from('product-videos')
                    .getPublicUrl(data.path);
                  resolve(urlData.publicUrl);
                } else {
                  resolve(null);
                }
              } catch {
                resolve(null);
              }
            } else {
              resolve(null);
            }
          }, 'image/jpeg', 0.8);
        } else {
          resolve(null);
        }
      };

      video.onerror = () => resolve(null);
      setTimeout(() => resolve(null), 10000);
    });
  };

  const handleRemoveVideo = async (index: number) => {
    const video = videos[index];
    
    // Remove from storage if direct upload
    if (video.source === 'direct' && video.url?.includes('product-videos')) {
      try {
        const path = video.url.split('product-videos/')[1];
        if (path) {
          await supabase.storage.from('product-videos').remove([path]);
        }
        if (video.thumbnailUrl?.includes('product-videos')) {
          const thumbPath = video.thumbnailUrl.split('product-videos/')[1];
          if (thumbPath) {
            await supabase.storage.from('product-videos').remove([thumbPath]);
          }
        }
      } catch (error) {
        console.error('Error removing video:', error);
      }
    }

    const newVideos = videos.filter((_, i) => i !== index).map((v, i) => ({ ...v, order: i }));
    onChange(newVideos);
  };

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newVideos = [...videos];
    const draggedItem = newVideos[draggedIndex];
    newVideos.splice(draggedIndex, 1);
    newVideos.splice(index, 0, draggedItem);
    
    setDraggedIndex(index);
    onChange(newVideos.map((v, i) => ({ ...v, order: i })));
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'youtube':
        return <Badge variant="secondary" className="bg-red-500 text-white text-[10px] px-1">YT</Badge>;
      case 'vimeo':
        return <Badge variant="secondary" className="bg-blue-500 text-white text-[10px] px-1">Vim</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">
          Vidéos du produit ({videos.length}/{maxVideos})
        </Label>
      </div>

      {/* Video thumbnails grid */}
      {videos.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {videos.map((video, index) => (
            <div
              key={video.id}
              draggable={!disabled}
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={cn(
                "relative group w-24 h-16 rounded-lg overflow-hidden border-2 cursor-move",
                draggedIndex === index ? "border-primary opacity-50" : "border-border",
                disabled && "cursor-not-allowed opacity-50"
              )}
            >
              {video.thumbnailUrl ? (
                <img
                  src={video.thumbnailUrl}
                  alt={video.title || `Vidéo ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <Video className="h-6 w-6 text-muted-foreground" />
                </div>
              )}

              {/* Play icon overlay */}
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <Play className="h-5 w-5 text-white fill-white" />
              </div>

              {/* Source badge */}
              <div className="absolute bottom-1 left-1">
                {getSourceBadge(video.source)}
              </div>

              {/* Primary badge */}
              {index === 0 && (
                <div className="absolute top-1 left-1">
                  <Badge variant="default" className="text-[9px] px-1 py-0">
                    Principal
                  </Badge>
                </div>
              )}

              {/* Drag handle */}
              <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <GripVertical className="h-4 w-4 text-white drop-shadow-lg" />
              </div>

              {/* Remove button */}
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute -top-1 -right-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleRemoveVideo(index)}
                disabled={disabled}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Add button */}
      {canAddMore && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsModalOpen(true)}
          disabled={disabled}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Ajouter une vidéo
        </Button>
      )}

      {videos.length > 1 && (
        <p className="text-xs text-muted-foreground">
          Glissez pour réordonner. La première vidéo sera affichée en principal.
        </p>
      )}

      {/* Hidden input */}
      <input
        ref={videoInputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/webm"
        onChange={handleVideoSelect}
        className="hidden"
      />

      {/* Add video modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter une vidéo</DialogTitle>
          </DialogHeader>

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

            <TabsContent value="upload" className="mt-4 space-y-4">
              {/* Compression progress */}
              {isCompressing && compressionProgress && (
                <VideoCompressionProgress 
                  progress={compressionProgress} 
                  originalSize={originalFileSize ?? undefined}
                />
              )}

              {validatingDuration ? (
                <div className="space-y-3 p-6 text-center">
                  <Clock className="h-10 w-10 mx-auto text-primary animate-pulse" />
                  <p className="text-sm text-muted-foreground">Vérification de la durée...</p>
                </div>
              ) : uploading ? (
                <div className="space-y-3 p-6 text-center">
                  <Loader2 className="h-10 w-10 mx-auto text-primary animate-spin" />
                  <p className="text-sm text-muted-foreground">Upload en cours...</p>
                  <Progress value={uploadProgress} className="w-full max-w-xs mx-auto" />
                </div>
              ) : !isCompressing && (
                <div
                  onClick={() => videoInputRef.current?.click()}
                  className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
                    transition-colors duration-200 border-muted-foreground/25 
                    hover:border-primary/50 hover:bg-primary/5"
                >
                  <Video className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm font-medium">Cliquez pour sélectionner</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    MP4, MOV ou WebM • Max 50 MB • Max {maxDurationFormatted}
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="external" className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label>URL YouTube ou Vimeo</Label>
                <div className="relative">
                  <Input
                    value={externalUrl}
                    onChange={(e) => handleExternalUrlChange(e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                    className="pr-10"
                  />
                  {isValidatingUrl && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                  {urlValidation?.valid && (
                    <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                  )}
                </div>
                {urlValidation && !urlValidation.valid && (
                  <p className="text-xs text-destructive">URL invalide</p>
                )}
                {urlValidation?.valid && (
                  <p className="text-xs text-green-600">
                    Vidéo {urlValidation.platform} détectée ✓
                  </p>
                )}
              </div>

              {/* Auto thumbnail preview */}
              {autoThumbnail && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Aperçu</Label>
                  <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black">
                    <img
                      src={autoThumbnail}
                      alt="Aperçu"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <Play className="h-10 w-10 text-white fill-white" />
                    </div>
                  </div>
                </div>
              )}

              <Button
                type="button"
                onClick={handleExternalUrlSubmit}
                disabled={!urlValidation?.valid}
                className="w-full"
              >
                Ajouter cette vidéo
              </Button>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Trim editor modal */}
      {pendingFile && (
        <VideoTrimEditor
          file={pendingFile}
          maxDurationSeconds={effectiveMaxDuration}
          videoDuration={pendingVideoDuration}
          onTrimComplete={handleTrimComplete}
          onCancel={handleTrimCancel}
          open={showTrimEditor}
        />
      )}
    </div>
  );
}
