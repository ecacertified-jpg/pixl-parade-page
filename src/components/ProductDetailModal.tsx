import { useState } from "react";
import { Heart, Store, MapPin, Tag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductRatingDisplay } from "@/components/ProductRatingDisplay";
import { RatingModal } from "@/components/RatingModal";
import { ImageGallery } from "@/components/ImageGallery";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useNavigate } from "react-router-dom";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
interface Product {
  id: string | number;
  name: string;
  description: string;
  price: number;
  currency: string;
  image: string;
  images?: string[];
  category: string;
  vendor: string;
  vendorId: string | null;
  vendorLogo: string | null;
  rating: number;
  reviews: number;
  inStock: boolean;
  isExperience?: boolean;
  categoryName?: string;
  locationName?: string;
}

interface ProductDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onOrder: () => void;
  onToggleFavorite: () => void;
  isFavorite: boolean;
}

export function ProductDetailModal({
  isOpen,
  onClose,
  product,
  onOrder,
  onToggleFavorite,
  isFavorite,
}: ProductDetailModalProps) {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);

  if (!product) return null;

  const ModalContent = () => (
    <div className="flex flex-col max-h-[85vh] overflow-hidden">
      {/* Image Gallery Section */}
      <div className="relative flex-shrink-0">
        <ImageGallery
          images={product.images?.length ? product.images : [product.image]}
          alt={product.name}
          className="w-full h-56 sm:h-64 object-cover"
        />
        {product.isExperience && (
          <Badge className="absolute top-3 left-3 bg-purple-600 text-white z-40 pointer-events-none">
            ✨ EXPÉRIENCE
          </Badge>
        )}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "absolute top-3 right-3 bg-white/90 hover:bg-white rounded-full h-10 w-10 shadow-md z-40",
            isFavorite && "text-destructive"
          )}
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
        >
          <Heart
            className={cn(
              "h-5 w-5 transition-all",
              isFavorite && "fill-current"
            )}
          />
        </Button>
        {/* Close button for mobile */}
        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 left-3 bg-white/90 hover:bg-white rounded-full h-10 w-10 shadow-md z-40"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Content Section */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {/* Header: Name & Vendor */}
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground leading-tight">
              {product.name}
            </h2>
          </div>
          
          {/* Vendor Badge */}
          <Badge
            variant="outline"
            className={cn(
              "text-sm font-normal flex items-center gap-2 py-1.5 px-3 w-fit",
              product.vendorId && "cursor-pointer hover:bg-primary/10 hover:border-primary transition-colors"
            )}
            onClick={(e) => {
              if (product.vendorId) {
                e.stopPropagation();
                onClose();
                navigate(`/boutique/${product.vendorId}`);
              }
            }}
          >
            {product.vendorLogo ? (
              <img
                src={product.vendorLogo}
                alt={product.vendor}
                className="w-5 h-5 rounded-full object-cover"
              />
            ) : (
              <Store className="h-4 w-4 text-muted-foreground" />
            )}
            <span>{product.vendor}</span>
          </Badge>
        </div>

        {/* Price & Stock */}
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-primary">
            {product.isExperience && "À partir de "}
            {product.price.toLocaleString()} {product.currency}
          </span>
          <Badge variant={product.inStock ? "default" : "secondary"} className="text-sm">
            {product.inStock
              ? product.isExperience
                ? "Disponible"
                : "En stock"
              : "Épuisé"}
          </Badge>
        </div>

        {/* Rating */}
        <div className="py-2 border-y border-border">
          <ProductRatingDisplay
            productId={String(product.id)}
            onWriteReview={() => setIsRatingModalOpen(true)}
            compact={false}
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <h3 className="font-semibold text-foreground">Description</h3>
          <p className="text-muted-foreground leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Additional Info */}
        <div className="space-y-3 bg-muted/50 rounded-lg p-4">
          {product.categoryName && (
            <div className="flex items-center gap-3 text-sm">
              <Tag className="h-4 w-4 text-primary flex-shrink-0" />
              <span className="text-muted-foreground">Catégorie:</span>
              <span className="font-medium text-foreground">{product.categoryName}</span>
            </div>
          )}
          {product.locationName && product.locationName !== "Non spécifié" && (
            <div className="flex items-center gap-3 text-sm">
              <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
              <span className="text-muted-foreground">Lieu:</span>
              <span className="font-medium text-foreground">{product.locationName}</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer: Order Button */}
      <div className="flex-shrink-0 p-4 sm:p-6 pt-0 border-t bg-background">
        <Button
          className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-semibold py-6"
          onClick={onOrder}
          disabled={!product.inStock}
        >
          {product.isExperience ? "Réserver cette expérience" : "Commander ce produit"}
        </Button>
      </div>

      {/* Rating Modal */}
      <RatingModal
        isOpen={isRatingModalOpen}
        onClose={() => setIsRatingModalOpen(false)}
        productId={String(product.id)}
        productName={product.name}
      />
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DrawerContent className="max-h-[95vh]">
          <VisuallyHidden>
            <DrawerTitle>{product.name}</DrawerTitle>
          </VisuallyHidden>
          <ModalContent />
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        <VisuallyHidden>
          <DialogTitle>{product.name}</DialogTitle>
        </VisuallyHidden>
        <ModalContent />
      </DialogContent>
    </Dialog>
  );
}
