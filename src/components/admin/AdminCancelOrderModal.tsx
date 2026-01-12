import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { XCircle } from 'lucide-react';
import { AdminOrder } from '@/hooks/useAdminOrders';

interface AdminCancelOrderModalProps {
  order: AdminOrder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCancel: (orderId: string, reason: string) => Promise<void>;
}

export function AdminCancelOrderModal({
  order,
  open,
  onOpenChange,
  onCancel
}: AdminCancelOrderModalProps) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  if (!order) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' XOF';
  };

  const handleSubmit = async () => {
    if (!reason.trim()) return;

    setLoading(true);
    try {
      await onCancel(order.id, reason);
      onOpenChange(false);
      setReason('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <XCircle className="h-5 w-5" />
            Annuler la commande
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted p-3 rounded-lg">
            <p className="text-sm">
              <span className="text-muted-foreground">Commande:</span>{' '}
              <span className="font-medium">#{order.id.slice(0, 8).toUpperCase()}</span>
            </p>
            <p className="text-sm">
              <span className="text-muted-foreground">Business:</span>{' '}
              <span className="font-medium">{order.business_name}</span>
            </p>
            <p className="text-sm">
              <span className="text-muted-foreground">Montant:</span>{' '}
              <span className="font-medium">{formatCurrency(order.total_amount)}</span>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cancelReason">Raison de l'annulation *</Label>
            <Textarea
              id="cancelReason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Expliquez pourquoi cette commande doit être annulée..."
              rows={3}
            />
          </div>

          <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-800 dark:text-red-400">
              ⚠️ Cette action est irréversible. Le client et le prestataire seront notifiés de l'annulation.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Retour
          </Button>
          <Button 
            variant="destructive"
            onClick={handleSubmit} 
            disabled={loading || !reason.trim()}
          >
            {loading ? 'Annulation...' : 'Confirmer l\'annulation'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
