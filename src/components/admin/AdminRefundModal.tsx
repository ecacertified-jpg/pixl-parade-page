import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { AdminOrder } from '@/hooks/useAdminOrders';

interface AdminRefundModalProps {
  order: AdminOrder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefund: (orderId: string, reason: string, amount?: number) => Promise<void>;
  onRejectRefund?: (orderId: string, reason: string) => Promise<void>;
  isRejection?: boolean;
}

export function AdminRefundModal({
  order,
  open,
  onOpenChange,
  onRefund,
  onRejectRefund,
  isRejection = false
}: AdminRefundModalProps) {
  const [reason, setReason] = useState('');
  const [refundType, setRefundType] = useState<'full' | 'partial'>('full');
  const [partialAmount, setPartialAmount] = useState('');
  const [loading, setLoading] = useState(false);

  if (!order) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' XOF';
  };

  const handleSubmit = async () => {
    if (!reason.trim()) return;

    setLoading(true);
    try {
      if (isRejection && onRejectRefund) {
        await onRejectRefund(order.id, reason);
      } else {
        const amount = refundType === 'partial' ? parseFloat(partialAmount) : undefined;
        await onRefund(order.id, reason, amount);
      }
      onOpenChange(false);
      setReason('');
      setRefundType('full');
      setPartialAmount('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isRejection ? (
              <>
                <AlertCircle className="h-5 w-5 text-destructive" />
                Refuser le remboursement
              </>
            ) : (
              <>
                <RefreshCw className="h-5 w-5 text-primary" />
                Rembourser la commande
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted p-3 rounded-lg">
            <p className="text-sm">
              <span className="text-muted-foreground">Commande:</span>{' '}
              <span className="font-medium">#{order.id.slice(0, 8).toUpperCase()}</span>
            </p>
            <p className="text-sm">
              <span className="text-muted-foreground">Montant:</span>{' '}
              <span className="font-medium">{formatCurrency(order.total_amount)}</span>
            </p>
          </div>

          {!isRejection && (
            <div className="space-y-3">
              <Label>Type de remboursement</Label>
              <RadioGroup value={refundType} onValueChange={(v) => setRefundType(v as 'full' | 'partial')}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="full" id="full" />
                  <Label htmlFor="full" className="font-normal cursor-pointer">
                    Remboursement total ({formatCurrency(order.total_amount)})
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="partial" id="partial" />
                  <Label htmlFor="partial" className="font-normal cursor-pointer">
                    Remboursement partiel
                  </Label>
                </div>
              </RadioGroup>

              {refundType === 'partial' && (
                <div className="space-y-2">
                  <Label htmlFor="partialAmount">Montant à rembourser (XOF)</Label>
                  <Input
                    id="partialAmount"
                    type="number"
                    value={partialAmount}
                    onChange={(e) => setPartialAmount(e.target.value)}
                    max={order.total_amount}
                    min={1}
                    placeholder="Ex: 5000"
                  />
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="reason">
              {isRejection ? 'Raison du refus' : 'Raison du remboursement'} *
            </Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={isRejection 
                ? "Expliquez pourquoi la demande de remboursement est refusée..."
                : "Expliquez la raison du remboursement..."
              }
              rows={3}
            />
          </div>

          {!isRejection && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <p className="text-sm text-yellow-800 dark:text-yellow-400">
                ⚠️ Cette action est irréversible. Le client sera notifié du remboursement.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Annuler
          </Button>
          <Button 
            variant={isRejection ? 'destructive' : 'default'}
            onClick={handleSubmit} 
            disabled={loading || !reason.trim() || (refundType === 'partial' && !partialAmount)}
          >
            {loading ? 'Traitement...' : isRejection ? 'Refuser' : 'Confirmer le remboursement'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
