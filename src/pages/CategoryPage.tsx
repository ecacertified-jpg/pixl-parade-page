import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ShoppingCart, Heart, Star, Package, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SEOHead } from "@/components/SEOHead";
import { CategoryBreadcrumb } from "@/components/CategoryBreadcrumb";
import { ProductDetailModal } from "@/components/ProductDetailModal";
import { useCategoryProducts, CategoryProduct } from "@/hooks/useCategoryProducts";
import { useCart } from "@/hooks/useCart";
import { useFavorites } from "@/hooks/useFavorites";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addItem } = useCart();
  const { addFavorite, removeFavorite, isFavorite, getFavoriteId } = useFavorites();

  const { products, category, loading, error, totalCount } = useCategoryProducts(slug || "");

  // Modal de détail produit
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailProduct, setDetailProduct] = useState<CategoryProduct | null>(null);

  // Rediriger si catégorie introuvable
  useEffect(() => {
    if (!loading && error && !category) {
      navigate("/shop", { replace: true });
    }
  }, [loading, error, category, navigate]);

  const handleAddToCart = (product: CategoryProduct) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: product.image,
      vendor: product.vendor
    });
    toast({
      title: "Ajouté au panier",
      description: `${product.name} a été ajouté à votre panier`,
    });
  };

  const handleToggleFavorite = async (product: CategoryProduct) => {
    if (isFavorite(product.id)) {
      const favoriteId = getFavoriteId(product.id);
      if (favoriteId) {
        await removeFavorite(favoriteId);
        toast({
          title: "Retiré des favoris",
          description: `${product.name} a été retiré de vos favoris`,
        });
      }
    } else {
      await addFavorite(product.id);
      toast({
        title: "Ajouté aux favoris",
        description: `${product.name} a été ajouté à vos favoris`,
      });
    }
  };

  const handleProductClick = (product: CategoryProduct) => {
    setDetailProduct(product);
    setIsDetailModalOpen(true);
  };

  if (!slug) {
    return null;
  }

  const CategoryIcon = category?.icon || Package;
  const isExperience = category?.isExperience || false;

  return (
    <>
      <SEOHead
        title={category ? `${category.name} - Boutique JOIE DE VIVRE` : "Catégorie - JOIE DE VIVRE"}
        description={category?.description || `Découvrez notre sélection de produits. ${totalCount} articles disponibles. Livraison en Côte d'Ivoire.`}
        keywords={category ? `${category.name}, cadeaux, Abidjan, artisanat ivoirien` : "cadeaux, boutique"}
      />

      {category && (
        <CategoryBreadcrumb
          categorySlug={slug}
          categoryName={category.name}
          categoryIcon={<CategoryIcon className="h-3.5 w-3.5" />}
        />
      )}

      <div className="min-h-screen bg-gradient-background">
        {/* Header */}
        <header className="bg-card/80 backdrop-blur-sm sticky top-0 z-40 border-b border-border/50">
          <div className="max-w-md mx-auto px-4 py-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => navigate('/shop')} className="p-2">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2 flex-1">
                {category && (
                  <>
                    <CategoryIcon className="h-5 w-5 text-primary" />
                    <h1 className="text-lg font-semibold truncate">{category.name}</h1>
                  </>
                )}
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="relative" 
                onClick={() => navigate('/cart')}
              >
                <ShoppingCart className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="max-w-md mx-auto px-4 py-6">
          {/* Category Info */}
          {category && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                {isExperience ? (
                  <Badge variant="secondary" className="text-xs">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Expériences
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs">
                    <Package className="h-3 w-3 mr-1" />
                    Produits
                  </Badge>
                )}
                <span className="text-sm text-muted-foreground">
                  {totalCount} {totalCount > 1 ? 'articles' : 'article'} disponible{totalCount > 1 ? 's' : ''}
                </span>
              </div>
              {category.description && (
                <p className="text-sm text-muted-foreground">{category.description}</p>
              )}
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map(i => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="w-full aspect-square" />
                  <div className="p-3 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-5 w-1/3" />
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && products.length === 0 && (
            <div className="text-center py-12">
              <CategoryIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Aucun produit</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Aucun produit disponible dans cette catégorie pour le moment.
              </p>
              <Button onClick={() => navigate('/shop')}>
                Retour à la boutique
              </Button>
            </div>
          )}

          {/* Products Grid */}
          {!loading && products.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {products.map(product => (
                <Card 
                  key={product.id} 
                  className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleProductClick(product)}
                >
                  {/* Image */}
                  <div className="relative aspect-square">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    {/* Favorite Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFavorite(product);
                      }}
                      className={cn(
                        "absolute top-2 right-2 p-1.5 rounded-full bg-background/80 backdrop-blur-sm transition-colors",
                        isFavorite(product.id) ? "text-destructive" : "text-muted-foreground hover:text-destructive"
                      )}
                    >
                      <Heart className={cn("h-4 w-4", isFavorite(product.id) && "fill-current")} />
                    </button>
                    {/* Out of Stock */}
                    {!product.inStock && (
                      <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                        <Badge variant="destructive" className="text-xs">Rupture</Badge>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <h3 className="font-medium text-sm line-clamp-2 mb-1">{product.name}</h3>
                    <p className="text-xs text-muted-foreground mb-1 truncate">{product.vendor}</p>
                    
                    {/* Rating */}
                    {product.reviews > 0 && (
                      <div className="flex items-center gap-1 mb-2">
                        <Star className="h-3 w-3 fill-primary text-primary" />
                        <span className="text-xs">{product.rating}</span>
                        <span className="text-xs text-muted-foreground">({product.reviews})</span>
                      </div>
                    )}

                    {/* Price & Add to Cart */}
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-primary">
                        {product.price.toLocaleString()} {product.currency}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        disabled={!product.inStock}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart(product);
                        }}
                      >
                        <ShoppingCart className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Product Detail Modal */}
      {detailProduct && (
        <ProductDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setDetailProduct(null);
          }}
          product={{
            id: detailProduct.id,
            name: detailProduct.name,
            description: detailProduct.description,
            price: detailProduct.price,
            currency: detailProduct.currency,
            image: detailProduct.image,
            images: detailProduct.images,
            category: detailProduct.category,
            vendor: detailProduct.vendor,
            vendorId: detailProduct.vendorId || null,
            vendorLogo: detailProduct.vendorLogo || null,
            rating: detailProduct.rating,
            reviews: detailProduct.reviews,
            inStock: detailProduct.inStock,
            isExperience: detailProduct.isExperience,
            locationName: detailProduct.locationName,
            videoUrl: detailProduct.videoUrl,
            videoThumbnailUrl: detailProduct.videoThumbnailUrl
          }}
          onOrder={() => handleAddToCart(detailProduct)}
          onToggleFavorite={() => handleToggleFavorite(detailProduct)}
          isFavorite={isFavorite(detailProduct.id)}
        />
      )}
    </>
  );
}
