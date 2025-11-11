import { useState } from "react";
import { Camera, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CameraCapture } from "@/components/CameraCapture";

interface EditAvatarModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  currentAvatarUrl?: string;
  onAvatarUpdate: (newAvatarUrl: string) => void;
}

export const EditAvatarModal = ({
  isOpen,
  onClose,
  userId,
  currentAvatarUrl,
  onAvatarUpdate,
}: EditAvatarModalProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentAvatarUrl || null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    await uploadAvatar(file);
  };

  const handleCameraCapture = async (file: File) => {
    setIsCameraOpen(false);
    await uploadAvatar(file);
  };

  const uploadAvatar = async (file: File) => {
    try {
      setIsLoading(true);

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Erreur",
          description: "Veuillez sélectionner une image",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Erreur",
          description: "L'image ne doit pas dépasser 5 Mo",
          variant: "destructive",
        });
        return;
      }

      // Delete old avatar if exists
      if (currentAvatarUrl) {
        const oldPath = currentAvatarUrl.split('/').pop();
        if (oldPath) {
          await supabase.storage
            .from('avatars')
            .remove([`${userId}/${oldPath}`]);
        }
      }

      // Upload new avatar
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          upsert: true,
          contentType: file.type,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', userId);

      if (updateError) throw updateError;

      setPreviewUrl(publicUrl);
      onAvatarUpdate(publicUrl);

      toast({
        title: "Photo de profil mise à jour",
        description: "Votre photo a été mise à jour avec succès",
      });

      onClose();
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la photo de profil",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      setIsLoading(true);

      // Delete from storage
      if (currentAvatarUrl) {
        const oldPath = currentAvatarUrl.split('/').pop();
        if (oldPath) {
          await supabase.storage
            .from('avatars')
            .remove([`${userId}/${oldPath}`]);
        }
      }

      // Update profile
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('user_id', userId);

      if (error) throw error;

      setPreviewUrl(null);
      onAvatarUpdate('');

      toast({
        title: "Photo supprimée",
        description: "Votre photo de profil a été supprimée",
      });

      onClose();
    } catch (error) {
      console.error('Error removing avatar:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la photo de profil",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier la photo de profil</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Preview */}
            {previewUrl && (
              <div className="flex justify-center">
                <div className="relative w-32 h-32 rounded-full overflow-hidden bg-muted">
                  <img
                    src={previewUrl}
                    alt="Avatar preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}

            {/* Upload options */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => setIsCameraOpen(true)}
                disabled={isLoading}
                className="flex flex-col h-auto py-6 gap-2"
              >
                <Camera className="h-6 w-6" />
                <span className="text-sm">Prendre une photo</span>
              </Button>

              <Button
                variant="outline"
                disabled={isLoading}
                className="flex flex-col h-auto py-6 gap-2"
                asChild
              >
                <label>
                  <Upload className="h-6 w-6" />
                  <span className="text-sm">Télécharger</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              </Button>
            </div>

            {/* Remove option */}
            {currentAvatarUrl && (
              <Button
                variant="destructive"
                onClick={handleRemoveAvatar}
                disabled={isLoading}
                className="w-full gap-2"
              >
                <X className="h-4 w-4" />
                Supprimer la photo
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Camera Capture Modal */}
      <CameraCapture
        open={isCameraOpen}
        onOpenChange={setIsCameraOpen}
        onCapture={handleCameraCapture}
      />
    </>
  );
};
