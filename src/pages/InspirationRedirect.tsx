import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchInspirationByToken, type InspirationItem } from "@/hooks/useInspirationItems";
import { InspirationDetailModal } from "@/components/inspiration/InspirationDetailModal";
import { Loader2 } from "lucide-react";

/**
 * Short public URL for an inspiration item (`/inspiration/:token`).
 *
 * - Birthday/event items → redirect to the host page with `?inspiration=<token>`
 *   so the existing modal opens in context.
 * - Global admin posts (or items whose host page can't be resolved) → render a
 *   standalone page that opens the detail modal directly, so users landing
 *   from a shared link always see the item.
 */
export default function InspirationRedirect() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [standaloneItem, setStandaloneItem] = useState<InspirationItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!token) { navigate("/", { replace: true }); return; }
    let cancelled = false;
    (async () => {
      const item = await fetchInspirationByToken(token);
      if (cancelled) return;
      if (!item) { setNotFound(true); setLoading(false); return; }

      // Global admin post OR no host page → standalone modal view.
      if (item.page_kind === "global" || !item.page_id) {
        setStandaloneItem(item);
        setLoading(false);
        return;
      }

      // User-authored: resolve host page slug then redirect in context.
      try {
        const table = item.page_kind === "birthday" ? "birthday_pages" : "event_pages";
        const { supabase } = await import("@/integrations/supabase/client");
        const { data } = await (supabase as any)
          .from(table)
          .select("slug")
          .eq("id", item.page_id)
          .maybeSingle();
        const slug = data?.slug;
        if (!slug) {
          // Fallback: show standalone rather than kicking to home.
          setStandaloneItem(item);
          setLoading(false);
          return;
        }
        const base = item.page_kind === "birthday" ? "/birthday" : "/event";
        navigate(`${base}/${slug}?inspiration=${token}`, { replace: true });
      } catch {
        setStandaloneItem(item);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [token, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-background p-6 text-center">
        <h1 className="text-lg font-semibold">Inspiration introuvable</h1>
        <p className="text-sm text-muted-foreground">Ce lien n'est plus disponible.</p>
        <button
          type="button"
          onClick={() => navigate("/", { replace: true })}
          className="mt-2 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
        >
          Retour à l'accueil
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <InspirationDetailModal
        item={standaloneItem}
        open={!!standaloneItem}
        onOpenChange={(o) => { if (!o) navigate("/", { replace: true }); }}
        onBrowseMore={() => navigate("/", { replace: true })}
      />
    </div>
  );
}