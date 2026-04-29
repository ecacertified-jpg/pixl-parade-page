import { memo } from "react";
import { ExternalLink, Globe, Trash2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ExternalFavorite } from "@/hooks/useExternalFavorites";

interface ExternalFavoriteCardProps {
  favorite: ExternalFavorite;
  onRemove: (id: string) => void;
  onCreateFund: (favorite: ExternalFavorite) => void;
}

function ExternalFavoriteCardImpl({ favorite, onRemove, onCreateFund }: ExternalFavoriteCardProps) {
  return (
    <div className="relative rounded-xl border bg-card overflow-hidden shadow-sm flex flex-col">
      {/* Platform badge */}
      <div className="absolute top-2 left-2 z-10">
        <Badge className="bg-orange-500 hover:bg-orange-600 text-white text-[10px] gap-1 px-2 py-0.5">
          <Globe className="h-3 w-3" />
          {favorite.platform}
        </Badge>
      </div>

      {/* Remove button */}
      <button
        type="button"
        aria-label="Retirer de mes souhaits"
        onClick={() => onRemove(favorite.id)}
        className="absolute top-2 right-2 z-10 h-7 w-7 rounded-full bg-background/90 border flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-colors"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>

      {/* Image */}
      <a
        href={favorite.external_url}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className="aspect-square bg-muted block"
      >
        {favorite.image_url ? (
          <img
            src={favorite.image_url}
            alt={favorite.product_name}
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Globe className="h-10 w-10 text-muted-foreground/40" />
          </div>
        )}
      </a>

      {/* Info */}
      <div className="p-2.5 flex flex-col gap-1.5 flex-1">
        <p className="text-sm font-medium line-clamp-2">{favorite.product_name}</p>
        <a
          href={favorite.external_url}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="text-[11px] text-muted-foreground hover:text-primary inline-flex items-center gap-1"
        >
          <ExternalLink className="h-3 w-3" />
          Voir sur {favorite.platform}
        </a>
        <p className="text-sm font-bold text-primary mt-auto">
          {favorite.estimated_price.toLocaleString()} {favorite.currency}
        </p>
        <Button
          type="button"
          size="sm"
          className="w-full gap-1.5 h-8 text-xs"
          onClick={() => onCreateFund(favorite)}
        >
          <Sparkles className="h-3.5 w-3.5" />
          Lancer une cagnotte
        </Button>
      </div>
    </div>
  );
}

export const ExternalFavoriteCard = memo(ExternalFavoriteCardImpl);