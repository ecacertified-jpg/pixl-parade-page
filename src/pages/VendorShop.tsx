import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import { ArrowLeft, ShoppingCart, Heart, Star, Store, Package, Sparkles, Play, MapPin } from "lucide-react";
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
import { VideoPlayer } from "@/components/VideoPlayer";
import { cn } from "@/lib/utils";
import { CountryBadge } from "@/components/CountryBadge";
import { BusinessShareMenu } from "@/components/BusinessShareMenu";
import { VendorOpeningHours } from "@/components/VendorOpeningHours";
import { VendorLocationMap } from "@/components/VendorLocationMap";
import { VendorHeaderCard } from "@/components/VendorHeaderCard";
import { VendorContactCard } from "@/components/VendorContactCard";
import { useVendorRatings } from "@/hooks/useVendorRatings";
import { useVendorGallery, GalleryItem } from "@/hooks/useVendorGallery";
import { VendorGalleryCarousel, GalleryMediaItem } from "@/components/VendorGalleryCarousel";
import { SEOHead } from "@/components/SEOHead";
import { LocalBusinessSchema, VideoSchema, formatDurationISO8601, type DBOpeningHours, type ReviewItem } from "@/components/schema";
import { VendorBreadcrumb } from "@/components/breadcrumbs";
import { getSchemaBusinessType } from "@/components/schema/helpers";
import { CITY_PAGES } from "@/data/city-pages";

