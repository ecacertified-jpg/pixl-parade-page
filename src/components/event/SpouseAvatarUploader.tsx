import { useState } from "react";
import { Camera, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CameraCapture } from "@/components/CameraCapture";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  pageId: string;
  creatorId: string;
  currentUrl?: string | null;
  onChange: (url: string | null) => void;
}

export const SpouseAvatarUploader = ({
  isOpen,
  onClose,
  pageId,
  creatorId,
  currentUrl,
  onChange,
}: Props) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const upload = async (file: File) => {
    try {
      setLoading(true);
      if (!file.type.startsWith("image/")) {
        toast({ title: "Erreur", description: "Veuillez sélectionner une image", variant: "destructive" });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "Erreur", description: "L'image ne doit pas dépasser 5 Mo", variant: "destructive" });
        return;
      }
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${creatorId}/spouse-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const { error: updErr } = await supabase
        .from("event_pages")
        .update({ spouse_avatar_url: data.publicUrl })
        .eq("id", pageId);
      if (updErr) throw updErr;
      onChange(data.publicUrl);
      toast({ title: "Photo mise à jour 💞" });
      onClose();
    } catch (e) {
      console.error(e);
      toast({ title: "Erreur", description: "Impossible de mettre à jour la photo", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const remove = async () => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from("event_pages")
        .update({ spouse_avatar_url: null })
        .eq("id", pageId);
      if (error) throw error;
      onChange(null);
      toast({ title: "Photo supprimée" });
      onClose();
    } catch (e) {
      console.error(e);
      toast({ title: "Erreur", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md z-[200]">
          <DialogHeader>
            <DialogTitle>Photo du/de la conjoint·e 💞</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {currentUrl && (
              <div className="flex justify-center">
                <div className="relative w-32 h-32 rounded-full overflow-hidden bg-muted">
                  <img src={currentUrl} alt="Aperçu" className="w-full h-full object-cover" />
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => setIsCameraOpen(true)}
                disabled={loading}
                className="flex flex-col h-auto py-6 gap-2"
              >
                <Camera className="h-6 w-6" />
                <span className="text-sm">Prendre une photo</span>
              </Button>
              <Button variant="outline" disabled={loading} className="flex flex-col h-auto py-6 gap-2" asChild>
                <label>
                  <Upload className="h-6 w-6" />
                  <span className="text-sm">Télécharger</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) upload(f);
                    }}
                  />
                </label>
              </Button>
            </div>
            {currentUrl && (
              <Button variant="destructive" onClick={remove} disabled={loading} className="w-full gap-2">
                <X className="h-4 w-4" /> Supprimer la photo
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
      <CameraCapture
        open={isCameraOpen}
        onOpenChange={setIsCameraOpen}
        onCapture={(f) => {
          setIsCameraOpen(false);
          upload(f);
        }}
      />
    </>
  );
};