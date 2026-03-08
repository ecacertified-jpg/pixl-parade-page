import { useState } from "react";
import { Check, Loader2, Smartphone } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface WavePaymentSimulationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: number;
  currency?: string;
  onSuccess: () => void;
}

type Step = "phone" | "processing" | "success";

export function WavePaymentSimulation({
  open,
  onOpenChange,
  amount,
  currency = "F",
  onSuccess,
}: WavePaymentSimulationProps) {
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");

  const handlePay = () => {
    setStep("processing");
    setTimeout(() => {
      setStep("success");
    }, 2000);
  };

  const handleConfirm = () => {
    setStep("phone");
    setPhone("");
    onSuccess();
  };

  const handleClose = (value: boolean) => {
    if (!value) {
      setStep("phone");
      setPhone("");
    }
    onOpenChange(value);
  };

  const isPhoneValid = phone.replace(/\D/g, "").length >= 8;

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
          <DialogDescription className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs border-amber-500 text-amber-600">
              Mode simulation
            </Badge>
            <span>Paiement sécurisé via Wave</span>
          </DialogDescription>
        </DialogHeader>

        {step === "phone" && (
          <div className="space-y-4 pt-2">
            <div className="rounded-lg bg-muted/50 p-4 text-center">
              <p className="text-sm text-muted-foreground">Montant à payer</p>
              <p className="text-2xl font-bold text-foreground">
                {amount.toLocaleString()} {currency}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="wave-phone">Numéro Wave</Label>
              <Input
                id="wave-phone"
                type="tel"
                inputMode="numeric"
                placeholder="07 07 07 07 07"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <Button
              className="w-full bg-[#1DC3C3] hover:bg-[#19AFAF] text-white"
              disabled={!isPhoneValid}
              onClick={handlePay}
            >
              Payer {amount.toLocaleString()} {currency}
            </Button>
          </div>
        )}

        {step === "processing" && (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="h-10 w-10 animate-spin text-[#1DC3C3]" />
            <p className="text-sm text-muted-foreground">Traitement en cours…</p>
          </div>
        )}

        {step === "success" && (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="h-7 w-7 text-green-600" />
            </div>
            <div className="text-center space-y-1">
              <p className="font-semibold text-foreground">Paiement réussi !</p>
              <p className="text-sm text-muted-foreground">
                {amount.toLocaleString()} {currency} débités de votre compte Wave.
              </p>
            </div>
            <Button className="w-full" onClick={handleConfirm}>
              Continuer
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
