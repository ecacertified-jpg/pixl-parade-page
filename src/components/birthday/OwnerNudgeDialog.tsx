import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";

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
}: OwnerNudgeDialogProps) {
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
        <DialogFooter className="flex-col sm:flex-col gap-2 mt-2">
          <Button
            onClick={() => {
              onCta();
            }}
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