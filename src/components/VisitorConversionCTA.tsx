import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Sparkles, Cake } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VisitorConversionCTAProps {
  /** Where the visitor came from, used for acquisition tracking. */
  refSlug: string;
  /** Page kind being viewed. Tweaks copy. */
  pageKind: "birthday" | "event";
  /** For event pages, the occasion to tailor the copy ("mariage" etc.). */
  occasion?: string;
}

/**
 * Sticky bottom banner inviting unauthenticated visitors to create their own
 * page. Only render if user is unauthenticated.
 */
export function VisitorConversionCTA({
  refSlug,
  pageKind,
  occasion,
}: VisitorConversionCTAProps) {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const key = `visitor_cta_dismissed_${refSlug}`;
    if (sessionStorage.getItem(key) === "1") setDismissed(true);
  }, [refSlug]);

  if (dismissed) return null;

  const isWedding =
    pageKind === "event" && (occasion || "").toLowerCase().includes("mariage");

  const headline = isWedding
    ? "🎉 Toi aussi, crée ta page de mariage ou d'anniversaire !"
    : pageKind === "birthday"
      ? "🎂 Toi aussi, crée ta page d'anniversaire !"
      : "🎊 Toi aussi, célèbre tes moments forts !";

  const subline =
    "Reçois messages, photos souvenirs et cadeaux de tes proches. C'est gratuit.";

  const intent =
    pageKind === "birthday" || !isWedding ? "express_birthday" : "create_event_page";
  const returnTo = "/dashboard";
  const authHref = `/auth?tab=signup&returnTo=${encodeURIComponent(returnTo)}&intent=${intent}&ref=visitor_${encodeURIComponent(refSlug)}`;

  const handleClose = () => {
    sessionStorage.setItem(`visitor_cta_dismissed_${refSlug}`, "1");
    setDismissed(true);
  };

  return (
    <div
      role="region"
      aria-label="Crée ta page"
      className="fixed bottom-0 inset-x-0 z-40 px-3 pb-3 pointer-events-none"
    >
      <div className="max-w-lg mx-auto pointer-events-auto">
        <div className="rounded-2xl shadow-2xl border border-border/40 bg-gradient-to-r from-primary via-accent to-heart text-primary-foreground p-3 flex items-center gap-3 backdrop-blur-md">
          <div className="hidden sm:flex h-10 w-10 rounded-full bg-white/20 items-center justify-center flex-shrink-0">
            {pageKind === "birthday" ? (
              <Cake className="h-5 w-5" />
            ) : (
              <Sparkles className="h-5 w-5" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold leading-tight font-poppins">
              {headline}
            </div>
            <div className="text-[11px] opacity-90 leading-tight mt-0.5">
              {subline}
            </div>
          </div>
          <Button
            size="sm"
            variant="secondary"
            className="flex-shrink-0 text-xs font-semibold"
            onClick={() => navigate(authHref)}
          >
            Créer
          </Button>
          <button
            onClick={handleClose}
            aria-label="Fermer"
            className="flex-shrink-0 p-1 rounded-full hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}