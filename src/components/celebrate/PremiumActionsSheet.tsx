import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Sparkles, Zap, Crown, ExternalLink } from "lucide-react";
import {
  BOOST_OPTIONS,
  VIP_OPTIONS,
  useCelebrationPremium,
  buildWaveLink,
} from "@/hooks/useCelebrationPremium";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  postId: string;
  isAuthor: boolean;
}

export function PremiumActionsSheet({ postId, isAuthor }: Props) {
  const { createOrder } = useCelebrationPremium();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  const launch = async (
    kind: "boost" | "vip_badge",
    amount: number,
    duration_hours?: number
  ) => {
    setPending(true);
    const order = await createOrder({
      kind,
      post_id: postId,
      amount_xof: amount,
      duration_hours,
    });
    setPending(false);
    if (!order) return;
    const link = buildWaveLink(amount, order.id);
    window.open(link, "_blank", "noopener,noreferrer");
    toast.success("Commande créée — termine le paiement Wave 💸", {
      description: "L'activation se fera après validation.",
    });
    setOpen(false);
  };

  if (!isAuthor) return null;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1 text-amber-500 hover:text-amber-600"
        >
          <Sparkles className="h-4 w-4" />
          <span className="text-xs">Premium</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-poppins flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            Booster ta célébration
          </SheetTitle>
        </SheetHeader>

        {/* Boost */}
        <section className="mt-5">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <Zap className="h-4 w-4 text-celebration" />
            Mise en avant publique
          </h3>
          <p className="mb-3 text-xs text-muted-foreground">
            Ta publication est épinglée en tête du fil avec un halo doré.
          </p>
          <div className="grid grid-cols-3 gap-2">
            {BOOST_OPTIONS.map((o) => (
              <button
                key={o.hours}
                onClick={() => launch("boost", o.amount_xof, o.hours)}
                disabled={pending}
                className={cn(
                  "rounded-xl border border-celebration/30 bg-celebration/5 p-3 text-left transition-all hover:border-celebration",
                  "disabled:opacity-50"
                )}
              >
                <p className="font-semibold">{o.label}</p>
                <p className="text-xs text-muted-foreground">{o.amount_xof} F</p>
                <p className="mt-1 text-[10px] text-celebration flex items-center gap-1">
                  Wave <ExternalLink className="h-3 w-3" />
                </p>
              </button>
            ))}
          </div>
        </section>

        {/* VIP */}
        <section className="mt-6">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <Crown className="h-4 w-4 text-amber-500" />
            Badge VIP
          </h3>
          <p className="mb-3 text-xs text-muted-foreground">
            Affiche un badge doré à côté de ton nom sur toutes tes célébrations.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {VIP_OPTIONS.map((o) => (
              <button
                key={o.days}
                onClick={() => launch("vip_badge", o.amount_xof, o.days * 24)}
                disabled={pending}
                className="rounded-xl border border-amber-400/40 bg-gradient-to-br from-amber-50 to-pink-50 p-3 text-left transition-all hover:border-amber-500 disabled:opacity-50"
              >
                <p className="font-semibold">{o.label}</p>
                <p className="text-xs text-muted-foreground">{o.amount_xof} F</p>
                <p className="mt-1 text-[10px] text-amber-600 flex items-center gap-1">
                  Wave <ExternalLink className="h-3 w-3" />
                </p>
              </button>
            ))}
          </div>
        </section>

        <p className="mt-6 text-center text-[11px] text-muted-foreground">
          Le paiement Wave est validé par notre équipe. Tes options s'activent
          automatiquement après confirmation.
        </p>
      </SheetContent>
    </Sheet>
  );
}