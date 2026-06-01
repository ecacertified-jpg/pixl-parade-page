import { useNavigate } from "react-router-dom";
import { Sparkles, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMyPublishedPages } from "@/hooks/useMyPublishedPages";

interface MyOtherPagesSectionProps {
  ownerUserId: string;
  ownerFirstName: string;
  currentPageId: string;
  /** Show the "+ Add event page" button (only for the owner). */
  showAddButton: boolean;
}

/**
 * Horizontal carousel of all other published pages by the same creator.
 * Renders nothing if there are no other pages and the add button is hidden.
 */
export function MyOtherPagesSection({
  ownerUserId,
  ownerFirstName,
  currentPageId,
  showAddButton,
}: MyOtherPagesSectionProps) {
  const navigate = useNavigate();
  const { pages, loading } = useMyPublishedPages(ownerUserId);

  const others = pages.filter((p) => p.id !== currentPageId);

  if (loading) return null;
  if (others.length === 0 && !showAddButton) return null;

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-5 w-5 text-accent" />
        <h2 className="font-bold font-poppins text-base">
          Les autres pages de {ownerFirstName}
        </h2>
      </div>

      {others.length > 0 ? (
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x">
          {others.map((p) => (
            <button
              key={p.id}
              onClick={() =>
                navigate(
                  p.type === "birthday"
                    ? `/birthday/${p.slug}`
                    : `/event/${p.slug}`,
                )
              }
              className="flex-shrink-0 w-32 snap-start text-left group"
            >
              <div className="relative w-32 h-40 rounded-lg overflow-hidden bg-muted">
                {p.cover_image_url ? (
                  <img
                    src={p.cover_image_url}
                    alt={p.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-3xl">
                    {p.type === "birthday" ? "🎂" : "🎊"}
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                  <div className="text-[10px] text-white/80 uppercase tracking-wide">
                    {p.occasion}
                  </div>
                  <div className="text-xs font-semibold text-white truncate">
                    {p.title}
                  </div>
                </div>
              </div>
            </button>
          ))}

          {showAddButton && (
            <button
              onClick={() => navigate("/event/create")}
              className="flex-shrink-0 w-32 h-40 rounded-lg border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary"
            >
              <Plus className="h-6 w-6" />
              <span className="text-xs font-medium text-center px-2">
                Nouvelle page d'événement
              </span>
            </button>
          )}
        </div>
      ) : showAddButton ? (
        <Button
          variant="outline"
          className="w-full border-dashed"
          onClick={() => navigate("/event/create")}
        >
          <Plus className="h-4 w-4 mr-2" />
          Créer une page d'événement (mariage, diplôme, promotion…)
        </Button>
      ) : null}
    </Card>
  );
}