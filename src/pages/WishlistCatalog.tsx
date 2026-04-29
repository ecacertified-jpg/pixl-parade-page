import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Heart, SlidersHorizontal, X, AlertCircle, RotateCcw, Loader2, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
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
import { SEOHead } from "@/components/SEOHead";
import { useCountry } from "@/contexts/CountryContext";
import { getCountryConfig } from "@/config/countries";
import { CountrySelector } from "@/components/CountrySelector";
import { TASTE_CATEGORIES, ALL_TASTE, matchesTaste } from "@/data/taste-categories";
import { WishlistProductCard } from "@/components/wishlist/WishlistProductCard";
import { ExternalFavoriteCard } from "@/components/wishlist/ExternalFavoriteCard";
import { JumiaImportModal } from "@/components/wishlist/JumiaImportModal";
import { ExternalProductFundModal } from "@/components/ExternalProductFundModal";
import {
  useExternalFavorites,
  useRemoveExternalFavorite,
  type ExternalFavorite,
} from "@/hooks/useExternalFavorites";
import {
  CatalogProduct,
  CatalogSortOption,
  CATALOG_SORT_OPTIONS,
  useCatalogProducts,
  useCatalogSearch,
  useDebouncedValue,
} from "@/hooks/useWishlistCatalog";

const SEARCH_SUGGESTIONS = ["robe", "chemise", "parfum", "bijoux", "gâteau", "chaussures"];

