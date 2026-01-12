import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Clock, CheckCircle, Truck, Package } from 'lucide-react';
import { AdminOrder, getOrderStatusLabel } from '@/hooks/useAdminOrders';

interface AdminUpdateStatusModalProps {
  order: AdminOrder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateStatus: (orderId: string, newStatus: string, reason?: string) => Promise<void>;
  availableStatuses: string[];
}

const statusIcons: Record<string, any> = {
  confirmed: CheckCircle,
  processed: Package,
  delivered: Truck
};

export function AdminUpdateStatusModal({
  order,
  open,
  onOpenChange,
  onUpdateStatus,
  availableStatuses
}: AdminUpdateStatusModalProps) {
  const [selectedStatus, setSelectedStatus] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  if (!order || availableStatuses.length === 0) return null;

  const handleSubmit = async () => {
    if (!selectedStatus) return;

    setLoading(true);
    try {
      await onUpdateStatus(order.id, selectedStatus, note || undefined);
      onOpenChange(false);
      setSelectedStatus('');
      setNote('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Modifier le statut
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted p-3 rounded-lg">
            <p className="text-sm">
              <span className="text-muted-foreground">Commande:</span>{' '}
              <span className="font-medium">#{order.id.slice(0, 8).toUpperCase()}</span>
            </p>
            <p className="text-sm">
              <span className="text-muted-foreground">Statut actuel:</span>{' '}
              <span className="font-medium">{getOrderStatusLabel(order.status)}</span>
            </p>
          </div>

          <div className="space-y-3">
            <Label>Nouveau statut</Label>
            <RadioGroup value={selectedStatus} onValueChange={setSelectedStatus}>
              {availableStatuses.map((status) => {
                const Icon = statusIcons[status] || CheckCircle;
                return (
                  <div key={status} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-muted/50">
                    <RadioGroupItem value={status} id={status} />
                    <Label htmlFor={status} className="flex items-center gap-2 font-normal cursor-pointer flex-1">
                      <Icon className="h-4 w-4 text-primary" />
                      {getOrderStatusLabel(status)}
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Note (optionnel)</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ajouter une note pour cette modification..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !selectedStatus}>
            {loading ? 'Mise à jour...' : 'Mettre à jour'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
