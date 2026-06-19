import { Button } from "@/components/ui/button";
import { Copy, Share2, Music2 } from "lucide-react";
import { useViralShare, ViralPageType } from "@/hooks/useViralShare";

interface Props {
  pageType: ViralPageType;
  pageId?: string | null;
  pageSlug?: string | null;
  url: string;
  /** Persuasive message that prefixes the URL when sharing. */
  text: string;
  className?: string;
  /** Optional heading shown above the buttons. */
  title?: string;
}

/**
 * Unified viral share bar (WhatsApp + TikTok + native + copy).
 * Each interaction is tracked in `viral_share_events` to feed JDV's
 * trending pages, leaderboards and growth dashboards.
 */
export function ViralShareBar({
  pageType,
  pageId,
  pageSlug,
  url,
  text,
  className,
  title = "Fais rayonner ce moment ✨",
}: Props) {
  const { shareWhatsApp, shareTikTok, shareNative, shareCopy } = useViralShare();
  const payload = { pageType, pageId, pageSlug, url, text };

  return (
    <div
      className={
        "rounded-2xl border border-border bg-gradient-to-br from-primary/5 via-accent/5 to-heart/5 p-4 " +
        (className ?? "")
      }
    >
      <div className="mb-3 flex items-center gap-2">
        <Share2 className="h-4 w-4 text-primary" />
        <h3 className="font-poppins text-sm font-semibold">{title}</h3>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Button
          size="sm"
          variant="default"
          className="bg-[#25D366] text-white hover:bg-[#1FB955]"
          onClick={() => shareWhatsApp(payload)}
          aria-label="Partager sur WhatsApp"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4 mr-1.5 fill-current" aria-hidden>
            <path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.945C.16 5.335 5.495 0 12.05 0a11.81 11.81 0 0 1 8.412 3.488 11.821 11.821 0 0 1 3.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 0 1-5.688-1.448L.057 24z" />
          </svg>
          WhatsApp
        </Button>
        <Button
          size="sm"
          variant="default"
          className="bg-black text-white hover:bg-neutral-800"
          onClick={() => shareTikTok(payload)}
          aria-label="Partager sur TikTok"
        >
          <Music2 className="h-4 w-4 mr-1.5" />
          TikTok
        </Button>
        <Button size="sm" variant="outline" onClick={() => shareNative(payload)}>
          <Share2 className="h-4 w-4 mr-1.5" />
          Partager
        </Button>
        <Button size="sm" variant="outline" onClick={() => shareCopy(payload)}>
          <Copy className="h-4 w-4 mr-1.5" />
          Copier
        </Button>
      </div>
    </div>
  );
}