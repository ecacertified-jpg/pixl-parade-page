import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Heart, SlidersHorizontal, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFavorites } from "@/hooks/useFavorites";
import { AnimatedFavoriteButton } from "@/components/AnimatedFavoriteButton";
import { SEOHead } from "@/components/SEOHead";
import { useCountry } from "@/contexts/CountryContext";
import { CountrySelector } from "@/components/CountrySelector";
import { TASTE_CATEGORIES, ALL_TASTE, matchesTaste } from "@/data/taste-categories";
import {
  CatalogProduct,
  CatalogSortOption,
  CATALOG_SORT_OPTIONS,
  useCatalogProducts,
  useCatalogSearch,
  useDebouncedValue,
} from "@/hooks/useWishlistCatalog";

export default function WishlistCatalog() {
  const { countryCode } = useCountry();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQuery = useDebouncedValue(searchQuery, 300);
  const [selectedTaste, setSelectedTaste] = useState<string>("tous");
  const [sortBy, setSortBy] = useState<CatalogSortOption>("popularity");
  const { isFavorite, addFavorite, removeFavorite, getFavoriteId, stats } = useFavorites();

  const isSearching = debouncedQuery.trim().length >= 2;

  const catalog = useCatalogProducts(countryCode, sortBy);
  const search = useCatalogSearch(countryCode, debouncedQuery, sortBy);

  const products: CatalogProduct[] = useMemo(() => {
    if (isSearching) return search.data ?? [];
    return catalog.data?.pages.flat() ?? [];
  }, [isSearching, search.data, catalog.data]);

  const loading = isSearching ? search.isLoading : catalog.isLoading;

  const filteredProducts = useMemo(
    () => products.filter((p) => matchesTaste(p.category_name, selectedTaste)),
    [products, selectedTaste],
  );

  // Infinite scroll sentinel (uniquement en mode catalogue)
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (isSearching) return;
    const node = sentinelRef.current;
    if (!node || !catalog.hasNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !catalog.isFetchingNextPage) {
          catalog.fetchNextPage();
        }
      },
      { rootMargin: "400px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [isSearching, catalog.hasNextPage, catalog.isFetchingNextPage, catalog.fetchNextPage]);

  const handleToggleFavorite = async (e: React.MouseEvent, productId: string) => {
    e.stopPropagation();
    if (isFavorite(productId)) {
      const favId = getFavoriteId(productId);
      if (favId) await removeFavorite(favId);
    } else {
      await addFavorite(productId);
    }
  };

  const allTastes = [ALL_TASTE, ...TASTE_CATEGORIES];

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
          {/* Country Selector + Search */}
          <div className="flex items-center gap-2">
            <CountrySelector variant="compact" showWelcomeToast={false} />
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom (lingettes, robe…) ou catégorie"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Sort selector */}
          <div className="flex items-center justify-end gap-2">
            <span className="text-xs text-muted-foreground">Trier par</span>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as CatalogSortOption)}>
              <SelectTrigger className="h-8 w-[180px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATALOG_SORT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-xs">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Taste Category Filters */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
            {allTastes.map((taste) => {
              const isSelected = selectedTaste === taste.id;
              const Icon = taste.icon;
              return (
                <Badge
                  key={taste.id}
                  variant={isSelected ? "default" : "outline"}
                  className={`cursor-pointer whitespace-nowrap flex-shrink-0 gap-1 ${isSelected ? '' : taste.color}`}
                  onClick={() => setSelectedTaste(taste.id)}
                >
                  <Icon className="h-3 w-3" />
                  {taste.label}
                </Badge>
              );
            })}
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
              <p className="text-xs mt-1">
                {isSearching && selectedTaste !== "tous"
                  ? `Aucun article pour « ${debouncedQuery} » dans cette catégorie — essayez « Tous »`
                  : "Essayez un autre filtre ou recherche"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filteredProducts.map((product) => {
                const location =
                  product.location_name?.trim() ||
                  product.business_accounts?.address?.trim() ||
                  null;
                return (
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

                  {/* Clickable Image */}
                  <div
                    className="aspect-square bg-muted cursor-pointer relative group"
                    onClick={(e) => handleToggleFavorite(e, product.id)}
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
                      <Heart className={`h-8 w-8 opacity-0 group-hover:opacity-70 transition-opacity ${isFavorite(product.id) ? 'text-pink-500 fill-pink-500' : 'text-white'}`} />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-2.5">
                    <p className="text-sm font-medium truncate">{product.name}</p>
                    {product.business_accounts && (
                      <p className="text-xs text-muted-foreground truncate">
                        {(product.business_accounts as any).business_name}
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
              })}
            </div>
          )}

          {/* Infinite scroll sentinel + indicateur de chargement */}
          {!isSearching && !loading && filteredProducts.length > 0 && (
            <div ref={sentinelRef} className="py-6 flex justify-center">
              {catalog.isFetchingNextPage ? (
                <div className="grid grid-cols-2 gap-3 w-full">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-56 rounded-xl" />
                  ))}
                </div>
              ) : catalog.hasNextPage ? (
                <span className="text-xs text-muted-foreground">Chargement…</span>
              ) : (
                <span className="text-xs text-muted-foreground">Vous avez tout vu ✨</span>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
