import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchInspirationByToken } from "@/hooks/useInspirationItems";
import { Loader2 } from "lucide-react";

export default function InspirationRedirect() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) { navigate("/", { replace: true }); return; }
    (async () => {
      const item = await fetchInspirationByToken(token);
      if (!item) { navigate("/", { replace: true }); return; }
      // Global admin posts have no target page → land on home with modal.
      if (item.page_kind === "global" || !item.page_id) {
        navigate(`/?inspiration=${token}`, { replace: true });
        return;
      }
      // For user-authored posts we know the page kind + id but need the slug.
      // Query page slug via public views:
      try {
        const table = item.page_kind === "birthday" ? "birthday_pages" : "event_pages";
        const { supabase } = await import("@/integrations/supabase/client");
        const { data } = await (supabase as any).from(table).select("slug").eq("id", item.page_id).maybeSingle();
        const slug = data?.slug;
        if (!slug) { navigate("/", { replace: true }); return; }
        const base = item.page_kind === "birthday" ? "/birthday" : "/event";
        navigate(`${base}/${slug}?inspiration=${token}`, { replace: true });
      } catch {
        navigate("/", { replace: true });
      }
    })();
  }, [token, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );
}