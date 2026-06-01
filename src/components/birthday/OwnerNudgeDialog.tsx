import { useState } from "react";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { LucideIcon, Copy, Check } from "lucide-react";

interface OwnerNudgeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  icon: LucideIcon;
  iconBgClass?: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaIcon?: LucideIcon;
  onCta: () => void;
  secondaryLabel?: string;
  shareUrl?: string;
  shareText?: string;
}

export function OwnerNudgeDialog({
  open,
  onOpenChange,
  icon: Icon,
  iconBgClass = "bg-gradient-to-br from-primary to-accent",
  title,
  description,
  ctaLabel,
  ctaIcon: CtaIcon,
  onCta,
  secondaryLabel = "Plus tard",
  shareUrl,
  shareText,
}: OwnerNudgeDialogProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    const fullText = shareText ? `${shareText}\n\n${shareUrl}` : shareUrl;
    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      toast.success("Lien copié ! Tu peux le coller où tu veux 📋");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Impossible de copier le lien");
    }
  };

  const handleCta = () => {
    if (shareUrl) {
      handleCopyLink();
    }
    onCta();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader className="items-center text-center">
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200 }}
            className={`mx-auto w-16 h-16 rounded-full ${iconBgClass} flex items-center justify-center mb-2 shadow-lg`}
          >
            <Icon className="h-8 w-8 text-white" />
          </motion.div>
          <DialogTitle className="text-xl font-poppins font-bold text-center">
            {title}
          </DialogTitle>
          <DialogDescription className="text-center font-nunito text-sm leading-relaxed">
            {description}
          </DialogDescription>
        </DialogHeader>

        {shareUrl && (
          <div className="mt-1 space-y-2">
            <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 bg-transparent text-xs text-muted-foreground truncate outline-none"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 shrink-0"
                onClick={handleCopyLink}
                aria-label="Copier le lien"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-[11px] text-center text-muted-foreground">
              Copie ce lien et envoie-le à tes amis sur WhatsApp, Facebook, Instagram…
            </p>
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-col gap-2 mt-2">
          <Button
            onClick={handleCta}
            className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 gap-2"
            size="lg"
          >
            {CtaIcon && <CtaIcon className="h-4 w-4" />}
            {ctaLabel}
          </Button>
          <Button
            onClick={() => onOpenChange(false)}
            variant="ghost"
            className="w-full text-sm text-muted-foreground"
          >
            {secondaryLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}