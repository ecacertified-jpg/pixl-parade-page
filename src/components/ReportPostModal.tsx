import { useState } from 'react';
import { usePostActions } from '@/hooks/usePostActions';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2 } from 'lucide-react';

interface ReportPostModalProps {
  postId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const reportReasons = [
  { value: 'spam', label: 'Spam ou contenu indésirable' },
  { value: 'inappropriate', label: 'Contenu inapproprié ou offensant' },
  { value: 'harassment', label: 'Harcèlement ou intimidation' },
  { value: 'false_info', label: 'Fausses informations' },
  { value: 'violence', label: 'Violence ou contenu dangereux' },
  { value: 'other', label: 'Autre raison' },
];

export function ReportPostModal({ postId, open, onOpenChange }: ReportPostModalProps) {
  const { reportPost, loading } = usePostActions();
  const [reason, setReason] = useState('spam');
  const [details, setDetails] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await reportPost(postId, reason, details);
    onOpenChange(false);
    setReason('spam');
    setDetails('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Signaler la publication</DialogTitle>
          <DialogDescription>
            Aidez-nous à maintenir une communauté sûre et respectueuse en signalant le contenu inapproprié.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <Label>Motif du signalement</Label>
            <RadioGroup value={reason} onValueChange={setReason}>
              {reportReasons.map((r) => (
                <div key={r.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={r.value} id={r.value} />
                  <Label htmlFor={r.value} className="font-normal cursor-pointer">
                    {r.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="details">
              Détails supplémentaires (optionnel)
            </Label>
            <Textarea
              id="details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Ajoutez des détails qui pourraient nous aider à comprendre le problème..."
              className="min-h-[100px]"
              disabled={loading}
            />
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
            <Button
              type="submit"
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Signaler
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
