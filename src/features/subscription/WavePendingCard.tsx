import { Clock, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useCancelWaveRequest, WaveRequest } from './useWaveCheckout';

export function WavePendingCard({ request }: { request: WaveRequest }) {
  const cancel = useCancelWaveRequest();

  const handleCancel = async () => {
    if (!confirm('Annuler ta demande Wave ?')) return;
    try {
      await cancel.mutateAsync(request.id);
      toast.success('Demande annulée');
    } catch (e: any) {
      toast.error(e?.message || 'Erreur lors de l\'annulation');
    }
  };

  return (
    <Card className="border-amber-200 bg-amber-50/50 p-5 dark:bg-amber-950/20">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900">
          <Clock className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-poppins font-semibold">Paiement en cours de vérification</h3>
            <Badge variant="secondary" className="capitalize">{request.plan_tier}</Badge>
          </div>
          <p className="mt-1 text-sm text-foreground/70">
            {new Intl.NumberFormat('fr-FR').format(request.amount_xof)} FCFA · {request.billing_cycle === 'yearly' ? 'Annuel' : 'Mensuel'}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Un admin valide ton paiement sous 24h max. Tu recevras une notification WhatsApp dès activation.
          </p>
          {request.wave_link && (
            <a href={request.wave_link} target="_blank" rel="noreferrer" className="mt-3 inline-block text-xs text-primary underline">
              Rouvrir le lien Wave
            </a>
          )}
          <div className="mt-3">
            <Button size="sm" variant="ghost" onClick={handleCancel} disabled={cancel.isPending}>
              <X className="mr-1 h-3 w-3" /> Annuler la demande
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}