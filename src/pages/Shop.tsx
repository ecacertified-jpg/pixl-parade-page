import { useState, useEffect, useMemo, useCallback } from "react";
import { Search, ArrowLeft, ShoppingCart, Heart, Star, Lightbulb, Gem, Sparkles, Smartphone, Shirt, Hammer, UtensilsCrossed, Home, HeartHandshake, Gift, Gamepad2, Baby, Briefcase, Hotel, PartyPopper, GraduationCap, Camera, Palette, X, Store, Video, Play, Share2, Map, Expand, MapPin, Loader2 } from "lucide-react";
import { useShopProducts } from "@/hooks/useShopProducts";
import { usePopularShops } from "@/hooks/usePopularShops";
import { FullscreenGallery } from "@/components/FullscreenGallery";
import { motion, useReducedMotion } from "framer-motion";
import { ProductShareMenu } from "@/components/ProductShareMenu";
import { ProductShareCount } from "@/components/ProductShareCount";
import { ProductDetailModal } from "@/components/ProductDetailModal";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrderModal } from "@/components/OrderModal";
import { ProductRatingDisplay } from "@/components/ProductRatingDisplay";
import { RatingModal } from "@/components/RatingModal";
import { AIRecommendationsSection } from "@/components/AIRecommendationsSection";
import { CitySelector } from "@/components/CitySelector";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useCart } from "@/hooks/useCart";
import { useFavorites } from "@/hooks/useFavorites";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { FriendsCircleReminderCard } from "@/components/FriendsCircleReminderCard";
import { CountryFilterToggle } from "@/components/CountryFilterToggle";
import { useCountry } from "@/contexts/CountryContext";
import { VideoPlayer } from "@/components/VideoPlayer";
import { SEOHead, SEO_CONFIGS } from "@/components/SEOHead";
import { ShopBreadcrumb, CategoryBreadcrumb } from "@/components/breadcrumbs";
import { getCategoryByName } from "@/data/product-categories";
import { AnimatedProductGrid } from "@/components/AnimatedProductGrid";
import { AnimatedProductCard } from "@/components/AnimatedProductCard";
import { AnimatedFavoriteButton } from "@/components/AnimatedFavoriteButton";
import { CountryBadge } from "@/components/CountryBadge";
import { haversineDistance, formatDistance, requestUserLocation, type GeoLocation } from "@/utils/geoUtils";
import { ProductGridSkeleton } from "@/components/ProductGridSkeleton";

