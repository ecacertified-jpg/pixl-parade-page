import { useState } from 'react';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Mail, Loader2, CheckCircle2 } from 'lucide-react';

const emailSchema = z.string().trim().email('Adresse email invalide').max(255);

interface ChangeEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentEmail: string;
}

export function ChangeEmailDialog({ open, onOpenChange, currentEmail }: ChangeEmailDialogProps) {
  const { toast } = useToast();
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);

    const result = emailSchema.safeParse(newEmail);
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    if (result.data.toLowerCase() === currentEmail?.toLowerCase()) {
      setError("C'est déjà votre adresse email actuelle");
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ email: result.data });
      if (updateError) throw updateError;

      setSuccess(true);
      toast({
        title: 'Vérification envoyée',
        description: 'Un lien de confirmation a été envoyé à votre ancienne et nouvelle adresse email.',
      });
    } catch (err: any) {
      console.error('Email update error:', err);
      setError(err.message || 'Impossible de mettre à jour l\'email');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setNewEmail('');
      setError(null);
      setSuccess(false);
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Modifier l'adresse email</DialogTitle>
          <DialogDescription>
            Un lien de confirmation sera envoyé aux deux adresses (ancienne et nouvelle).
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <CheckCircle2 className="h-10 w-10 text-success" />
            <p className="text-sm text-muted-foreground">
              Vérifiez vos boîtes mail (ancienne et nouvelle) pour confirmer le changement.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Email actuel</Label>
              <Input value={currentEmail || ''} readOnly className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-email">Nouvel email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="new-email"
                  type="email"
                  value={newEmail}
                  onChange={(e) => { setNewEmail(e.target.value); setError(null); }}
                  placeholder="nouveau@email.com"
                  className={`pl-10 ${error ? 'border-destructive' : ''}`}
                />
              </div>
              {error && <p className="text-xs text-destructive">{error}</p>}
            </div>
          </div>
        )}

        <DialogFooter>
          {success ? (
            <Button onClick={() => handleClose(false)}>Fermer</Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading || !newEmail.trim()}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirmer
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
