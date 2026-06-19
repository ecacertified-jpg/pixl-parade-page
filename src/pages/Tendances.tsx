import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Flame, Trophy, Sparkles, Loader2 } from "lucide-react";
import { useTrendingPages } from "@/hooks/useTrendingPages";

/**
 * Public trending feed. Lists the birthday & event pages that received
 * the most shares in the last 7 days (data from `viral_trending_pages`).
 * Drives discovery and gives every host a clear shareable leaderboard.
 */
export default function Tendances() {
  const { pages, loading } = useTrendingPages(30);

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "Tendances — Les célébrations qui font vibrer JDV";
    const meta =
      document.querySelector('meta[name="description"]') ||
      (() => {
        const m = document.createElement("meta");
        m.setAttribute("name", "description");
        document.head.appendChild(m);
        return m;
      })();
    meta.setAttribute(
      "content",
      "Découvre les anniversaires et événements les plus partagés cette semaine sur Joie De Vivre.",
    );
  }, []);

  const birthdays = pages.filter((p) => p.page_type === "birthday");
  const events = pages.filter((p) => p.page_type === "event");

  return (
    <main className="min-h-screen bg-gradient-to-b from-secondary/40 to-background pb-24">
      <header className="relative overflow-hidden bg-gradient-primary py-10 px-4 text-center text-white">
        <Flame className="mx-auto h-8 w-8 mb-2 animate-pulse" />
        <h1 className="font-poppins text-3xl font-bold">Tendances</h1>
        <p className="mt-2 text-sm text-white/90 max-w-md mx-auto">
          Les célébrations les plus partagées des 7 derniers jours 🔥
        </p>
      </header>

      <div className="container mx-auto max-w-3xl px-4 py-6 space-y-8">
        {loading && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {!loading && pages.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
            <Sparkles className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">
              Aucune tendance encore. Partage ta page pour la voir apparaître ici !
            </p>
          </div>
        )}

        {birthdays.length > 0 && (
          <Section
            icon={<Flame className="h-5 w-5 text-heart" />}
            title="🎂 Anniversaires tendances"
            items={birthdays}
            hrefPrefix="/birthday/"
          />
        )}

        {events.length > 0 && (
          <Section
            icon={<Trophy className="h-5 w-5 text-gratitude" />}
            title="🎊 Événements tendances"
            items={events}
            hrefPrefix="/event/"
          />
        )}
      </div>
    </main>
  );
}

function Section({
  icon,
  title,
  items,
  hrefPrefix,
}: {
  icon: React.ReactNode;
  title: string;
  items: ReturnType<typeof useTrendingPages>["pages"];
  hrefPrefix: string;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        {icon}
        <h2 className="font-poppins text-lg font-semibold">{title}</h2>
      </div>
      <ol className="space-y-2">
        {items.map((p, i) => (
          <li key={p.page_id}>
            <Link
              to={p.page_slug ? `${hrefPrefix}${p.page_slug}` : "#"}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition hover:bg-secondary/40"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-primary text-sm font-bold text-white">
                {i + 1}
              </span>
              {p.cover_image_url ? (
                <img
                  src={p.cover_image_url}
                  alt=""
                  className="h-12 w-12 rounded-lg object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="h-12 w-12 rounded-lg bg-secondary" />
              )}
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium text-sm">
                  {p.title || "Célébration"}
                </div>
                <div className="text-xs text-muted-foreground">
                  🔥 {p.share_count_7d} partage{p.share_count_7d > 1 ? "s" : ""} cette semaine
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}