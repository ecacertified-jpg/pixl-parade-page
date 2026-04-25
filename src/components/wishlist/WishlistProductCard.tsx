import { memo } from "react";
import { Heart, MapPin } from "lucide-react";
import { AnimatedFavoriteButton } from "@/components/AnimatedFavoriteButton";
import type { CatalogProduct } from "@/hooks/useWishlistCatalog";

interface WishlistProductCardProps {
  product: CatalogProduct;
  isFavorite: boolean;
  onToggleFavorite: (e: React.MouseEvent, productId: string) => void;
}

function WishlistProductCardImpl({
  product,
  isFavorite,
  onToggleFavorite,
}: WishlistProductCardProps) {
  const location =
    product.location_name?.trim() ||
    product.business_accounts?.address?.trim() ||
    null;

  const handleClick = (e: React.MouseEvent) => onToggleFavorite(e, product.id);

  return (
    <div className="relative rounded-xl border bg-card overflow-hidden shadow-sm">
      {/* Heart Button */}
      <div className="absolute top-2 right-2 z-10">
        <AnimatedFavoriteButton
          isFavorite={isFavorite}
          onClick={handleClick}
          size="sm"
        />
      </div>

      {/* Clickable Image */}
      <div
        className="aspect-square bg-muted cursor-pointer relative group"
        onClick={handleClick}
      >
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Heart className="h-8 w-8 text-muted-foreground/30" />
          </div>
        )}
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
          <Heart
            className={`h-8 w-8 opacity-0 group-hover:opacity-70 transition-opacity ${
              isFavorite ? "text-pink-500 fill-pink-500" : "text-white"
            }`}
          />
        </div>
      </div>

      {/* Info */}
      <div className="p-2.5">
        <p className="text-sm font-medium truncate">{product.name}</p>
        {product.business_accounts && (
          <p className="text-xs text-muted-foreground truncate">
            {product.business_accounts.business_name}
          </p>
        )}
        {location && (
          <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{location}</span>
          </p>
        )}
        <p className="text-sm font-bold text-primary mt-1">
          {product.price.toLocaleString()} {product.currency}
        </p>
      </div>
    </div>
  );
}

/**
 * Mémoïsé pour éviter les re-renders pendant le scroll infini et le changement
 * de filtres. Comparaison stricte sur l'identité produit + favori.
 */
export const WishlistProductCard = memo(
  WishlistProductCardImpl,
  (prev, next) =>
    prev.product.id === next.product.id &&
    prev.isFavorite === next.isFavorite &&
    prev.onToggleFavorite === next.onToggleFavorite,
);