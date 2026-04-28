import { memo, useEffect, useState } from "react";
import { ArrowLeft, BookHeart, Plus, Calendar, Cake, UserPlus2, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { AccountBreadcrumb } from "@/components/breadcrumbs";
import { BirthdayCountdownCard } from "@/components/BirthdayCountdownCard";
import { BirthdayPageBuilderModal } from "@/components/BirthdayPageBuilderModal";
import { useMyPublishedPages } from "@/hooks/useMyPublishedPages";
import { useMyFriends } from "@/hooks/useMyFriends";

const MyPagesPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<{ first_name: string | null; birthday: string | null } | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);

  const { pages, loading: pagesLoading } = useMyPublishedPages();
  const { friends, loading: friendsLoading } = useMyFriends();

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!user?.id) {
        setProfile(null);
        setProfileLoading(false);
        return;
      }
      setProfileLoading(true);
      const { data } = await supabase
        .from("profiles")
        .select("first_name, birthday")
        .eq("user_id", user.id)
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
  }, [user?.id]);

  const goToPage = (page: { type: 'birthday' | 'event'; slug: string }) => {
    if (page.type === 'birthday') navigate(`/birthday/${page.slug}`);
    else navigate(`/event/${page.slug}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-violet-50/30 to-rose-50/20">
      {/* Header */}
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
          <h1 className="flex-1 text-xl font-poppins font-semibold text-foreground">
            Mes pages
          </h1>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={() => setIsBuilderOpen(true)}
            aria-label="Ajouter une page"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <AccountBreadcrumb
        currentPage="Mes pages"
        currentPath="/publications"
        icon={<BookHeart className="h-3.5 w-3.5" />}
      />

      <main className="max-w-md mx-auto px-4 py-6 space-y-8">
        {/* Birthday countdown / CTA */}
        {!profileLoading && (
          <section>
            {profile?.birthday ? (
              <BirthdayCountdownCard
                birthday={profile.birthday}
                userName={profile.first_name ?? undefined}
              />
            ) : (
              <Card className="p-5 bg-gradient-to-br from-primary/10 via-accent/10 to-gift/10 border-primary/20">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-background/80 shrink-0">
                    <Cake className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-poppins font-semibold text-foreground text-sm mb-1">
                      Active ton compte à rebours
                    </h3>
                    <p className="text-xs text-muted-foreground mb-3">
                      Ajoute ta date d'anniversaire pour voir le compte à rebours et permettre à tes proches de te souhaiter joyeusement ce jour-là.
                    </p>
                    <Button
                      size="sm"
                      onClick={() => navigate('/profile-settings')}
                      className="w-full sm:w-auto"
                    >
                      <Cake className="h-4 w-4 mr-1.5" />
                      Renseigner mon anniversaire
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </section>
        )}

        {/* My published pages */}
        <section>
          <h2 className="text-base font-poppins font-semibold text-foreground mb-3 flex items-center gap-2">
            <BookHeart className="h-4 w-4 text-primary" />
            Mes pages publiées
          </h2>

          {pagesLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="aspect-[4/5] w-full rounded-2xl" />
              ))}
            </div>
          ) : pages.length === 0 ? (
            <Card className="p-6 text-center bg-card/60">
              <p className="text-sm text-muted-foreground mb-4">
                Tu n'as encore publié aucune page.
              </p>
              <Button onClick={() => setIsBuilderOpen(true)} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Créer ma première page
              </Button>
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
                        {page.type === 'birthday' ? (
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
                      {page.occasion ?? (page.type === 'birthday' ? 'Anniversaire' : 'Événement')}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Friends in common */}
        <section>
          <h2 className="text-base font-poppins font-semibold text-foreground mb-3 flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Amis en commun
          </h2>

          {friendsLoading ? (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex flex-col items-center gap-1.5 shrink-0">
                  <Skeleton className="w-14 h-14 rounded-full" />
                  <Skeleton className="h-3 w-12" />
                </div>
              ))}
            </div>
          ) : friends.length === 0 ? (
            <Card className="p-6 text-center bg-card/60">
              <p className="text-sm text-muted-foreground mb-3">
                Aucun ami pour le moment.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/invitations')}
              >
                <UserPlus2 className="h-4 w-4 mr-1" />
                Inviter des amis
              </Button>
            </Card>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
              {friends.map((friend) => {
                const initial = (friend.first_name ?? '?').charAt(0).toUpperCase();
                return (
                  <button
                    key={friend.user_id}
                    onClick={() => navigate(`/profile/${friend.user_id}`)}
                    className="flex flex-col items-center gap-1.5 shrink-0 w-16 group"
                    aria-label={`Voir le profil de ${friend.first_name ?? 'cet ami'}`}
                  >
                    <Avatar className="w-14 h-14 ring-2 ring-transparent group-hover:ring-primary/40 transition-all">
                      {friend.avatar_url && (
                        <AvatarImage src={friend.avatar_url} alt={friend.first_name ?? 'Ami'} />
                      )}
                      <AvatarFallback className="bg-primary/10 text-primary font-medium">
                        {initial}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-foreground line-clamp-1 text-center w-full">
                      {friend.first_name ?? 'Ami'}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Builder modal — same as bottom-menu PLUS button */}
      <BirthdayPageBuilderModal
        open={isBuilderOpen}
        onOpenChange={setIsBuilderOpen}
      />
    </div>
  );
};

export default memo(MyPagesPage);