export default function Shop() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { effectiveCountryFilter, profileCountryCode } = useCountry();
  const { itemCount, addItem } = useCart();
  const { addFavorite, removeFavorite, isFavorite, getFavoriteId, stats } = useFavorites();
  const { toast } = useToast();
  const { products: rawProducts, isLoading: isInitialLoading } = useShopProducts();
  const { popularShops } = usePopularShops();
  
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [experienceSearchQuery, setExperienceSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tous");
  const [activeTab, setActiveTab] = useState<"products" | "experiences">("products");
  
  // Geolocation state
  const [userLocation, setUserLocation] = useState<GeoLocation | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  

  // Derive distance-sorted products from cached data
  const products = useMemo(() => {
    if (!rawProducts.length) return rawProducts;
    const withDistance = rawProducts.map(p => {
      if (userLocation && p.businessLatitude && p.businessLongitude) {
        const dist = haversineDistance(userLocation.lat, userLocation.lng, p.businessLatitude, p.businessLongitude);
        return { ...p, distanceKm: dist, distance: formatDistance(dist) };
      }
      return p;
    });
    if (userLocation) {
      withDistance.sort((a, b) => {
        if (a.distanceKm === null && b.distanceKm === null) return 0;
        if (a.distanceKm === null) return 1;
        if (b.distanceKm === null) return -1;
        return a.distanceKm - b.distanceKm;
      });
    }
    return withDistance;
  }, [rawProducts, userLocation]);

  // State for video playback modal
  const [selectedVideo, setSelectedVideo] = useState<{ url: string; title: string } | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<typeof products[0] | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [ratingProductId, setRatingProductId] = useState<string>("");
  const [ratingProductName, setRatingProductName] = useState<string>("");
  const [contributionTarget, setContributionTarget] = useState<any>(null);
  
  // Shop search state
  const [shopSearchQuery, setShopSearchQuery] = useState("");
  const [searchedShops, setSearchedShops] = useState<typeof popularShops>([]);
  const [isSearchingShops, setIsSearchingShops] = useState(false);

  // State for product detail modal
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailProduct, setDetailProduct] = useState<typeof products[0] | null>(null);
  
  // State for product share
  const [shareProduct, setShareProduct] = useState<typeof products[0] | null>(null);
  
  // State for fullscreen gallery
  const [fullscreenProduct, setFullscreenProduct] = useState<{
    images: string[];
    name: string;
  } | null>(null);
  
  // Pre-selected recipient from URL params (when coming from friend card gift button)
  const [preSelectedRecipient, setPreSelectedRecipient] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Check for pre-selected recipient from URL params and deep link for shared product
  useEffect(() => {
    const giftForId = searchParams.get('giftFor');
    const giftForName = searchParams.get('friendName');
    
    if (giftForId && giftForName) {
      setPreSelectedRecipient({
        id: giftForId,
        name: decodeURIComponent(giftForName)
      });
    }
  }, [searchParams]);

  // Deep link: open product modal from shared link
  useEffect(() => {
    const productId = searchParams.get('product');
    if (productId && products.length > 0) {
      const product = products.find(p => String(p.id) === productId);
      if (product) {
        setDetailProduct(product);
        setIsDetailModalOpen(true);
      }
    }
  }, [searchParams, products]);
  // Request user location on mount
  useEffect(() => {
    const fetchLocation = async () => {
      setIsLocating(true);
      const location = await requestUserLocation();
      if (location) {
        setUserLocation(location);
        toast({
          title: "Position détectée",
          description: "Les produits sont triés par proximité",
        });
      }
      setIsLocating(false);
    };
    fetchLocation();
  }, []);
  
  // Debounced shop search
  useEffect(() => {
    if (!shopSearchQuery.trim()) {
      setSearchedShops([]);
      setIsSearchingShops(false);
      return;
    }
    setIsSearchingShops(true);
    const timer = setTimeout(async () => {
      try {
        const { data: businessData } = await supabase
          .from('business_public_info')
          .select('id, business_name, logo_url, business_type')
          .ilike('business_name', `%${shopSearchQuery.trim()}%`)
          .eq('is_active', true)
          .limit(10);

        if (!businessData || businessData.length === 0) {
          setSearchedShops([]);
          setIsSearchingShops(false);
          return;
        }

        const businessIds = businessData.map(b => b.id).filter(Boolean) as string[];
        const { data: productsData } = await supabase
          .from('products')
          .select('id, business_account_id')
          .eq('is_active', true)
          .in('business_account_id', businessIds);

        const productCountMap: Record<string, number> = {};
        const productIds: string[] = [];
        productsData?.forEach(p => {
          if (p.business_account_id) {
            productCountMap[p.business_account_id] = (productCountMap[p.business_account_id] || 0) + 1;
            productIds.push(p.id);
          }
        });

        const ratingMap: Record<string, { sum: number; count: number }> = {};
        if (productIds.length > 0) {
          const { data: ratingsData } = await supabase
            .from('product_ratings')
            .select('product_id, rating')
            .in('product_id', productIds);
          const pidToBiz: Record<string, string> = {};
          productsData?.forEach(p => { if (p.business_account_id) pidToBiz[p.id] = p.business_account_id; });
          ratingsData?.forEach(r => {
            const biz = pidToBiz[r.product_id];
            if (biz) {
              if (!ratingMap[biz]) ratingMap[biz] = { sum: 0, count: 0 };
              ratingMap[biz].sum += r.rating;
              ratingMap[biz].count += 1;
            }
          });
        }

        setSearchedShops(businessData.filter(b => b.id).map(b => ({
          id: b.id!,
          name: b.business_name || '',
          logo: b.logo_url,
          type: b.business_type,
          rating: ratingMap[b.id!] ? parseFloat((ratingMap[b.id!].sum / ratingMap[b.id!].count).toFixed(1)) : null,
          ratingCount: ratingMap[b.id!]?.count || 0,
          productCount: productCountMap[b.id!] || 0,
        })));
      } catch (err) {
        console.error('Shop search error:', err);
      } finally {
        setIsSearchingShops(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [shopSearchQuery]);

  // Check if user came from contribution flow
  useEffect(() => {
    const target = localStorage.getItem('contributionTarget');
    if (target) {
      setContributionTarget(JSON.parse(target));
      localStorage.removeItem('contributionTarget');
    }
  }, []);



  const getCategoryCount = (categoryName: string, isExperience: boolean) => {
    if (categoryName === "Tous") {
      return products.filter(p => (p.isExperience || false) === isExperience).length;
    }
    return products.filter(p => 
      p.categoryName === categoryName && 
      (p.isExperience || false) === isExperience
    ).length;
  };

  // Determine active country filter: use effectiveCountryFilter, or fallback to user's home country (then CI) when geolocation unavailable
  const activeCountryFilter = effectiveCountryFilter ?? (userLocation ? null : (profileCountryCode || 'CI'));

  const filteredProducts = products.filter(product => {
    const matchesTab = (product.isExperience || false) === (activeTab === "experiences");
    const matchesCategory = selectedCategory === "Tous" || product.categoryName === selectedCategory;
    const matchesLocation = !selectedLocation || selectedLocation === "Tous les lieux" || (product.businessAddress && product.businessAddress.toLowerCase().includes(selectedLocation.toLowerCase()));
    
    const currentSearchQuery = activeTab === "experiences" ? experienceSearchQuery : productSearchQuery;
    const matchesSearch = product.name.toLowerCase().includes(currentSearchQuery.toLowerCase()) ||
                         product.description.toLowerCase().includes(currentSearchQuery.toLowerCase());
    
    const matchesCountry = !activeCountryFilter || product.countryCode === activeCountryFilter;
    
    return matchesTab && matchesCategory && matchesLocation && matchesSearch && matchesCountry;
  });
  const productCategories = [
    { name: "Tous", icon: Gift },
    { name: "Bijoux & Accessoires", icon: Gem },
    { name: "Parfums & Beauté", icon: Sparkles },
    { name: "Tech & Électronique", icon: Smartphone },
    { name: "Mode & Vêtements", icon: Shirt },
    { name: "Artisanat Ivoirien", icon: Hammer },
    { name: "Gastronomie & Délices", icon: UtensilsCrossed },
    { name: "Décoration & Maison", icon: Home },
    { name: "Loisirs & Divertissement", icon: Gamepad2 },
    { name: "Bébé & Enfants", icon: Baby },
    { name: "Affaires & Bureau", icon: Briefcase }
  ];

  const experienceCategories = [
    { name: "Tous", icon: Gift },
    { name: "Restaurants & Gastronomie", icon: UtensilsCrossed },
    { name: "Bien-être & Spa", icon: Sparkles },
    { name: "Séjours & Hébergement", icon: Hotel },
    { name: "Événements & Célébrations", icon: PartyPopper },
    { name: "Formation & Développement", icon: GraduationCap },
    { name: "Expériences VIP", icon: Star },
    { name: "Souvenirs & Photographie", icon: Camera },
    { name: "Culture & Loisirs", icon: Palette },
    { name: "Mariage & Fiançailles", icon: Heart },
    { name: "Occasions Spéciales", icon: Gift }
  ];

  const currentCategories = activeTab === "products" ? productCategories : experienceCategories;

  // Dynamic breadcrumb based on selected category
  const categoryBreadcrumbData = useMemo(() => {
    if (selectedCategory === "Tous") return null;
    
    const categoryDef = getCategoryByName(selectedCategory);
    const CategoryIcon = categoryDef?.icon;
    
    return {
      slug: categoryDef?.slug || selectedCategory.toLowerCase().replace(/\s+/g, '-'),
      name: selectedCategory,
      icon: CategoryIcon ? <CategoryIcon className="h-3.5 w-3.5" /> : undefined
    };
  }, [selectedCategory]);

  return (
    <>
    <SEOHead {...SEO_CONFIGS.shop} />
    {categoryBreadcrumbData ? (
      <CategoryBreadcrumb
        categorySlug={categoryBreadcrumbData.slug}
        categoryName={categoryBreadcrumbData.name}
        categoryIcon={categoryBreadcrumbData.icon}
      />
    ) : (
      <ShopBreadcrumb />
    )}
    <div className="min-h-screen bg-gradient-background">
      {/* Global Friends Circle Reminder */}
      <FriendsCircleReminderCard compact />
      
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm sticky top-0 z-40 border-b border-border/50">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="p-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">Boutique</h1>
              <span className="text-sm text-muted-foreground">🏷️</span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              {/* Geolocation Button */}
              <Button 
                variant={userLocation ? "default" : "outline"} 
                size="sm" 
                onClick={async () => {
                  if (!userLocation) {
                    setIsLocating(true);
                    const location = await requestUserLocation();
                    if (location) {
                      setUserLocation(location);
                      toast({
                        title: "Position détectée",
                        description: "Les produits sont triés par proximité",
                      });
                    } else {
                      toast({
                        title: "Géolocalisation refusée",
                        description: "Activez la localisation pour trier par proximité",
                        variant: "destructive",
                      });
                    }
                    setIsLocating(false);
                  }
                }}
                disabled={isLocating}
                title={userLocation ? "Position détectée" : "Me localiser"}
                className="relative"
              >
                {isLocating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MapPin className={cn("h-4 w-4", userLocation && "text-primary-foreground")} />
                )}
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/explore-map')}
                title="Carte des boutiques"
              >
                <Map className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/followed-shops')}
                title="Mes boutiques suivies"
              >
                <Store className="h-4 w-4" />
              </Button>
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
          
          {/* Conseil */}
          <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-blue-800 font-medium">
                💡 Conseil : Choisissez le lieu le plus proche pour une livraison rapide
              </p>
            </div>
          </div>

          {/* Location Selector and Country Filter */}
          <div className="flex justify-center items-center gap-2">
            <div className="flex-1 max-w-sm">
              <CitySelector 
                value={selectedLocation} 
                onChange={setSelectedLocation}
                label=""
                placeholder="Rechercher un lieu"
                allowCustom={false}
              />
            </div>
            <CountryFilterToggle variant="compact" />
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">
        {/* Pre-selected recipient banner */}
        {preSelectedRecipient && (
          <Card className="mb-4 bg-pink-50 border-pink-200">
            <div className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-pink-500" />
                <span className="text-sm">
                  Choisissez un cadeau pour <strong>{preSelectedRecipient.name}</strong>
                </span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setPreSelectedRecipient(null);
                  navigate('/shop', { replace: true });
                }}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        )}
        {/* Tabs for Products vs Experiences */}
        <Tabs defaultValue="products" className="mb-6" onValueChange={(value) => {
          setActiveTab(value as "products" | "experiences");
          setSelectedCategory("Tous");
        }}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="products">🛍️ Produits</TabsTrigger>
            <TabsTrigger value="experiences">✨ Expériences</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="mt-4">
            {/* Search Bar for Products */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Rechercher des produits..." 
                value={productSearchQuery} 
                onChange={e => setProductSearchQuery(e.target.value)} 
                className="pl-10" 
              />
            </div>
            
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {productCategories.map((category, index) => {
                const Icon = category.icon;
                const count = getCategoryCount(category.name, false);
                return (
                  <Button 
                    key={index} 
                    variant={selectedCategory === category.name ? "default" : "outline"} 
                    size="sm" 
                    className="whitespace-nowrap flex items-center gap-2"
                    onClick={() => setSelectedCategory(category.name)}
                  >
                    <Icon className="h-4 w-4" />
                    {category.name} ({count})
                  </Button>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="experiences" className="mt-4">
            {/* Search Bar for Experiences */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Rechercher des expériences..." 
                value={experienceSearchQuery} 
                onChange={e => setExperienceSearchQuery(e.target.value)} 
                className="pl-10" 
              />
            </div>
            
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {experienceCategories.map((category, index) => {
                const Icon = category.icon;
                const count = getCategoryCount(category.name, true);
                return (
                  <Button 
                    key={index} 
                    variant={selectedCategory === category.name ? "default" : "outline"} 
                    size="sm" 
                    className="whitespace-nowrap flex items-center gap-2"
                    onClick={() => setSelectedCategory(category.name)}
                  >
                    <Icon className="h-4 w-4" />
                    {category.name} ({count})
                  </Button>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>

        {/* Shop Search + Popular Shops Section */}
        {(popularShops.length > 0 || shopSearchQuery.trim()) && (
          <div className="mb-6">
            {/* Search bar */}
            <div className="relative mb-3">
              <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher une boutique..."
                value={shopSearchQuery}
                onChange={e => setShopSearchQuery(e.target.value)}
                className="pl-10 pr-10"
              />
              {shopSearchQuery && (
                <button
                  onClick={() => setShopSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Store className="h-5 w-5 text-primary" />
              {shopSearchQuery.trim() ? "Résultats de recherche" : "Boutiques populaires"}
            </h2>

            {isSearchingShops ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="ml-2 text-sm text-muted-foreground">Recherche...</span>
              </div>
            ) : shopSearchQuery.trim() && searchedShops.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Aucune boutique trouvée pour "{shopSearchQuery}"
              </p>
            ) : (
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {(shopSearchQuery.trim() ? searchedShops : popularShops).map((shop) => (
                  <Card 
                    key={shop.id}
                    className="flex-shrink-0 w-32 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate(`/boutique/${shop.id}`)}
                  >
                    <div className="p-3 flex flex-col items-center text-center">
                      <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-2 overflow-hidden">
                        {shop.logo ? (
                          <img src={shop.logo} alt={shop.name} className="w-full h-full object-cover" />
                        ) : (
                          <Store className="h-6 w-6 text-primary" />
                        )}
                      </div>
                      <p className="text-sm font-medium line-clamp-1">{shop.name}</p>
                      <div className="flex items-center gap-1 mt-1">
                        {shop.rating !== null ? (
                          <>
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs text-muted-foreground">{shop.rating.toFixed(1)}</span>
                            <span className="text-xs text-muted-foreground">({shop.ratingCount})</span>
                          </>
                        ) : (
                          <span className="text-xs text-primary">✨ Nouveau</span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground mt-0.5">
                        {shop.productCount} produit{shop.productCount > 1 ? 's' : ''}
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* AI Recommendations Section */}
        <div className="mb-6">
          <AIRecommendationsSection
            onAddToCart={(product) => {
              addItem({
                id: product.id,
                productId: product.id,
                name: product.name,
                price: product.price,
                image: product.image_url,
                vendor: product.vendor || "Boutique",
                locationName: product.location_name || "Non spécifié",
                currency: product.currency || "XOF",
                quantity: 1
              });
              toast({
                title: "Ajouté au panier",
                description: `${product.name} a été ajouté à votre panier`,
              });
            }}
            onAddToFavorites={async (productId) => {
              await addFavorite(productId);
              toast({
                title: "Ajouté aux favoris",
                description: "Le produit a été ajouté à vos favoris",
              });
            }}
          />
        </div>

        {/* Business CTA */}
        <Card className="mb-6 bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/30">
          <div className="p-4 flex items-center justify-between bg-green-200">
            <div>
              <h3 className="font-medium text-sm">Vous êtes vendeur ?</h3>
              <p className="text-xs text-muted-foreground">Vendez vos produits sur JOIE DE VIVRE</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => navigate('/business-auth')} className="text-xs bg-green-500 hover:bg-green-400">
              Rejoindre
            </Button>
          </div>
        </Card>

        {/* Products Grid */}
        {isInitialLoading ? (
          <ProductGridSkeleton count={6} columns={2} />
        ) : (
        <AnimatedProductGrid 
          className="space-y-4"
          keyId={`${selectedCategory}-${activeTab}`}
        >
          {filteredProducts.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">Aucun {activeTab === "products" ? "produit" : "expérience"} trouvé(e) dans cette catégorie.</p>
            </Card>
          ) : (
            filteredProducts.map((product, index) => (
              <AnimatedProductCard
                key={product.id}
                index={index}
                onClick={() => {
                  setDetailProduct(product);
                  setIsDetailModalOpen(true);
                }}
              >
                <Card className="overflow-hidden">
                  {/* Clickable Image/Video */}
                  <div className="relative cursor-pointer">
                    <img 
                      src={product.videoUrl ? (product.videoThumbnailUrl || product.image) : product.image} 
                      alt={product.name} 
                      className="w-full h-40 object-cover" 
                    />
                    {/* Country Badge + Experience Badge */}
                    <div className="absolute top-2 left-2 flex items-center gap-1.5 z-10">
                      <CountryBadge countryCode={product.countryCode} variant="compact" />
                      {product.isExperience && (
                        <Badge className="bg-purple-600 text-white text-xs">
                          ✨ EXPÉRIENCE
                        </Badge>
                      )}
                    </div>
                    {/* Play button for video products */}
                    {product.videoUrl && (
                      <button
                        className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors group"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedVideo({ url: product.videoUrl!, title: product.name });
                        }}
                        aria-label="Lire la vidéo"
                      >
                        <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                          <Play className="h-7 w-7 text-primary fill-primary ml-1" />
                        </div>
                        <Badge className="absolute bottom-2 left-2 bg-black/70 text-white text-xs flex items-center gap-1">
                          <Video className="h-3 w-3" />
                          Vidéo
                        </Badge>
                      </button>
                    )}
                    {/* Expand Button */}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute top-2 right-[5.5rem] bg-white/80 hover:bg-white transition-all h-8 w-8 rounded-full z-10"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFullscreenProduct({
                          images: product.images || [product.image],
                          name: product.name
                        });
                      }}
                    >
                      <Expand className="h-4 w-4" />
                    </Button>
                    {/* Share Button */}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute top-2 right-12 bg-white/80 hover:bg-white transition-all h-8 w-8 rounded-full z-10"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShareProduct(product);
                      }}
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                    {/* Favorite Button */}
                    <AnimatedFavoriteButton
                      isFavorite={isFavorite(String(product.id))}
                      onClick={async (e) => {
                        e.stopPropagation();
                        const productIdStr = String(product.id);
                        if (isFavorite(productIdStr)) {
                          const favoriteId = getFavoriteId(productIdStr);
                          if (favoriteId) {
                            await removeFavorite(favoriteId);
                          }
                        } else {
                          await addFavorite(productIdStr);
                        }
                      }}
                      className="absolute top-2 right-2 bg-white/80 hover:bg-white h-8 w-8 z-10"
                    />
                  </div>
                
                <div className="p-3">
                  {/* Name + Vendor on same line */}
                  <div className="flex items-center justify-between mb-1 gap-2">
                    <h3 className="font-semibold text-base line-clamp-1 flex-1">{product.name}</h3>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-xs font-normal whitespace-nowrap flex items-center gap-1 py-0.5 px-1.5 flex-shrink-0",
                        product.vendorId && "cursor-pointer hover:bg-primary/10 hover:border-primary transition-colors"
                      )}
                      onClick={(e) => {
                        if (product.vendorId) {
                          e.stopPropagation();
                          navigate(`/boutique/${product.vendorId}`);
                        }
                      }}
                    >
                      {product.vendorLogo ? (
                        <img 
                          src={product.vendorLogo} 
                          alt={product.vendor} 
                          className="w-3.5 h-3.5 rounded-full object-cover"
                        />
                      ) : (
                        <Store className="h-3 w-3 text-muted-foreground" />
                      )}
                      <span className="max-w-[60px] truncate">{product.vendor}</span>
                    </Badge>
                  </div>
                  
                  {/* Short description (1 line) */}
                  <p className="text-xs text-muted-foreground line-clamp-1 mb-2">{product.description}</p>
                  
                  {/* Price + Stock */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg font-bold text-primary">
                      {product.price.toLocaleString()} {product.currency}
                    </span>
                    <Badge variant={product.inStock ? "default" : "secondary"} className="text-xs">
                      {product.inStock ? (product.isExperience ? "Dispo" : "Stock") : "Épuisé"}
                    </Badge>
                  </div>

                  {/* Compact Rating + Distance */}
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <div className="flex items-center gap-1">
                      {product.reviews > 0 ? (
                        <>
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">{product.rating.toFixed(1)}</span>
                          <span className="text-xs text-muted-foreground">
                            ({product.reviews} {product.reviews === 1 ? 'avis' : 'avis'})
                          </span>
                        </>
                      ) : (
                        <>
                          <Star className="h-4 w-4 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Aucun avis</span>
                        </>
                      )}
                    </div>
                    <span className="text-muted-foreground">•</span>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{product.distance}</span>
                    </div>
                    <span className="text-muted-foreground">•</span>
                    <ProductShareCount productId={String(product.id)} compact showIcon />
                  </div>

                  <Button 
                    className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600" 
                    size="sm"
                    onClick={() => {
                      setSelectedProduct(product);
                      setIsOrderModalOpen(true);
                    }}
                  >
                    {product.isExperience ? "Réserver" : "Commander"}
                  </Button>
                </div>
                </Card>
              </AnimatedProductCard>
            ))
          )}
        </AnimatedProductGrid>
        )}

        <div className="pb-20" />
      </main>

      <OrderModal 
        isOpen={isOrderModalOpen} 
        onClose={() => setIsOrderModalOpen(false)} 
        product={selectedProduct}
        preSelectedRecipient={preSelectedRecipient}
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
      
      <ProductDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        product={detailProduct}
        onOrder={() => {
          setSelectedProduct(detailProduct);
          setIsDetailModalOpen(false);
          setIsOrderModalOpen(true);
        }}
        onToggleFavorite={async () => {
          if (detailProduct) {
            const productIdStr = String(detailProduct.id);
            if (isFavorite(productIdStr)) {
              const favoriteId = getFavoriteId(productIdStr);
              if (favoriteId) {
                await removeFavorite(favoriteId);
              }
            } else {
              await addFavorite(productIdStr);
            }
          }
        }}
        isFavorite={detailProduct ? isFavorite(String(detailProduct.id)) : false}
      />
      
      {/* Video Player Modal */}
      <VideoPlayer 
        videoUrl={selectedVideo?.url || ""} 
        isOpen={!!selectedVideo} 
        onClose={() => setSelectedVideo(null)} 
        title={selectedVideo?.title}
      />
      
      {/* Product Share Modal */}
      <ProductShareMenu
        open={!!shareProduct}
        onOpenChange={(open) => !open && setShareProduct(null)}
        product={shareProduct}
      />
      
      {/* Fullscreen Gallery */}
      <FullscreenGallery
        images={fullscreenProduct?.images || []}
        alt={fullscreenProduct?.name || "Produit"}
        initialIndex={0}
        isOpen={!!fullscreenProduct}
        onClose={() => setFullscreenProduct(null)}
      />
    </div>
    </>
  );
}