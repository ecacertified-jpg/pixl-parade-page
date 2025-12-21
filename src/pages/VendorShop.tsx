import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ShoppingCart, Heart, Star, MapPin, Phone, Mail, Clock, Store, Package, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { OrderModal } from "@/components/OrderModal";
import { ProductRatingDisplay } from "@/components/ProductRatingDisplay";
import { RatingModal } from "@/components/RatingModal";
import { useVendorProducts } from "@/hooks/useVendorProducts";
import { useCart } from "@/hooks/useCart";
import { useFavorites } from "@/hooks/useFavorites";
import { VendorReviewsSection } from "@/components/VendorReviewsSection";
import { cn } from "@/lib/utils";

export default function VendorShop() {
  const { businessId } = useParams<{ businessId: string }>();
  const navigate = useNavigate();
  const { products, vendor, loading, error } = useVendorProducts(businessId);
  const { itemCount } = useCart();
  const { isFavorite, getFavoriteId, addFavorite, removeFavorite, stats } = useFavorites();

  const [activeTab, setActiveTab] = useState<"products" | "experiences">("products");
  const [selectedProduct, setSelectedProduct] = useState<typeof products[0] | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [ratingProductId, setRatingProductId] = useState("");
  const [ratingProductName, setRatingProductName] = useState("");

  const filteredProducts = products.filter(p => p.isExperience === (activeTab === "experiences"));
  const productCount = products.filter(p => !p.isExperience).length;
  const experienceCount = products.filter(p => p.isExperience).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-background">
        <header className="bg-card/80 backdrop-blur-sm sticky top-0 z-50 border-b border-border/50">
          <div className="max-w-md mx-auto px-4 py-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded" />
              <Skeleton className="h-6 w-32" />
            </div>
          </div>
        </header>
        <main className="max-w-md mx-auto px-4 py-6 space-y-4">
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </main>
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="min-h-screen bg-gradient-background flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-sm">
          <Store className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Boutique introuvable</h2>
          <p className="text-muted-foreground mb-4">
            Cette boutique n'existe pas ou n'est plus disponible.
          </p>
          <Button onClick={() => navigate('/shop')}>
            Retour à la boutique
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-background">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm sticky top-0 z-50 border-b border-border/50">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/shop')} className="p-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarImage src={vendor.logoUrl || undefined} alt={vendor.businessName} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {vendor.businessName.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <h1 className="text-lg font-bold truncate">{vendor.businessName}</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="relative" onClick={() => navigate('/favorites')}>
                <Heart className="h-4 w-4" />
                {stats.total > 0 && (
                  <Badge className="absolute -top-1 -right-1 bg-destructive text-white text-xs w-5 h-5 flex items-center justify-center p-0">
                    {stats.total}
                  </Badge>
                )}
              </Button>
              <Button variant="ghost" size="sm" className="relative" onClick={() => navigate('/cart')}>
                <ShoppingCart className="h-4 w-4" />
                {itemCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 bg-primary text-white text-xs w-5 h-5 flex items-center justify-center p-0">
                    {itemCount}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Vendor Header Card */}
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-primary/20 to-secondary/20 p-6">
            <div className="flex items-start gap-4">
              <Avatar className="h-20 w-20 border-4 border-background shadow-lg">
                <AvatarImage src={vendor.logoUrl || undefined} alt={vendor.businessName} />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  {vendor.businessName.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold mb-1">{vendor.businessName}</h2>
                {vendor.businessType && (
                  <Badge variant="secondary" className="mb-2">
                    {vendor.businessType}
                  </Badge>
                )}
                {vendor.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {vendor.description}
                  </p>
                )}
              </div>
            </div>
          </div>
          
          {/* Contact & Info */}
          <div className="p-4 space-y-3">
            {vendor.address && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{vendor.address}</span>
              </div>
            )}
            {vendor.phone && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4 flex-shrink-0" />
                <a href={`tel:${vendor.phone}`} className="hover:text-primary transition-colors">
                  {vendor.phone}
                </a>
              </div>
            )}
            {vendor.email && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <a href={`mailto:${vendor.email}`} className="hover:text-primary transition-colors truncate">
                  {vendor.email}
                </a>
              </div>
            )}
            
            {/* Stats */}
            <div className="flex items-center gap-4 pt-2 border-t border-border/50">
              <div className="flex items-center gap-1 text-sm">
                <Package className="h-4 w-4 text-primary" />
                <span className="font-medium">{productCount}</span>
                <span className="text-muted-foreground">produits</span>
              </div>
              {experienceCount > 0 && (
                <div className="flex items-center gap-1 text-sm">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  <span className="font-medium">{experienceCount}</span>
                  <span className="text-muted-foreground">expériences</span>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Customer Reviews Section */}
        <VendorReviewsSection businessId={businessId!} />

        {/* Products/Experiences Tabs */}
        <Tabs
          defaultValue="products" 
          onValueChange={(v) => setActiveTab(v as "products" | "experiences")}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Produits ({productCount})
            </TabsTrigger>
            <TabsTrigger value="experiences" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Expériences ({experienceCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="mt-4">
            {productCount === 0 ? (
              <Card className="p-8 text-center">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">Aucun produit disponible pour le moment</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredProducts.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    isFavorite={isFavorite(product.id)}
                    onToggleFavorite={async () => {
                      if (isFavorite(product.id)) {
                        const favId = getFavoriteId(product.id);
                        if (favId) await removeFavorite(favId);
                      } else {
                        await addFavorite(product.id);
                      }
                    }}
                    onOrder={() => {
                      setSelectedProduct(product);
                      setIsOrderModalOpen(true);
                    }}
                    onRate={() => {
                      setRatingProductId(product.id);
                      setRatingProductName(product.name);
                      setIsRatingModalOpen(true);
                    }}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="experiences" className="mt-4">
            {experienceCount === 0 ? (
              <Card className="p-8 text-center">
                <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">Aucune expérience disponible pour le moment</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredProducts.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    isFavorite={isFavorite(product.id)}
                    onToggleFavorite={async () => {
                      if (isFavorite(product.id)) {
                        const favId = getFavoriteId(product.id);
                        if (favId) await removeFavorite(favId);
                      } else {
                        await addFavorite(product.id);
                      }
                    }}
                    onOrder={() => {
                      setSelectedProduct(product);
                      setIsOrderModalOpen(true);
                    }}
                    onRate={() => {
                      setRatingProductId(product.id);
                      setRatingProductName(product.name);
                      setIsRatingModalOpen(true);
                    }}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="pb-20" />
      </main>

      {/* Modals */}
      <OrderModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        product={selectedProduct ? {
          id: selectedProduct.id,
          name: selectedProduct.name,
          description: selectedProduct.description,
          price: selectedProduct.price,
          currency: selectedProduct.currency,
          image: selectedProduct.image,
          vendor: selectedProduct.vendor,
          locationName: selectedProduct.locationName
        } : null}
      />

      <RatingModal
        isOpen={isRatingModalOpen}
        onClose={() => {
          setIsRatingModalOpen(false);
          setRatingProductId("");
          setRatingProductName("");
        }}
        productId={ratingProductId}
        productName={ratingProductName}
      />
    </div>
  );
}

// Composant ProductCard interne
interface ProductCardProps {
  product: {
    id: string;
    name: string;
    description: string;
    price: number;
    currency: string;
    image: string;
    inStock: boolean;
    isExperience: boolean;
  };
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onOrder: () => void;
  onRate: () => void;
}

function ProductCard({ product, isFavorite, onToggleFavorite, onOrder, onRate }: ProductCardProps) {
  return (
    <Card className="overflow-hidden">
      <div className="relative">
        <img 
          src={product.image} 
          alt={product.name} 
          className="w-full h-48 object-cover" 
        />
        {product.isExperience && (
          <Badge className="absolute top-2 left-2 bg-purple-600 text-white">
            ✨ EXPÉRIENCE
          </Badge>
        )}
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "absolute top-2 right-2 bg-white/80 hover:bg-white transition-all",
            isFavorite && "text-destructive"
          )}
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
        >
          <Heart className={cn("h-4 w-4 transition-all", isFavorite && "fill-current")} />
        </Button>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-lg mb-1">{product.name}</h3>
        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
          {product.description}
        </p>
        
        <div className="flex items-center justify-between mb-3">
          <span className="text-xl font-bold text-primary">
            {product.isExperience && "À partir de "}
            {product.price.toLocaleString()} {product.currency}
          </span>
          <Badge variant={product.inStock ? "default" : "secondary"}>
            {product.inStock ? (product.isExperience ? "Disponible" : "En stock") : "Épuisé"}
          </Badge>
        </div>

        <div className="flex items-center mb-4">
          <ProductRatingDisplay
            productId={product.id}
            onWriteReview={onRate}
            compact
          />
        </div>

        <Button
          className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
          onClick={onOrder}
          disabled={!product.inStock}
        >
          {product.isExperience ? "Réserver" : "Commander"}
        </Button>
      </div>
    </Card>
  );
}
