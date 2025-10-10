import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface EditPostModalProps {
  postId: string;
  currentContent: string;
  currentMediaUrl?: string;
  currentMediaType?: string;
  currentOccasion?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const occasions = [
  { value: 'birthday', label: 'Anniversaire' },
  { value: 'academic', label: 'Réussite académique' },
  { value: 'promotion', label: 'Promotion' },
  { value: 'wedding', label: 'Mariage' },
  { value: 'thanks', label: 'Remerciements' },
  { value: 'other', label: 'Autre' },
];

export function EditPostModal({
  postId,
  currentContent,
  currentOccasion,
  open,
  onOpenChange,
  onSuccess,
}: EditPostModalProps) {
  const [content, setContent] = useState(currentContent);
  const [occasion, setOccasion] = useState(currentOccasion || 'other');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      toast({
        title: "Erreur",
        description: "Le contenu ne peut pas être vide.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('posts')
        .update({
          content,
          occasion,
          updated_at: new Date().toISOString(),
        })
        .eq('id', postId);

      if (error) throw error;

      toast({
        title: "Publication modifiée !",
        description: "Votre publication a été mise à jour avec succès.",
      });

      onSuccess();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de modifier la publication.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Modifier la publication</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="content">Contenu</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Partagez votre moment de joie..."
              className="min-h-[120px]"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="occasion">Occasion</Label>
            <Select value={occasion} onValueChange={setOccasion} disabled={loading}>
              <SelectTrigger id="occasion">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {occasions.map((occ) => (
                  <SelectItem key={occ.value} value={occ.value}>
                    {occ.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enregistrer
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
