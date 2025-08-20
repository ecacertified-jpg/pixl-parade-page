import { useState, useEffect } from "react";
import { Search, ArrowLeft, ShoppingCart, Heart, Star, MapPin, Bell, User, ChevronDown, Lightbulb } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { OrderModal } from "@/components/OrderModal";
export default function Shop() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("Tous les lieux");
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
  }>>([{
    id: 1,
    name: "Bracelet Doré Élégance",
    description: "Bracelet en or 18 carats avec finitions délicates",
    price: 15000,
    currency: "F",
    image: "/lovable-uploads/1c257532-9180-4894-83a0-d853a23a3bc1.png",
    category: "Bijoux",
    vendor: "Bijouterie Précieuse",
    distance: "2.3 km",
    rating: 4.8,
    reviews: 45,
    inStock: true
  }]);
  const [selectedProduct, setSelectedProduct] = useState<typeof products[0] | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
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
      const {
        data,
        error
      } = await supabase.from('products').select('*').eq('is_active', true).order('created_at', {
        ascending: false
      });
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
          category: "Produit",
          vendor: "Boutique Élégance",
          distance: "2.3 km",
          rating: 4.8,
          reviews: 45,
          inStock: (product.stock_quantity || 0) > 0
        }));
        setProducts(prev => [...formattedProducts, ...prev]);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };
  const categories = [{
    name: "Bijoux",
    count: 12,
    active: true
  }, {
    name: "Parfums",
    count: 8,
    active: false
  }, {
    name: "Tech",
    count: 15,
    active: false
  }, {
    name: "Mode",
    count: 22,
    active: false
  }, {
    name: "Artisanat",
    count: 6,
    active: false
  }];
  const locations = ["Tous les lieux", "Abidjan - Cocody", "Abidjan - Marcory", "Abidjan - Yopougon", "Abidjan - Adjamé", "Bouaké", "Yamoussoukro", "San-Pédro"];
  return <div className="min-h-screen bg-gradient-background">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm sticky top-0 z-50 border-b border-border/50">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
            <Button variant="ghost" size="sm" onClick={() => window.location.href = '/'} className="p-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">Boutique</h1>
              <span className="text-sm text-muted-foreground">🏷️</span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Button variant="ghost" size="sm" className="relative">
                <ShoppingCart className="h-4 w-4" />
                <Badge className="absolute -top-1 -right-1 bg-primary text-white text-xs w-5 h-5 flex items-center justify-center p-0">
                  2
                </Badge>
              </Button>
            </div>
          </div>
          
          {/* Search Bar */}
          
          
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
          <div className="relative mb-4">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <select value={selectedLocation} onChange={e => setSelectedLocation(e.target.value)} className="w-full pl-10 pr-10 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              {locations.map(location => <option key={location} value={location}>
                  {location}
                </option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Rechercher des produits..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">
        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
          {categories.map((category, index) => <Button key={index} variant={category.active ? "default" : "outline"} size="sm" className="whitespace-nowrap">
              {category.name} ({category.count})
            </Button>)}
        </div>

        {/* Products Grid */}
        <div className="space-y-4">
          {products.map(product => <Card key={product.id} className="overflow-hidden">
              <div className="relative">
                <img src={product.image} alt={product.name} className="w-full h-48 object-cover" />
                <Button variant="ghost" size="sm" className="absolute top-2 right-2 bg-white/80 hover:bg-white">
                  <Heart className="h-4 w-4" />
                </Button>
                
              </div>
              
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-1">{product.name}</h3>
                <p className="text-sm text-muted-foreground mb-2">{product.description}</p>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xl font-bold text-primary">{product.price.toLocaleString()} {product.currency}</span>
                  <Badge variant={product.inStock ? "default" : "secondary"}>
                    {product.inStock ? "En stock" : "Épuisé"}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">{product.rating}</span>
                    <span className="text-sm text-muted-foreground">({product.reviews})</span>
                  </div>
                  <span className="text-sm text-muted-foreground">• {product.vendor}</span>
                </div>

                <Button className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600" onClick={() => {
              setSelectedProduct(product);
              setIsOrderModalOpen(true);
            }}>
                  Commander
                </Button>
              </div>
            </Card>)}
        </div>

        <div className="pb-20" />
      </main>

      <OrderModal isOpen={isOrderModalOpen} onClose={() => setIsOrderModalOpen(false)} product={selectedProduct} />
    </div>;
}