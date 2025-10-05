import { useState } from "react";
import { FileText, Camera, Music, Send, X, Image as ImageIcon, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface CreatePostDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type PostType = 'text' | 'image' | 'video' | 'audio' | 'ai_song';

export function CreatePostDrawer({ open, onOpenChange }: CreatePostDrawerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState<'menu' | 'create'>('menu');
  const [postType, setPostType] = useState<PostType>('text');
  const [content, setContent] = useState('');
  const [occasion, setOccasion] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const resetForm = () => {
    setStep('menu');
    setPostType('text');
    setContent('');
    setOccasion('');
    setMediaFile(null);
    setMediaPreview(null);
  };

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMediaFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadMedia = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${user?.id}-${Date.now()}.${fileExt}`;
    const filePath = `posts/${fileName}`;

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

  const menuOptions = [
    {
      icon: <FileText className="h-6 w-6" />,
      label: "Écrire un post",
      onClick: () => {
        setPostType('text');
        setStep('create');
      },
    },
    {
      icon: <Camera className="h-6 w-6" />,
      label: "Importer média",
      onClick: () => {
        setPostType('image');
        setStep('create');
      },
    },
    {
      icon: <Music className="h-6 w-6" />,
      label: "Générer Chant IA",
      onClick: () => {
        setPostType('ai_song');
        setStep('create');
      },
    },
    {
      icon: <Send className="h-6 w-6" />,
      label: "Publier",
      onClick: () => {
        setPostType('text');
        setStep('create');
      },
    },
  ];

  return (
    <Sheet open={open} onOpenChange={(isOpen) => {
      onOpenChange(isOpen);
      if (!isOpen) resetForm();
    }}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl">
        <SheetHeader>
          <SheetTitle className="text-center">
            {step === 'menu' ? 'Création' : 'Nouvelle publication'}
          </SheetTitle>
        </SheetHeader>

        {step === 'menu' ? (
          <div className="grid grid-cols-2 gap-4 mt-8">
            {menuOptions.map((option, index) => (
              <button
                key={index}
                onClick={option.onClick}
                className="flex flex-col items-center gap-3 p-6 bg-card rounded-2xl border border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                  {option.icon}
                </div>
                <span className="text-sm font-medium text-center">{option.label}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="mt-6 space-y-4 overflow-y-auto max-h-[calc(90vh-200px)]">
            <div className="space-y-2">
              <Label>Contenu</Label>
              <Textarea
                placeholder={
                  postType === 'ai_song'
                    ? "Décrivez le chant que vous souhaitez générer..."
                    : "Partagez votre moment de joie..."
                }
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label>Occasion (optionnel)</Label>
              <Input
                placeholder="Ex: Anniversaire, Mariage, Réussite..."
                value={occasion}
                onChange={(e) => setOccasion(e.target.value)}
              />
            </div>

            {(postType === 'image' || postType === 'video') && (
              <div className="space-y-2">
                <Label>
                  {postType === 'image' ? 'Image' : 'Vidéo'}
                </Label>
                <Input
                  type="file"
                  accept={postType === 'image' ? 'image/*' : 'video/*'}
                  onChange={handleMediaSelect}
                  className="cursor-pointer"
                />
                {mediaPreview && postType === 'image' && (
                  <div className="relative mt-2">
                    <img
                      src={mediaPreview}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setMediaFile(null);
                        setMediaPreview(null);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}

            {postType === 'audio' && (
              <div className="space-y-2">
                <Label>Audio</Label>
                <Input
                  type="file"
                  accept="audio/*"
                  onChange={handleMediaSelect}
                  className="cursor-pointer"
                />
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setStep('menu')}
              >
                Retour
              </Button>
              
              {postType === 'ai_song' ? (
                <Button
                  className="flex-1"
                  onClick={generateAISong}
                  disabled={isGenerating || !content}
                >
                  {isGenerating ? 'Génération...' : 'Générer'}
                </Button>
              ) : (
                <Button
                  className="flex-1"
                  onClick={handlePublish}
                  disabled={isPublishing || (!content && !mediaFile)}
                >
                  {isPublishing ? 'Publication...' : 'Publier'}
                </Button>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
