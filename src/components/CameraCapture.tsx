import { useState, useRef, useEffect } from "react";
import { Camera, Video, X, RotateCcw, Check, SwitchCamera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

interface CameraCaptureProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCapture: (file: File) => void;
}

type CaptureMode = 'photo' | 'video';

export function CameraCapture({ open, onOpenChange, onCapture }: CameraCaptureProps) {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [captureMode, setCaptureMode] = useState<CaptureMode>('photo');
  const [isRecording, setIsRecording] = useState(false);
  const [capturedMedia, setCapturedMedia] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [recordingTime, setRecordingTime] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      setRecordingTime(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
        audio: captureMode === 'video',
      });
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'accéder à la caméra. Vérifiez les permissions.",
        variant: "destructive",
      });
      onOpenChange(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const switchCamera = async () => {
    stopCamera();
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  useEffect(() => {
    if (open && !capturedMedia) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [open, facingMode]);

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    
    canvas.toBlob((blob) => {
      if (!blob) return;
      
      const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
      const url = URL.createObjectURL(blob);
      
      setCapturedMedia(url);
      setCapturedFile(file);
      stopCamera();
    }, 'image/jpeg', 0.95);
  };

  const startVideoRecording = async () => {
    if (!stream) return;

    chunksRef.current = [];
    
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp8,opus',
    });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      const file = new File([blob], `video-${Date.now()}.webm`, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      
      setCapturedMedia(url);
      setCapturedFile(file);
      stopCamera();
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start();
    setIsRecording(true);
  };

  const stopVideoRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleCapture = () => {
    if (captureMode === 'photo') {
      capturePhoto();
    } else {
      if (isRecording) {
        stopVideoRecording();
      } else {
        startVideoRecording();
      }
    }
  };

  const handleRetake = () => {
    setCapturedMedia(null);
    setCapturedFile(null);
    setIsRecording(false);
    startCamera();
  };

  const handleUse = () => {
    if (capturedFile) {
      onCapture(capturedFile);
      handleClose();
    }
  };

  const handleClose = () => {
    stopCamera();
    setCapturedMedia(null);
    setCapturedFile(null);
    setIsRecording(false);
    onOpenChange(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-full h-full p-0 m-0 border-0">
        <div className="relative w-full h-full bg-black flex items-center justify-center">
          {/* Video Stream */}
          {!capturedMedia && (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />
            </>
          )}

          {/* Preview of Captured Media */}
          {capturedMedia && (
            <div className="w-full h-full">
              {captureMode === 'photo' ? (
                <img
                  src={capturedMedia}
                  alt="Captured"
                  className="w-full h-full object-contain"
                />
              ) : (
                <video
                  src={capturedMedia}
                  controls
                  className="w-full h-full object-contain"
                />
              )}
            </div>
          )}

          {/* Top Controls */}
          <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center bg-gradient-to-b from-black/50 to-transparent">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="text-white hover:bg-white/20"
            >
              <X className="h-6 w-6" />
            </Button>

            {!capturedMedia && (
              <Button
                variant="ghost"
                size="icon"
                onClick={switchCamera}
                className="text-white hover:bg-white/20"
              >
                <SwitchCamera className="h-6 w-6" />
              </Button>
            )}
          </div>

          {/* Recording Timer */}
          {isRecording && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-full font-mono text-lg">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                {formatTime(recordingTime)}
              </div>
            </div>
          )}

          {/* Bottom Controls */}
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/50 to-transparent">
            {!capturedMedia ? (
              <div className="flex flex-col items-center gap-4">
                {/* Mode Toggle */}
                <div className="flex gap-2 bg-black/30 rounded-full p-1">
                  <button
                    onClick={() => setCaptureMode('photo')}
                    className={`px-6 py-2 rounded-full text-white transition-all ${
                      captureMode === 'photo' ? 'bg-white/20' : ''
                    }`}
                  >
                    <Camera className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setCaptureMode('video')}
                    className={`px-6 py-2 rounded-full text-white transition-all ${
                      captureMode === 'video' ? 'bg-white/20' : ''
                    }`}
                  >
                    <Video className="h-5 w-5" />
                  </button>
                </div>

                {/* Capture Button */}
                <button
                  onClick={handleCapture}
                  className={`w-20 h-20 rounded-full border-4 border-white flex items-center justify-center transition-all ${
                    isRecording ? 'bg-red-500' : 'bg-white/20'
                  }`}
                >
                  {isRecording ? (
                    <div className="w-8 h-8 bg-white rounded" />
                  ) : (
                    <div className="w-16 h-16 bg-white rounded-full" />
                  )}
                </button>
              </div>
            ) : (
              <div className="flex justify-center gap-4">
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={handleRetake}
                  className="gap-2"
                >
                  <RotateCcw className="h-5 w-5" />
                  Reprendre
                </Button>
                <Button
                  size="lg"
                  onClick={handleUse}
                  className="gap-2"
                >
                  <Check className="h-5 w-5" />
                  Utiliser cette capture
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
