import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface EditBioModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBio: string;
  userId: string;
  onBioUpdate: (newBio: string) => void;
}

export const EditBioModal = ({ isOpen, onClose, currentBio, userId, onBioUpdate }: EditBioModalProps) => {
  const [bio, setBio] = useState(currentBio);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({ 
          user_id: userId, 
          bio: bio.trim() || null 
        }, { 
          onConflict: 'user_id' 
        });

      if (error) throw error;

      onBioUpdate(bio.trim());
      toast({
        title: "Bio mise à jour",
        description: "Votre bio a été mise à jour avec succès !"
      });
      onClose();
    } catch (error) {
      console.error('Error updating bio:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour votre bio",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Modifier votre bio</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              placeholder="Parlez-nous de vous..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={160}
              className="resize-none"
              rows={4}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {bio.length}/160 caractères
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};