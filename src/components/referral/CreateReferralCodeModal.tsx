import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface CreateReferralCodeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (label: string, codeType: string) => Promise<void>;
}

export const CreateReferralCodeModal = ({
  open,
  onOpenChange,
  onCreate,
}: CreateReferralCodeModalProps) => {
  const [label, setLabel] = useState('');
  const [codeType, setCodeType] = useState('personal');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return;

    setLoading(true);
    try {
      await onCreate(label, codeType);
      setLabel('');
      setCodeType('personal');
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Créer un nouveau code</DialogTitle>
          <DialogDescription>
            Créez un code de parrainage pour suivre vos invitations par canal
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="label">Label du code *</Label>
            <Input
              id="label"
              placeholder="Ex: WhatsApp, Instagram, Email..."
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Nommez ce code pour identifier facilement son utilisation
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type de code</Label>
            <Select value={codeType} onValueChange={setCodeType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="personal">Personnel</SelectItem>
                <SelectItem value="campaign">Campagne</SelectItem>
                <SelectItem value="event">Événement</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading || !label.trim()}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Créer le code
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
