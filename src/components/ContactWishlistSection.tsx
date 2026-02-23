import { Heart, Gift, ShoppingCart, Sparkles, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useContactWishlist, ContactWishlistItem } from "@/hooks/useContactWishlist";

interface ContactWishlistSectionProps {
  contactId: string | undefined;
  contactName?: string;
  onSelectProduct?: (product: ContactWishlistItem) => void;
  compact?: boolean;
}

const priorityConfig: Record<string, { label: string; color: string }> = {
  urgent: { label: "Urgent", color: "bg-red-100 text-red-700 border-red-200" },
  high: { label: "Prioritaire", color: "bg-orange-100 text-orange-700 border-orange-200" },
  medium: { label: "Moyen", color: "bg-blue-100 text-blue-700 border-blue-200" },
  low: { label: "Faible", color: "bg-muted text-muted-foreground border-border" },
};

const occasionLabels: Record<string, string> = {
  birthday: "Anniversaire",
  wedding: "Mariage",
  promotion: "Promotion",
  achievement: "Réussite",
  christmas: "Noël",
  valentines: "Saint-Valentin",
  other: "Autre",
};

export function ContactWishlistSection({
  contactId,
  contactName,
  onSelectProduct,
  compact = false,
}: ContactWishlistSectionProps) {
  const { wishlist, loading } = useContactWishlist(contactId);

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (wishlist.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-4 text-center">
          <Heart className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            {contactName
              ? `${contactName} n'a pas encore de liste de souhaits`
              : "Aucune liste de souhaits disponible"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Les souhaits apparaîtront ici une fois configurés
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-5 w-5 text-primary" />
          {contactName ? `Souhaits de ${contactName}` : "Liste de souhaits"}
          <Badge variant="secondary" className="ml-auto text-xs">
            {wishlist.length} article{wishlist.length > 1 ? "s" : ""}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className={compact ? "max-h-48" : "max-h-72"}>
          <div className="space-y-3">
            {wishlist.map((item) => (
              <WishlistItemCard
                key={item.id}
                item={item}
                onSelect={onSelectProduct}
                compact={compact}
              />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function WishlistItemCard({
  item,
  onSelect,
  compact,
}: {
  item: ContactWishlistItem;
  onSelect?: (item: ContactWishlistItem) => void;
  compact: boolean;
}) {
  const priority = priorityConfig[item.priority_level] || priorityConfig.medium;

  return (
    <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
      {item.product?.image_url ? (
        <img
          src={item.product.image_url}
          alt={item.product?.name || "Produit"}
          className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
        />
      ) : (
        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Gift className="h-6 w-6 text-primary" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">
          {item.product?.name || "Produit indisponible"}
        </p>

        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          <Badge variant="outline" className={`text-xs ${priority.color}`}>
            {priority.label}
          </Badge>
          {item.occasion_type && (
            <Badge variant="outline" className="text-xs">
              {occasionLabels[item.occasion_type] || item.occasion_type}
            </Badge>
          )}
          {item.accept_alternatives && (
            <span className="text-xs text-muted-foreground flex items-center gap-0.5">
              <Info className="h-3 w-3" />
              Alternatives OK
            </span>
          )}
        </div>

        {!compact && item.notes && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2 italic">
            « {item.notes} »
          </p>
        )}
      </div>

      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        {item.product && (
          <span className="text-sm font-semibold text-primary whitespace-nowrap">
            {item.product.price.toLocaleString()} {item.product.currency}
          </span>
        )}
        {onSelect && item.product && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1"
            onClick={() => onSelect(item)}
          >
            <ShoppingCart className="h-3 w-3" />
            Offrir
          </Button>
        )}
      </div>
    </div>
  );
}
