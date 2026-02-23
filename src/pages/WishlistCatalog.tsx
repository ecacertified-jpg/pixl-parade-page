import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Heart, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useFavorites } from "@/hooks/useFavorites";
import { AnimatedFavoriteButton } from "@/components/AnimatedFavoriteButton";
import { SEOHead, SEO_CONFIGS } from "@/components/SEOHead";

interface CatalogProduct {
  id: string;
  name: string;
  price: number;
  currency: string;
  image_url: string | null;
  business_accounts?: { business_name: string } | null;
  category_id: string | null;
}

interface Category {
  id: string;
  name_fr: string;
  icon: string | null;
}

export default function WishlistCatalog() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { isFavorite, addFavorite, removeFavorite, getFavoriteId, stats, loading: favLoading } = useFavorites();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [productsRes, categoriesRes] = await Promise.all([
        supabase
          .from("products")
          .select("id, name, price, currency, image_url, category_id, business_accounts(business_name)")
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(200),
        supabase
          .from("categories")
          .select("id, name_fr, icon")
          .order("name_fr"),
      ]);

      if (productsRes.data) setProducts(productsRes.data as any);
      if (categoriesRes.data) setCategories(categoriesRes.data);
      setLoading(false);
    };

    fetchData();
  }, []);

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || p.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleToggleFavorite = async (e: React.MouseEvent, productId: string) => {
    e.stopPropagation();
    if (isFavorite(productId)) {
      const favId = getFavoriteId(productId);
      if (favId) await removeFavorite(favId);
    } else {
      await addFavorite(productId);
    }
  };

  return (
    <>
      <SEOHead
        title="Ma liste de souhaits | JOIE DE VIVRE"
        description="Parcourez les articles des boutiques et constituez votre liste de souhaits pour que vos proches sachent quoi vous offrir."
      />
      <div className="min-h-screen bg-background pb-24">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b p-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-lg font-semibold font-poppins">Catalogue de souhaits</h1>
              <p className="text-sm text-muted-foreground">
                Cochez les articles que vous aimeriez recevoir
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => navigate("/favorites")}
            >
              <Heart className="h-4 w-4 text-pink-500 fill-pink-500" />
              <span className="font-medium">{stats.total}</span>
            </Button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un article..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Category Filters */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
            <Badge
              variant={selectedCategory === null ? "default" : "outline"}
              className="cursor-pointer whitespace-nowrap flex-shrink-0"
              onClick={() => setSelectedCategory(null)}
            >
              Tous
            </Badge>
            {categories.map((cat) => (
              <Badge
                key={cat.id}
                variant={selectedCategory === cat.id ? "default" : "outline"}
                className="cursor-pointer whitespace-nowrap flex-shrink-0"
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.icon && <span className="mr-1">{cat.icon}</span>}
                {cat.name_fr}
              </Badge>
            ))}
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-56 rounded-xl" />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <SlidersHorizontal className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Aucun article trouvé</p>
              <p className="text-xs mt-1">Essayez un autre filtre ou recherche</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="relative rounded-xl border bg-card overflow-hidden shadow-sm"
                >
                  {/* Heart Button */}
                  <div className="absolute top-2 right-2 z-10">
                    <AnimatedFavoriteButton
                      isFavorite={isFavorite(product.id)}
                      onClick={(e) => handleToggleFavorite(e, product.id)}
                      size="sm"
                    />
                  </div>

                  {/* Image */}
                  <div className="aspect-square bg-muted">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Heart className="h-8 w-8 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-2.5">
                    <p className="text-sm font-medium truncate">{product.name}</p>
                    {product.business_accounts && (
                      <p className="text-xs text-muted-foreground truncate">
                        {(product.business_accounts as any).business_name}
                      </p>
                    )}
                    <p className="text-sm font-bold text-primary mt-1">
                      {product.price.toLocaleString()} {product.currency}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
