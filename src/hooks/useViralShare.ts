import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const sb = supabase as any;

export type ViralChannel =
  | "whatsapp"
  | "tiktok"
  | "clipboard"
  | "native"
  | "card"
  | "video"
  | "facebook"
  | "x"
  | "instagram";

export type ViralPageType = "birthday" | "event" | "profile" | "fund";

interface SharePayload {
  pageType: ViralPageType;
  pageId?: string | null;
  pageSlug?: string | null;
  url: string;
  text: string;
}

/**
 * Centralised viral sharing hook for JDV. Logs every share intent in
 * `viral_share_events` so we can power trending pages and leaderboards.
 *
 * - WhatsApp → opens wa.me with the persuasive message + URL.
 * - TikTok   → copies the full text/URL then opens the TikTok upload page
 *              so the user can paste it in the caption of a new video.
 * - Native   → uses the OS share sheet if available, otherwise clipboard.
 */
export function useViralShare() {
  const { user } = useAuth();

  const logEvent = useCallback(
    async (channel: ViralChannel, p: SharePayload) => {
      try {
        await sb.from("viral_share_events").insert({
          sharer_user_id: user?.id ?? null,
          channel,
          page_type: p.pageType,
          page_id: p.pageId ?? null,
          page_slug: p.pageSlug ?? null,
        });
      } catch {
        // tracking is best-effort
      }
    },
    [user?.id],
  );

  const shareWhatsApp = useCallback(
    (p: SharePayload) => {
      const msg = `${p.text}\n${p.url}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
      logEvent("whatsapp", p);
    },
    [logEvent],
  );

  const shareTikTok = useCallback(
    async (p: SharePayload) => {
      const full = `${p.text}\n${p.url}`;
      try {
        await navigator.clipboard.writeText(full);
        toast.success("Texte copié ✨", {
          description: "Colle-le dans la légende de ta vidéo TikTok",
        });
      } catch {
        toast.message("Copie le lien manuellement");
      }
      window.open("https://www.tiktok.com/upload?lang=fr", "_blank");
      logEvent("tiktok", p);
    },
    [logEvent],
  );

  const shareNative = useCallback(
    async (p: SharePayload) => {
      const data = { title: "Joie De Vivre", text: p.text, url: p.url };
      if (typeof navigator !== "undefined" && "share" in navigator) {
        try {
          await (navigator as any).share(data);
          logEvent("native", p);
          return;
        } catch (err: any) {
          if (err?.name === "AbortError") return;
        }
      }
      try {
        await navigator.clipboard.writeText(`${p.text}\n${p.url}`);
        toast.success("Lien copié 💛");
        logEvent("clipboard", p);
      } catch {
        toast.error("Impossible de partager");
      }
    },
    [logEvent],
  );

  const shareCopy = useCallback(
    async (p: SharePayload) => {
      try {
        await navigator.clipboard.writeText(`${p.text}\n${p.url}`);
        toast.success("Lien copié 💛");
        logEvent("clipboard", p);
      } catch {
        toast.error("Impossible de copier");
      }
    },
    [logEvent],
  );

  return { shareWhatsApp, shareTikTok, shareNative, shareCopy, logEvent };
}