import { useState, RefObject } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { extractSingleThumbnail } from '@/utils/videoThumbnails';

interface VideoFrameCaptureProps {
  videoRef: RefObject<HTMLVideoElement>;
  videoUrl: string | null;
  onCapture: (imageBlob: Blob, timestamp: number) => void;
  disabled?: boolean;
  variant?: 'default' | 'compact';
  className?: string;
}

export function VideoFrameCapture({
  videoRef,
  videoUrl,
  onCapture,
  disabled = false,
  variant = 'default',
  className,
}: VideoFrameCaptureProps) {
  const [isCapturing, setIsCapturing] = useState(false);

  const handleCapture = async () => {
    if (!videoRef.current || !videoUrl) return;

    setIsCapturing(true);
    try {
      const currentTime = videoRef.current.currentTime;
      
      // Extract the frame at current time with good quality
      const imageDataUrl = await extractSingleThumbnail(
        videoUrl,
        currentTime,
        640 // Good resolution for product thumbnails
      );

      // Convert data URL to Blob
      const response = await fetch(imageDataUrl);
      const blob = await response.blob();

      onCapture(blob, currentTime);
    } catch (error) {
      console.error('Error capturing frame:', error);
    } finally {
      setIsCapturing(false);
    }
  };

  if (variant === 'compact') {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={className}
        onClick={handleCapture}
        disabled={disabled || isCapturing || !videoUrl}
        title="Capturer ce frame"
      >
        {isCapturing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Camera className="h-4 w-4" />
        )}
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleCapture}
      disabled={disabled || isCapturing || !videoUrl}
      className={className}
    >
      {isCapturing ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Capture...
        </>
      ) : (
        <>
          <Camera className="h-4 w-4 mr-2" />
          Extraire miniature
        </>
      )}
    </Button>
  );
}