export default function WishlistCatalog() {
  const { countryCode, profileCountryCode, isVisiting, resetToHomeCountry, profileLoadError, isLoadingProfile, retryProfileLoad, retryAttempts, maxRetries, cooldownRemaining, canRetry } = useCountry();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQuery = useDebouncedValue(searchQuery, 300);
  const [selectedTaste, setSelectedTaste] = useState<string>("tous");
  const [sortBy, setSortBy] = useState<CatalogSortOption>("popularity");
  const { isFavorite, addFavorite, removeFavorite, getFavoriteId, stats, favorites } = useFavorites();

  const isSearching = debouncedQuery.trim().length >= 2;

  const catalog = useCatalogProducts(countryCode, sortBy);
  const search = useCatalogSearch(countryCode, debouncedQuery, sortBy);

  // External favorites (Jumia, Amazon, etc.)
  const externalFavoritesQuery = useExternalFavorites(countryCode);
  const removeExternalFavorite = useRemoveExternalFavorite();
  const [jumiaModalOpen, setJumiaModalOpen] = useState(false);
  const [fundPreset, setFundPreset] = useState<ExternalFavorite | null>(null);

  const externalFavorites = externalFavoritesQuery.data ?? [];
  const filteredExternalFavorites = useMemo(() => {
    if (selectedTaste !== "tous") return [];
    if (!isSearching) return externalFavorites;
    const q = debouncedQuery.trim().toLowerCase();
    return externalFavorites.filter(
      (f) =>
        f.product_name.toLowerCase().includes(q) ||
        f.platform.toLowerCase().includes(q),
    );
  }, [externalFavorites, isSearching, debouncedQuery, selectedTaste]);

  const products: CatalogProduct[] = useMemo(() => {
    if (isSearching) return search.data ?? [];
    return catalog.data?.pages.flat() ?? [];
  }, [isSearching, search.data, catalog.data]);

  const loading = isSearching ? search.isLoading : catalog.isLoading;

  const filteredProducts = useMemo(
    () => products.filter((p) => matchesTaste(p.category_name, selectedTaste)),
    [products, selectedTaste],
  );

  // Set d'IDs favoris stable pour éviter de re-rendre toutes les cartes quand
  // un seul favori change.
  const favoriteIds = useMemo(
    () => new Set((favorites ?? []).map((f: any) => f.product_id)),
    [favorites],
  );

  // Scénario A : produits disponibles côté serveur mais filtre de goût trop
  // restrictif côté client → on déverrouille automatiquement vers « Tous ».
  useEffect(() => {
    if (
      !loading &&
      products.length > 0 &&
      filteredProducts.length === 0 &&
      selectedTaste !== "tous"
    ) {
      const previousLabel =
        TASTE_CATEGORIES.find((t) => t.id === selectedTaste)?.label ?? selectedTaste;
      setSelectedTaste("tous");
      toast.info(`Aucun article dans « ${previousLabel} » — affichage de tous les articles`);
    }
  }, [loading, products.length, filteredProducts.length, selectedTaste]);

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

  // Callback stable : évite d'invalider la prop `onToggleFavorite` à chaque render
  // et donc évite les re-renders inutiles des cartes mémoïsées.
  const handleToggleFavorite = useCallback(
    async (e: React.MouseEvent, productId: string) => {
      e.stopPropagation();
      if (isFavorite(productId)) {
        const favId = getFavoriteId(productId);
        if (favId) await removeFavorite(favId);
      } else {
        await addFavorite(productId);
      }
    },
    [isFavorite, getFavoriteId, removeFavorite, addFavorite],
  );

  const allTastes = [ALL_TASTE, ...TASTE_CATEGORIES];

  const activeTasteLabel =
    selectedTaste !== "tous"
      ? TASTE_CATEGORIES.find((t) => t.id === selectedTaste)?.label
      : null;

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

          {/* Import depuis une plateforme externe (Jumia, etc.) */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setJumiaModalOpen(true)}
            className="w-full gap-2 border-orange-300 text-orange-700 hover:bg-orange-50 hover:text-orange-800 dark:border-orange-500/40 dark:text-orange-300 dark:hover:bg-orange-500/10"
          >
            <ShoppingBag className="h-4 w-4" />
            Ajouter depuis Jumia.ci
          </Button>

          {/* Bandeau d'erreur de chargement du pays profil */}
          {profileLoadError && (
            <div
              role="alert"
              className="flex items-center justify-between gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs"
            >
              <span className="flex flex-col gap-0.5 text-destructive min-w-0">
                <span className="flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  Impossible de charger votre pays d'origine.
                </span>
                {cooldownRemaining > 0 ? (
                  <span className="text-[11px] text-destructive/80 pl-5">
                    Trop de tentatives — réessayez dans {cooldownRemaining}s
                  </span>
                ) : retryAttempts > 0 ? (
                  <span className="text-[11px] text-destructive/80 pl-5">
                    Tentative {retryAttempts} / {maxRetries}
                  </span>
                ) : null}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1.5 text-xs shrink-0 text-destructive hover:text-destructive"
                onClick={() => retryProfileLoad()}
                disabled={!canRetry}
              >
                {isLoadingProfile ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RotateCcw className="h-3.5 w-3.5" />
                )}
                {cooldownRemaining > 0 ? `${cooldownRemaining}s` : "Réessayer"}
              </Button>
            </div>
          )}

          {/* Bandeau "vous explorez un autre pays" */}
          {isVisiting && profileCountryCode && (
            <div className="flex items-center justify-between gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs">
              <span className="text-foreground">
                Vous explorez le catalogue {getCountryConfig(countryCode).flag}{" "}
                {getCountryConfig(countryCode).name}.
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1.5 text-xs shrink-0"
                onClick={resetToHomeCountry}
              >
                Revenir à {getCountryConfig(profileCountryCode).flag}{" "}
                {getCountryConfig(profileCountryCode).name}
              </Button>
            </div>
          )}

          {/* Essayez plutôt — chips qui pré-remplissent la recherche */}
          <div className="flex items-center gap-2 overflow-x-auto -mx-4 px-4 scrollbar-hide">
            <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
              Essayez plutôt
            </span>
            {SEARCH_SUGGESTIONS.map((s) => {
              const isActive = debouncedQuery.trim().toLowerCase() === s.toLowerCase();
              return (
                <Badge
                  key={s}
                  variant={isActive ? "default" : "outline"}
                  className="cursor-pointer whitespace-nowrap shrink-0 capitalize hover:bg-accent"
                  onClick={() => setSearchQuery(s)}
                >
                  {s}
                </Badge>
              );
            })}
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
          ) : filteredProducts.length === 0 && filteredExternalFavorites.length === 0 ? (
            <div className="text-center py-10 px-4 text-muted-foreground">
              <SlidersHorizontal className="h-10 w-10 mx-auto mb-3 opacity-40" />
              {isSearching ? (
                <>
                  <p className="text-sm text-foreground">
                    Aucun article pour «&nbsp;{debouncedQuery}&nbsp;»
                  </p>
                  <p className="text-xs mt-1">
                    Essayez une recherche plus courte ou l'une de ces idées
                  </p>
                  <div className="flex flex-wrap justify-center gap-2 mt-4">
                    {SEARCH_SUGGESTIONS.map((s) => (
                      <Badge
                        key={s}
                        variant="outline"
                        className="cursor-pointer hover:bg-accent capitalize"
                        onClick={() => setSearchQuery(s)}
                      >
                        {s}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1.5 text-xs"
                      onClick={() => setSearchQuery("")}
                    >
                      <X className="h-3.5 w-3.5" />
                      Effacer la recherche
                    </Button>
                    {activeTasteLabel && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 text-xs"
                        onClick={() => setSelectedTaste("tous")}
                      >
                        <X className="h-3.5 w-3.5" />
                        Retirer le filtre «&nbsp;{activeTasteLabel}&nbsp;»
                      </Button>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm text-foreground">
                    Aucun article disponible pour le moment
                  </p>
                  <p className="text-xs mt-1">
                    Essayez de changer de pays ci-dessus pour découvrir d'autres boutiques
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filteredExternalFavorites.map((fav) => (
                <ExternalFavoriteCard
                  key={`ext-${fav.id}`}
                  favorite={fav}
                  onRemove={(id) => removeExternalFavorite.mutate(id)}
                  onCreateFund={(f) => setFundPreset(f)}
                />
              ))}
              {filteredProducts.map((product) => (
                <WishlistProductCard
                  key={product.id}
                  product={product}
                  isFavorite={favoriteIds.has(product.id)}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))}
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

      <JumiaImportModal
        isOpen={jumiaModalOpen}
        onClose={() => setJumiaModalOpen(false)}
        countryCode={countryCode}
      />

      <ExternalProductFundModal
        isOpen={!!fundPreset}
        onClose={() => setFundPreset(null)}
        preset={
          fundPreset
            ? {
                productUrl: fundPreset.external_url,
                productName: fundPreset.product_name,
                productImageUrl: fundPreset.image_url,
                estimatedPrice: fundPreset.estimated_price,
                platform: fundPreset.platform,
              }
            : null
        }
      />
    </>
  );
}
