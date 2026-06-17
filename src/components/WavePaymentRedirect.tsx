import { useState } from "react";
import { Check, ExternalLink, Smartphone, ArrowRight, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { WAVE_MERCHANT_URL, buildWaveMerchantLink } from "@/lib/waveConfig";

interface WavePaymentRedirectProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: number;
  currency?: string;
  onSuccess: () => void;
  /** If true, user enters amount on Wave (cagnottes). If false, amount is pre-filled. */
  freeAmount?: boolean;
}

type Step = "info" | "waiting" | "confirmed";

export function WavePaymentRedirect({
  open,
  onOpenChange,
  amount,
  currency = "F",
  onSuccess,
  freeAmount = false,
}: WavePaymentRedirectProps) {
  const [step, setStep] = useState<Step>("info");

  const waveUrl = freeAmount ? WAVE_MERCHANT_URL : buildWaveMerchantLink(amount);

  const handleOpenWave = () => {
    window.open(waveUrl, "_blank", "noopener,noreferrer");
    setStep("waiting");
  };

  const handleConfirmPayment = () => {
    setStep("confirmed");
    setTimeout(() => {
      onSuccess();
      setStep("info");
    }, 1500);
  };

  const handleClose = (value: boolean) => {
    if (!value) {
      setStep("info");
    }
    onOpenChange(value);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#1DC3C3] flex items-center justify-center">
              <Smartphone className="h-4 w-4 text-white" />
            </div>
            Paiement Wave
          </DialogTitle>
          <DialogDescription>
            Paiement sécurisé via Wave Mobile Money
          </DialogDescription>
        </DialogHeader>

        {step === "info" && (
          <div className="space-y-4 pt-2">
            {!freeAmount && (
              <div className="rounded-lg bg-muted/50 p-4 text-center">
                <p className="text-sm text-muted-foreground">Montant à payer</p>
                <p className="text-2xl font-bold text-foreground">
                  {amount.toLocaleString()} {currency}
                </p>
              </div>
            )}

            {freeAmount && (
              <div className="rounded-lg bg-muted/50 p-4 text-center">
                <p className="text-sm text-muted-foreground">
                  Vous saisirez le montant de votre choix sur la page Wave
                </p>
              </div>
            )}

            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <ArrowRight className="h-4 w-4 mt-0.5 text-[#1DC3C3] shrink-0" />
                <span>Vous serez redirigé vers Wave pour effectuer le paiement</span>
              </div>
              <div className="flex items-start gap-2">
                <ArrowRight className="h-4 w-4 mt-0.5 text-[#1DC3C3] shrink-0" />
                <span>Revenez ici après le paiement pour confirmer</span>
              </div>
            </div>

            <Button
              className="w-full bg-[#1DC3C3] hover:bg-[#19AFAF] text-white"
              onClick={handleOpenWave}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              {freeAmount
                ? "Ouvrir Wave pour payer"
                : `Payer ${amount.toLocaleString()} ${currency} via Wave`}
            </Button>
          </div>
        )}

        {step === "waiting" && (
          <div className="space-y-4 pt-2">
            <div className="flex flex-col items-center gap-3 py-4">
              <Clock className="h-10 w-10 text-[#1DC3C3] animate-pulse" />
              <p className="text-sm text-muted-foreground text-center">
                Effectuez votre paiement sur Wave, puis revenez ici pour confirmer.
              </p>
            </div>

            <Button
              className="w-full bg-[#1DC3C3] hover:bg-[#19AFAF] text-white"
              onClick={handleConfirmPayment}
            >
              <Check className="h-4 w-4 mr-2" />
              J'ai effectué le paiement
            </Button>

            <Button
              variant="outline"
              className="w-full"
              onClick={handleOpenWave}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Rouvrir Wave
            </Button>
          </div>
        )}

        {step === "confirmed" && (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="h-7 w-7 text-green-600" />
            </div>
            <div className="text-center space-y-1">
              <p className="font-semibold text-foreground">Paiement enregistré !</p>
              <p className="text-sm text-muted-foreground">
                Votre commande sera confirmée après vérification du paiement.
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
