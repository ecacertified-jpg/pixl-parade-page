import { useEffect, useState } from 'react';
import { Copy, ExternalLink, Loader2, Smartphone, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useCreateWaveRequest } from './useWaveCheckout';

interface Props {
  open: boolean;
  onClose: () => void;
  planTier: 'essentiel' | 'premium';
  planName: string;
  billingCycle: 'monthly' | 'yearly';
  amountXof: number;
}

export function WaveCheckoutModal({ open, onClose, planTier, planName, billingCycle, amountXof }: Props) {
  const createReq = useCreateWaveRequest();
  const [step, setStep] = useState<'review' | 'pay'>('review');
  const [createdRequestId, setCreatedRequestId] = useState<string | null>(null);
  const [waveLink, setWaveLink] = useState<string | null>(null);
  const [recipient, setRecipient] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setStep('review');
      setCreatedRequestId(null);
      setWaveLink(null);
      setRecipient(null);
    }
  }, [open]);

  const handleStartPayment = async () => {
    try {
      const res = await createReq.mutateAsync({ plan_tier: planTier, billing_cycle: billingCycle });
      setCreatedRequestId(res.request_id);
      setWaveLink(res.wave_link);
      setRecipient(res.wave_recipient);
      setStep('pay');
    } catch (e: any) {
      toast.error(e?.message || 'Impossible de créer la demande');
    }
  };

  const handleCopy = (value: string, label: string) => {
    navigator.clipboard.writeText(value);
    toast.success(`${label} copié`);
  };

  const handleDone = () => {
    toast.success('Demande enregistrée — on vérifie ton paiement sous 24h 💛');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-poppins">
            <Smartphone className="h-5 w-5 text-primary" />
            Payer avec Wave
          </DialogTitle>
          <DialogDescription>
            Plan <Badge variant="secondary">{planName}</Badge> · {billingCycle === 'yearly' ? 'Annuel' : 'Mensuel'}
          </DialogDescription>
        </DialogHeader>

        {step === 'review' ? (
          <div className="space-y-4">
            <div className="rounded-2xl border bg-gradient-to-br from-primary/5 via-background to-accent/10 p-5 text-center">
              <p className="text-sm text-muted-foreground">Montant à payer</p>
              <p className="font-poppins text-3xl font-bold text-foreground">
                {new Intl.NumberFormat('fr-FR').format(amountXof)} FCFA
              </p>
            </div>

            <ol className="space-y-2 text-sm text-foreground/80">
              <li>1. Clique sur « Démarrer le paiement Wave »</li>
              <li>2. Tu es redirigé vers Wave avec le montant pré-rempli</li>
              <li>3. Reviens valider — un admin confirme sous 24h max</li>
            </ol>

            <Button className="w-full" onClick={handleStartPayment} disabled={createReq.isPending}>
              {createReq.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Préparation…
                </>
              ) : (
                'Démarrer le paiement Wave'
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-2xl border bg-gradient-to-br from-primary/5 via-background to-accent/10 p-5 text-center">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Montant exact</p>
              <button
                onClick={() => handleCopy(String(amountXof), 'Montant')}
                className="mt-1 inline-flex items-center gap-2 font-poppins text-2xl font-bold text-foreground hover:text-primary"
              >
                {new Intl.NumberFormat('fr-FR').format(amountXof)} FCFA
                <Copy className="h-4 w-4" />
              </button>
            </div>

            {waveLink && (
              <Button asChild className="w-full" variant="default">
                <a href={waveLink} target="_blank" rel="noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" /> Ouvrir Wave
                </a>
              </Button>
            )}

            <p className="text-center text-xs text-muted-foreground">
              Une fois le paiement effectué, clique ci-dessous. Nous validons sous 24h.
            </p>

            <Button variant="secondary" className="w-full" onClick={handleDone}>
              <Check className="mr-2 h-4 w-4" /> J'ai payé
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}