import { useState } from "react";
import { Camera, Music, X, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { CameraCapture } from "@/components/CameraCapture";

interface CreatePostDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type PostType = 'text' | 'image' | 'video' | 'audio' | 'ai_song';

export function CreatePostDrawer({ open, onOpenChange }: CreatePostDrawerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [postType, setPostType] = useState<PostType>('text');
  const [content, setContent] = useState('');
  const [occasion, setOccasion] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const resetForm = () => {
    setPostType('text');
    setContent('');
    setOccasion('');
    setMediaFile(null);
    setMediaPreview(null);
  };


  const uploadMedia = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${user?.id}/${fileName}`;

    const { error: uploadError, data } = await supabase.storage
      .from('posts')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('posts')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const generateAISong = async () => {
    if (!content) {
      toast({
        title: "Erreur",
        description: "Veuillez décrire le chant que vous souhaitez générer",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      toast({
        title: "Génération en cours...",
        description: "Cette fonctionnalité sera bientôt disponible avec Lovable AI",
      });
      // TODO: Implémenter la génération de chant avec Lovable AI
    } catch (error) {
      console.error('Error generating AI song:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la génération du chant",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePublish = async () => {
    if (!content && !mediaFile) {
      toast({
        title: "Erreur",
        description: "Veuillez ajouter du contenu ou un média",
        variant: "destructive",
      });
      return;
    }

    setIsPublishing(true);
    try {
      let mediaUrl: string | null = null;

      if (mediaFile) {
        mediaUrl = await uploadMedia(mediaFile);
      }

      const { error } = await supabase
        .from('posts')
        .insert({
          user_id: user?.id,
          content: content || '',
          type: postType,
          media_url: mediaUrl,
          occasion: occasion || null,
          is_published: true,
        });

      if (error) throw error;

      toast({
        title: "✅ Publication réussie !",
        description: "Votre publication est maintenant visible",
      });

      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error('Error publishing post:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la publication",
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
  };


  const handleMediaImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,video/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        setMediaFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setMediaPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
        setPostType(file.type.startsWith('video') ? 'video' : 'image');
      }
    };
    input.click();
  };

  const handleCameraCapture = () => {
    setIsCameraOpen(true);
  };

  const handleCaptureFromCamera = (file: File) => {
    setMediaFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setMediaPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    setPostType(file.type.startsWith('video') ? 'video' : 'image');
    setIsCameraOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={(isOpen) => {
      onOpenChange(isOpen);
      if (!isOpen) resetForm();
    }}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8"
            >
              <X className="h-5 w-5" />
            </Button>
            
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xs font-medium">
                  {(user?.email?.[0] || 'U').toUpperCase()}
                </span>
              </div>
              <span className="text-sm font-medium">Tout le monde</span>
            </div>

            <Button
              onClick={handlePublish}
              disabled={isPublishing || (!content && !mediaFile)}
              className="px-6"
            >
              {isPublishing ? 'Publication...' : 'Publier'}
            </Button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-4">
            <Textarea
              placeholder="Partagez votre moment de joie..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[120px] border-0 resize-none text-base focus-visible:ring-0 p-0"
            />

            {/* Media Preview */}
            {mediaPreview && (
              <div className="relative mt-4">
                {postType === 'image' ? (
                  <img
                    src={mediaPreview}
                    alt="Preview"
                    className="w-full max-h-[300px] object-cover rounded-lg"
                  />
                ) : postType === 'video' ? (
                  <video
                    src={mediaPreview}
                    className="w-full max-h-[300px] object-cover rounded-lg"
                    controls
                  />
                ) : null}
                <Button
                  size="sm"
                  variant="destructive"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    setMediaFile(null);
                    setMediaPreview(null);
                    setPostType('text');
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Occasion input */}
            {content && (
              <div className="mt-4">
                <Input
                  placeholder="Occasion (optionnel) - Ex: Anniversaire, Mariage..."
                  value={occasion}
                  onChange={(e) => setOccasion(e.target.value)}
                  className="border-0 bg-muted/50"
                />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="border-t p-4">
            <div className="flex items-center justify-around">
              <button
                onClick={handleMediaImport}
                className="flex flex-col items-center gap-1 p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                  <ImageIcon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <div className="text-xs font-medium">Médias</div>
                  <div className="text-[10px] text-muted-foreground">Importer image</div>
                </div>
              </button>

              <button
                onClick={handleCameraCapture}
                className="flex flex-col items-center gap-1 p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                  <Camera className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <div className="text-xs font-medium">Appareil</div>
                  <div className="text-[10px] text-muted-foreground">photo</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setPostType('ai_song');
                  if (content) {
                    generateAISong();
                  } else {
                    toast({
                      title: "Information",
                      description: "Décrivez d'abord le chant que vous souhaitez générer",
                    });
                  }
                }}
                disabled={isGenerating}
                className="flex flex-col items-center gap-1 p-2 hover:bg-muted rounded-lg transition-colors disabled:opacity-50"
              >
                <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                  <Music className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <div className="text-xs font-medium">Générer</div>
                  <div className="text-[10px] text-muted-foreground">Chant IA</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </SheetContent>

      <CameraCapture
        open={isCameraOpen}
        onOpenChange={setIsCameraOpen}
        onCapture={handleCaptureFromCamera}
      />
    </Sheet>
  );
}
