import { toast } from "sonner";

export async function shareAlbumItem(opts: {
  slug: string;
  itemId: string;
  title?: string;
  text?: string;
}) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const url = `${origin}/birthday/${opts.slug}#album-${opts.itemId}`;
  const title = opts.title || "Album souvenir";
  const text = opts.text || "Regarde ce souvenir 💖";

  if (typeof navigator !== "undefined" && (navigator as any).share) {
    try {
      await (navigator as any).share({ title, text, url });
      return;
    } catch {
      /* user cancelled — fall through to copy */
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    toast.success("Lien copié ! Tu peux le coller où tu veux 📋");
  } catch {
    toast.error("Impossible de partager pour le moment");
  }
}