export default function VendorShop() {
  const { businessId } = useParams<{ businessId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { products, vendor, loading, error } = useVendorProducts(businessId);
  const { itemCount } = useCart();
  const { isFavorite, getFavoriteId, addFavorite, removeFavorite, stats: favoriteStats } = useFavorites();
  const { ratings, stats: ratingStats } = useVendorRatings(businessId || "");
  const { items: galleryItems, loading: galleryLoading } = useVendorGallery(businessId);

  // Build gallery items: use dedicated gallery if available, fallback to product images
  const displayGalleryItems = useMemo((): GalleryMediaItem[] => {
    // If dedicated gallery exists, use it
    if (galleryItems.length > 0) {
      return galleryItems.map(item => ({
        id: item.id,
        mediaUrl: item.mediaUrl,
        mediaType: item.mediaType,
        thumbnailUrl: item.thumbnailUrl,
        title: item.title,
      }));
    }

    // Fallback: use product images (max 8)
    const fallbackItems: GalleryMediaItem[] = [];
    for (const product of products) {
      if (fallbackItems.length >= 8) break;
      
      // Add video if exists
      if (product.videoUrl && fallbackItems.length < 8) {
        fallbackItems.push({
          id: `video-${product.id}`,
          mediaUrl: product.videoUrl,
          mediaType: 'video',
          thumbnailUrl: product.videoThumbnailUrl || product.image,
          title: product.name,
        });
      }
      
      // Add main image
      if (product.image && fallbackItems.length < 8) {
        fallbackItems.push({
          id: `product-${product.id}`,
          mediaUrl: product.image,
          mediaType: 'image',
          thumbnailUrl: null,
          title: product.name,
        });
      }
    }
    
    return fallbackItems;
  }, [galleryItems, products]);

  const [activeTab, setActiveTab] = useState<"products" | "experiences">("products");
  const [selectedProduct, setSelectedProduct] = useState<typeof products[0] | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [ratingProductId, setRatingProductId] = useState("");
  const [ratingProductName, setRatingProductName] = useState("");
  const [shareMenuOpen, setShareMenuOpen] = useState(false);

  // Deep linking: ouvrir le produit directement depuis l'URL ?product={id}
  useEffect(() => {
    const productId = searchParams.get('product');
    if (productId && products.length > 0 && !loading) {
      const product = products.find(p => String(p.id) === productId);
      if (product) {
        setSelectedProduct(product);
        setIsOrderModalOpen(true);
      }
    }
  }, [searchParams, products, loading]);

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

  // Format ratings for ReviewSchema
  const formattedReviews: ReviewItem[] = ratings.slice(0, 5).map(r => ({
    authorName: r.user?.first_name || 'Utilisateur',
    rating: r.rating,
    reviewBody: r.review_text,
    datePublished: r.created_at,
    productName: r.product?.name,
  }));

  return (
    <>
    <SEOHead 
      title={`${vendor.businessName} | Boutique sur JOIE DE VIVRE`}
      description={vendor.description || `Découvrez ${vendor.businessName} - ${vendor.businessType || 'Boutique'} à Abidjan. Produits artisanaux et cadeaux uniques.`}
      image={vendor.logoUrl || undefined}
      type="business.business"
      keywords={`${vendor.businessName}, ${vendor.businessType || 'boutique'}, boutique Abidjan, artisanat ivoirien`}
    />
    <LocalBusinessSchema
      id={businessId!}
      name={vendor.businessName}
      description={vendor.description || `${vendor.businessType || 'Boutique'} proposant des produits et cadeaux uniques.`}
      image={vendor.logoUrl || undefined}
      telephone={vendor.phone || undefined}
      email={vendor.email || undefined}
      address={vendor.address || undefined}
      countryCode={vendor.countryCode || 'CI'}
      latitude={vendor.latitude || undefined}
      longitude={vendor.longitude || undefined}
      websiteUrl={vendor.websiteUrl || undefined}
      additionalType={getSchemaBusinessType(vendor.businessType)}
      openingHours={vendor.openingHours as DBOpeningHours | null}
      aggregateRating={ratingStats?.totalRatings > 0 ? {
        ratingValue: ratingStats.averageRating,
        reviewCount: ratingStats.totalRatings
      } : undefined}
      hasOfferCatalog={{
        name: "Produits et Expériences",
        numberOfItems: productCount + experienceCount
      }}
      reviews={formattedReviews.length > 0 ? formattedReviews : undefined}
    />
    {/* VideoSchema for vendor product videos (max 3) */}
    {products
      .filter(p => p.videoUrl && p.videoThumbnailUrl)
      .slice(0, 3)
      .map(product => (
        <VideoSchema
          key={`video-schema-${product.id}`}
          id={`vendor-${businessId}-product-${product.id}`}
          name={`${product.name} - ${vendor.businessName}`}
          description={`${product.description?.slice(0, 150) || product.name}. Disponible chez ${vendor.businessName}.`}
          thumbnailUrl={product.videoThumbnailUrl!}
          uploadDate={(product.videoUploadedAt || product.createdAt || new Date().toISOString()).split('T')[0]}
          contentUrl={product.videoUrl!}
          duration={formatDurationISO8601(30)}
          regionsAllowed={['CI', 'SN', 'ML', 'BF', 'TG', 'NE', 'BJ', 'FR']}
        />
      ))}
    <div className="min-h-screen bg-gradient-background">
      {/* Header - Compact Navigation */}
      <header className="bg-card/80 backdrop-blur-sm sticky top-0 z-50 border-b border-border/50">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/shop')} className="p-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Avatar className="h-7 w-7 flex-shrink-0">
                <AvatarImage src={vendor.logoUrl || undefined} alt={vendor.businessName} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {vendor.businessName.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <h1 className="text-base font-semibold truncate">{vendor.businessName}</h1>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" className="relative h-9 w-9 p-0" onClick={() => navigate('/favorites')}>
                <Heart className="h-4 w-4" />
                {favoriteStats.total > 0 && (
                  <Badge className="absolute -top-1 -right-1 bg-destructive text-white text-[10px] w-4 h-4 flex items-center justify-center p-0">
                    {favoriteStats.total}
                  </Badge>
                )}
              </Button>
              <Button variant="ghost" size="sm" className="relative h-9 w-9 p-0" onClick={() => navigate('/cart')}>
                <ShoppingCart className="h-4 w-4" />
                {itemCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 bg-primary text-white text-[10px] w-4 h-4 flex items-center justify-center p-0">
                    {itemCount}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Unified Breadcrumb - SEO + UI */}
      <VendorBreadcrumb
        vendorId={businessId!}
        vendorName={vendor.businessName}
      />

      <main className="max-w-md mx-auto px-4 py-4 space-y-4">
        {/* Vendor Gallery Carousel - New immersive gallery */}
        {displayGalleryItems.length > 0 && (
          <VendorGalleryCarousel
            items={displayGalleryItems}
            businessName={vendor.businessName}
          />
        )}

        {/* Vendor Header Card - New harmonized design */}
        <VendorHeaderCard
          businessId={businessId!}
          businessName={vendor.businessName}
          businessType={vendor.businessType}
          description={vendor.description}
          logoUrl={vendor.logoUrl}
          productCount={productCount}
          experienceCount={experienceCount}
          averageRating={ratingStats?.averageRating}
          totalReviews={ratingStats?.totalRatings}
          onShare={() => setShareMenuOpen(true)}
        />

        {/* Contact Card - Compact grid layout */}
        <VendorContactCard
          address={vendor.address}
          phone={vendor.phone}
          email={vendor.email}
          countryCode={vendor.countryCode}
        />

        {/* City page link for SEO internal linking */}
        {(() => {
          const vendorCity = vendor.address 
            ? Object.values(CITY_PAGES).find(city => 
                vendor.address!.toLowerCase().includes(city.city.toLowerCase())
              )
            : null;
          
          if (vendorCity) {
            return (
              <Link 
                to={`/${vendorCity.slug}`}
                className="inline-flex items-center gap-2 text-sm text-primary hover:underline px-1"
              >
                <MapPin className="w-4 h-4" />
                Découvrir plus de boutiques à {vendorCity.city}
              </Link>
            );
          }
          return null;
        })()}

        {/* Opening Hours - Collapsible */}
        {vendor.openingHours && Object.keys(vendor.openingHours).length > 0 && (
          <VendorOpeningHours openingHours={vendor.openingHours} />
        )}

        {/* Location Map */}
        {vendor.address && (
          <VendorLocationMap 
            address={vendor.address}
            businessName={vendor.businessName}
            countryCode={vendor.countryCode}
          />
        )}

        {/* Customer Reviews - Compact with expansion */}
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
                    vendorCountryCode={vendor.countryCode}
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
                    vendorCountryCode={vendor.countryCode}
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

      <BusinessShareMenu
        open={shareMenuOpen}
        onOpenChange={setShareMenuOpen}
        businessId={businessId!}
        businessName={vendor.businessName}
        businessType={vendor.businessType}
      />
    </div>
    </>
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
    videoUrl?: string | null;
    videoThumbnailUrl?: string | null;
  };
  vendorCountryCode: string;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onOrder: () => void;
  onRate: () => void;
}

function ProductCard({ product, vendorCountryCode, isFavorite, onToggleFavorite, onOrder, onRate }: ProductCardProps) {
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const hasVideo = !!product.videoUrl;
  const displayImage = product.videoThumbnailUrl || product.image;

  return (
    <Card className="overflow-hidden">
      <div className="relative">
        <img 
          src={displayImage} 
          alt={product.name} 
          className="w-full h-48 object-cover" 
        />
        {hasVideo && (
          <div 
            className="absolute inset-0 bg-black/20 flex items-center justify-center cursor-pointer hover:bg-black/30 transition-colors"
            onClick={() => setShowVideoPlayer(true)}
          >
            <div className="w-14 h-14 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center">
              <Play className="h-7 w-7 text-white fill-white ml-1" />
            </div>
          </div>
        )}
        <div className="absolute top-2 left-2 flex items-center gap-2">
          <CountryBadge countryCode={vendorCountryCode} variant="compact" />
          {product.isExperience && (
            <Badge className="bg-purple-600 text-white">
              ✨ EXPÉRIENCE
            </Badge>
          )}
          {hasVideo && (
            <Badge className="bg-purple-600 text-white">
              🎬 Vidéo
            </Badge>
          )}
        </div>
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

      {hasVideo && product.videoUrl && (
        <VideoPlayer
          videoUrl={product.videoUrl}
          isOpen={showVideoPlayer}
          onClose={() => setShowVideoPlayer(false)}
          title={product.name}
        />
      )}
    </Card>
  );
}
