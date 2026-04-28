import { memo, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, BookHeart, Cake, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useMyPublishedPages } from "@/hooks/useMyPublishedPages";

const UserPagesPage = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<{
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  } | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const { pages, loading: pagesLoading } = useMyPublishedPages(userId);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!userId) {
        setProfile(null);
        setProfileLoading(false);
        return;
      }
      setProfileLoading(true);
      const { data } = await supabase
        .from("profiles")
        .select("first_name, last_name, avatar_url")
        .eq("user_id", userId)
        .maybeSingle();
      if (!cancelled) {
        setProfile(data ?? null);
        setProfileLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const displayName =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
    "Utilisateur";
  const initials =
    (profile?.first_name?.[0] || "") + (profile?.last_name?.[0] || "");

  const goToPage = (page: { type: "birthday" | "event"; slug: string }) => {
    if (page.type === "birthday") navigate(`/birthday/${page.slug}`);
    else navigate(`/event/${page.slug}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-violet-50/30 to-rose-50/20">
      <header className="bg-card/90 backdrop-blur-md sticky top-0 z-50 border-b border-border/30 shadow-sm">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="hover:bg-muted/50"
            aria-label="Retour"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="flex-1 text-xl font-poppins font-semibold text-foreground line-clamp-1">
            Pages de {profile?.first_name || "…"}
          </h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Profile snippet */}
        <button
          onClick={() => userId && navigate(`/profile/${userId}`)}
          className="w-full flex items-center gap-3 p-3 rounded-2xl bg-card border border-border/40 hover:border-primary/30 transition-colors text-left"
        >
          <Avatar className="h-12 w-12">
            {profile?.avatar_url && (
              <AvatarImage src={profile.avatar_url} alt={displayName} />
            )}
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              {initials || "?"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground line-clamp-1">
              {displayName}
            </p>
            <p className="text-xs text-muted-foreground">
              Voir le profil complet
            </p>
          </div>
        </button>

        {/* Pages list */}
        <section>
          <h2 className="text-base font-poppins font-semibold text-foreground mb-3 flex items-center gap-2">
            <BookHeart className="h-4 w-4 text-primary" />
            Pages publiées
          </h2>

          {profileLoading || pagesLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="aspect-[4/5] w-full rounded-2xl" />
              ))}
            </div>
          ) : pages.length === 0 ? (
            <Card className="p-6 text-center bg-card/60">
              <p className="text-sm text-muted-foreground">
                {profile?.first_name || "Cet utilisateur"} n'a publié aucune
                page pour le moment.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {pages.map((page) => (
                <button
                  key={`${page.type}-${page.id}`}
                  onClick={() => goToPage(page)}
                  className="group text-left rounded-2xl overflow-hidden bg-card border border-border/50 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="relative aspect-[4/5] bg-muted">
                    {page.cover_image_url ? (
                      <img
                        src={page.cover_image_url}
                        alt={page.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
                        {page.type === "birthday" ? (
                          <Cake className="h-10 w-10 text-primary/60" />
                        ) : (
                          <Calendar className="h-10 w-10 text-primary/60" />
                        )}
                      </div>
                    )}
                    {page.year && (
                      <span className="absolute top-2 right-2 text-[10px] font-medium bg-background/85 text-foreground px-2 py-0.5 rounded-full">
                        {page.year}
                      </span>
                    )}
                  </div>
                  <div className="p-2.5">
                    <p className="text-sm font-medium text-foreground line-clamp-1">
                      {page.title}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize line-clamp-1">
                      {page.occasion ??
                        (page.type === "birthday"
                          ? "Anniversaire"
                          : "Événement")}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default memo(UserPagesPage);