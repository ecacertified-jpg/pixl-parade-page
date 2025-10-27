import { useState, useEffect } from "react";
import { Search, ArrowLeft, ShoppingCart, Heart, Star, Lightbulb, Gem, Sparkles, Smartphone, Shirt, Hammer, UtensilsCrossed, Home, HeartHandshake, Gift, Gamepad2, Baby, Briefcase, Hotel, PartyPopper, GraduationCap, Camera, Palette } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrderModal } from "@/components/OrderModal";
import { ProductRatingDisplay } from "@/components/ProductRatingDisplay";
import { RatingModal } from "@/components/RatingModal";
import LocationSelector from "@/components/LocationSelector";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/hooks/useCart";
export default function Shop() {
  const navigate = useNavigate();
  const { itemCount } = useCart();
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [experienceSearchQuery, setExperienceSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tous");
  const [activeTab, setActiveTab] = useState<"products" | "experiences">("products");
  const [products, setProducts] = useState<Array<{
    id: string | number;
    name: string;
    description: string;
    price: number;
    currency: string;
    image: string;
    category: string;
    vendor: string;
    distance: string;
    rating: number;
    reviews: number;
    inStock: boolean;
    isExperience?: boolean;
    categoryName?: string;
    locationName?: string;
  }>>([]);
  const [selectedProduct, setSelectedProduct] = useState<typeof products[0] | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [ratingProductId, setRatingProductId] = useState<string>("");
  const [ratingProductName, setRatingProductName] = useState<string>("");
  const [contributionTarget, setContributionTarget] = useState<any>(null);
  useEffect(() => {
    // Check if user came from contribution flow
    const target = localStorage.getItem('contributionTarget');
    if (target) {
      setContributionTarget(JSON.parse(target));
      localStorage.removeItem('contributionTarget');
    }

    // Load products from database
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      let query = supabase
        .from('products')
        .select(`
          *,
          business_accounts!inner(
            business_name
          )
        `)
        .eq('is_active', true);

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading products:', error);
        return;
      }

      if (data && data.length > 0) {
        const formattedProducts = data.map(product => ({
          id: product.id,
          name: product.name,
          description: product.description || "Description non disponible",
          price: product.price,
          currency: product.currency || "F",
          image: product.image_url || "/lovable-uploads/1c257532-9180-4894-83a0-d853a23a3bc1.png",
          category: product.category_name || "Produit",
          vendor: product.business_accounts?.business_name || "Boutique",
          distance: "2.3 km",
          rating: 4.8,
          reviews: 45,
          inStock: (product.stock_quantity || 0) > 0,
          isExperience: product.is_experience || false,
          categoryName: product.category_name,
          locationName: product.location_name || "Non spécifié"
        }));
        setProducts(formattedProducts);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const getCategoryCount = (categoryName: string, isExperience: boolean) => {
    if (categoryName === "Tous") {
      return products.filter(p => (p.isExperience || false) === isExperience).length;
    }
    return products.filter(p => 
      p.categoryName === categoryName && 
      (p.isExperience || false) === isExperience
    ).length;
  };

  const filteredProducts = products.filter(product => {
    const matchesTab = (product.isExperience || false) === (activeTab === "experiences");
    const matchesCategory = selectedCategory === "Tous" || product.categoryName === selectedCategory;
    const matchesLocation = !selectedLocation || selectedLocation === "Tous les lieux" || product.locationName === selectedLocation;
    
    const currentSearchQuery = activeTab === "experiences" ? experienceSearchQuery : productSearchQuery;
    const matchesSearch = product.name.toLowerCase().includes(currentSearchQuery.toLowerCase()) ||
                         product.description.toLowerCase().includes(currentSearchQuery.toLowerCase());
    
    return matchesTab && matchesCategory && matchesLocation && matchesSearch;
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
  return <div className="min-h-screen bg-gradient-background">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm sticky top-0 z-50 border-b border-border/50">
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

          {/* Location Selector */}
          <div className="flex justify-center items-center">
            <div className="w-full max-w-sm">
              <LocationSelector 
                value={selectedLocation} 
                onChange={setSelectedLocation}
                label=""
                placeholder="Rechercher un lieu"
                showAddButton={false}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">
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
        <div className="space-y-4">
          {filteredProducts.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">Aucun {activeTab === "products" ? "produit" : "expérience"} trouvé(e) dans cette catégorie.</p>
            </Card>
          ) : (
            filteredProducts.map(product => (
              <Card key={product.id} className="overflow-hidden">
                <div className="relative">
                  <img src={product.image} alt={product.name} className="w-full h-48 object-cover" />
                  {product.isExperience && (
                    <Badge className="absolute top-2 left-2 bg-purple-600 text-white">
                      ✨ EXPÉRIENCE
                    </Badge>
                  )}
                  <Button variant="ghost" size="sm" className="absolute top-2 right-2 bg-white/80 hover:bg-white">
                    <Heart className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-1">{product.name}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{product.description}</p>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xl font-bold text-primary">
                      {product.isExperience && "À partir de "}
                      {product.price.toLocaleString()} {product.currency}
                    </span>
                    <Badge variant={product.inStock ? "default" : "secondary"}>
                      {product.inStock ? (product.isExperience ? "Disponible" : "En stock") : "Épuisé"}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <ProductRatingDisplay
                      productId={String(product.id)}
                      onWriteReview={() => {
                        setRatingProductId(String(product.id));
                        setRatingProductName(product.name);
                        setIsRatingModalOpen(true);
                      }}
                      compact
                    />
                    <span className="text-sm text-muted-foreground">{product.vendor}</span>
                  </div>

                  <Button 
                    className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600" 
                    onClick={() => {
                      setSelectedProduct(product);
                      setIsOrderModalOpen(true);
                    }}
                  >
                    {product.isExperience ? "Réserver" : "Commander"}
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>

        <div className="pb-20" />
      </main>

      <OrderModal isOpen={isOrderModalOpen} onClose={() => setIsOrderModalOpen(false)} product={selectedProduct} />
      
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
    </div>;
}