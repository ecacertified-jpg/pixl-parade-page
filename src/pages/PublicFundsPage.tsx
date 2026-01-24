import { useState, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Heart, Plus, ArrowLeft, Gift, Loader2, Clock, Target, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { usePublicFundsInfinite, type SortOption } from "@/hooks/usePublicFundsInfinite";
import { type PublicFund } from "@/hooks/usePublicFunds";
import { FundsBreadcrumb } from "@/components/breadcrumbs/FundsBreadcrumb";
import { SEOHead, SEO_CONFIGS } from "@/components/SEOHead";
import { PublicFundCard } from "@/components/funds/PublicFundCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BottomNavigation } from "@/components/RecentActivitySection";
import { ValuePropositionModal } from "@/components/ValuePropositionModal";
import { ContributionModal } from "@/components/ContributionModal";
import { ShopForCollectiveGiftModal } from "@/components/ShopForCollectiveGiftModal";
import { LoadMoreTrigger } from "@/components/LoadMoreTrigger";

// Options de tri
const SORT_OPTIONS = [
  { key: "recent" as SortOption, label: "Plus récentes", icon: Clock },
  { key: "progress" as SortOption, label: "Proches de l'objectif", icon: Target },
  { key: "popular" as SortOption, label: "Plus populaires", icon: TrendingUp },
];

// Occasions disponibles pour le filtrage
const OCCASIONS = [
  { key: "all", label: "Toutes", emoji: "🎁" },
  { key: "birthday", label: "Anniversaires", emoji: "🎂" },
  { key: "wedding", label: "Mariages", emoji: "💒" },
  { key: "baby", label: "Naissances", emoji: "👶" },
  { key: "graduation", label: "Diplômes", emoji: "🎓" },
  { key: "promotion", label: "Promotions", emoji: "🚀" },
] as const;

export default function PublicFundsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const occasionFilter = searchParams.get("occasion") || "all";
  const sortBy = (searchParams.get("sort") as SortOption) || "recent";
  
  // Modal states
  const [showValueModal, setShowValueModal] = useState(false);
  const [showContributionModal, setShowContributionModal] = useState(false);
  const [showValueModalForNewFund, setShowValueModalForNewFund] = useState(false);
  const [showShopForCollectiveGift, setShowShopForCollectiveGift] = useState(false);
  const [selectedFund, setSelectedFund] = useState<PublicFund | null>(null);
  
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = usePublicFundsInfinite({
    occasionFilter: occasionFilter === "all" ? undefined : occasionFilter,
    statusFilter: "active",
    sortBy,
  });

  // Flatten pages into single array
  const funds = data?.pages.flatMap(page => page.funds) ?? [];
  const totalCount = data?.pages[0]?.totalCount ?? 0;

  // Handle load more
  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Handle occasion filter change
  const handleOccasionChange = (occasion: string) => {
    const newParams = new URLSearchParams();
    if (occasion !== "all") {
      newParams.set("occasion", occasion);
    }
    if (sortBy !== "recent") {
      newParams.set("sort", sortBy);
    }
    setSearchParams(newParams);
  };

  // Handle sort change
  const handleSortChange = (newSort: SortOption) => {
    const newParams = new URLSearchParams(searchParams);
    if (newSort === "recent") {
      newParams.delete("sort");
    } else {
      newParams.set("sort", newSort);
    }
    setSearchParams(newParams);
  };

  // Handle contribution click
  const handleContribute = (fund: PublicFund) => {
    setSelectedFund(fund);
    setShowValueModal(true);
  };

  const handleOpenContributionModal = () => {
    setShowValueModal(false);
    setShowContributionModal(true);
  };

  const handleOpenShopForCollectiveGift = () => {
    setShowValueModalForNewFund(false);
    setShowShopForCollectiveGift(true);
  };

  // Dynamic SEO based on filter
  const getPageTitle = () => {
    if (occasionFilter === "all") {
      return SEO_CONFIGS.funds.title;
    }
    const occasion = OCCASIONS.find(o => o.key === occasionFilter);
    return occasion 
      ? `Cagnottes ${occasion.label} | JOIE DE VIVRE` 
      : SEO_CONFIGS.funds.title;
  };

  const getPageDescription = () => {
    if (occasionFilter === "all") {
      return SEO_CONFIGS.funds.description;
    }
    const occasion = OCCASIONS.find(o => o.key === occasionFilter);
    return occasion
      ? `Découvrez et contribuez aux cagnottes collectives pour les ${occasion.label.toLowerCase()}. Offrez ensemble un cadeau mémorable.`
      : SEO_CONFIGS.funds.description;
  };

  return (
    <>
      <SEOHead 
        title={getPageTitle()}
        description={getPageDescription()}
        keywords={SEO_CONFIGS.funds.keywords}
        aiContentType="fund"
        audience="gift-givers"
      />
      
      <div className="min-h-screen bg-gradient-background pb-20">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/30">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
            <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" />
              <h1 className="text-lg font-semibold text-foreground">Cagnottes Publiques</h1>
            </div>
          </div>
        </header>
        
        {/* Breadcrumb */}
        <FundsBreadcrumb occasionFilter={occasionFilter !== "all" ? occasionFilter : null} />
        
        {/* Filters */}
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {OCCASIONS.map((occ) => (
              <Button
                key={occ.key}
                variant={occasionFilter === occ.key ? "default" : "outline"}
                size="sm"
                className={`flex-shrink-0 ${
                  occasionFilter === occ.key 
                    ? "bg-gradient-primary text-primary-foreground border-0" 
                    : "bg-card hover:bg-accent"
                }`}
                onClick={() => handleOccasionChange(occ.key)}
              >
                <span className="mr-1">{occ.emoji}</span>
                {occ.label}
              </Button>
            ))}
          </div>
        </div>
        
        {/* Content */}
        <main className="max-w-lg mx-auto px-4">
          {/* Create Fund CTA */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <button
              onClick={() => setShowValueModalForNewFund(true)}
              className="w-full bg-secondary/50 border-2 border-dashed border-primary/30 hover:border-primary/50 rounded-xl p-4 flex items-center gap-4 transition-all duration-300 group"
            >
              <div className="bg-gradient-primary p-3 rounded-full group-hover:scale-110 transition-transform">
                <Plus className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-foreground">Créer une cagnotte</p>
                <p className="text-sm text-muted-foreground">Organisez un cadeau collectif</p>
              </div>
            </button>
          </motion.div>

          {/* Results count + Sort selector */}
          {!isLoading && (
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                {funds.length} sur {totalCount} cagnotte{totalCount !== 1 ? 's' : ''} 
                {occasionFilter !== "all" && ` pour ${OCCASIONS.find(o => o.key === occasionFilter)?.label.toLowerCase()}`}
              </p>
              
              <Select value={sortBy} onValueChange={(value) => handleSortChange(value as SortOption)}>
                <SelectTrigger className="w-[165px] h-9 text-sm bg-card border-border/50">
                  <SelectValue placeholder="Trier par" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {SORT_OPTIONS.map((option) => (
                    <SelectItem key={option.key} value={option.key} className="text-sm">
                      <div className="flex items-center gap-2">
                        <option.icon className="h-4 w-4 text-muted-foreground" />
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          {/* Funds Grid */}
          {isLoading ? (
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-24 w-full rounded-t-lg" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-2 w-full" />
                  <Skeleton className="h-8 w-full rounded-md" />
                </div>
              ))}
            </div>
          ) : funds.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <div className="bg-muted/50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <Gift className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                Aucune cagnotte trouvée
              </h3>
              <p className="text-muted-foreground mb-4">
                {occasionFilter !== "all" 
                  ? `Aucune cagnotte pour ${OCCASIONS.find(o => o.key === occasionFilter)?.label.toLowerCase()} n'est disponible pour le moment.`
                  : "Aucune cagnotte publique n'est disponible pour le moment."
                }
              </p>
              <Button 
                onClick={() => setShowValueModalForNewFund(true)}
                className="bg-gradient-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                Créer la première
              </Button>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-2 gap-4"
            >
              {funds.map((fund, index) => (
                <motion.div
                  key={fund.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.05, 0.5) }}
                >
                  <PublicFundCard 
                    fund={fund} 
                    onContribute={handleContribute}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Load More Trigger */}
          <LoadMoreTrigger
            onLoadMore={handleLoadMore}
            hasMore={!!hasNextPage}
            isLoading={isFetchingNextPage}
          />

          {/* Loading indicator for next page */}
          {isFetchingNextPage && (
            <div className="flex items-center justify-center py-6 gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Chargement...</span>
            </div>
          )}

          {/* End of list indicator */}
          {!hasNextPage && funds.length > 0 && !isLoading && (
            <p className="text-center text-sm text-muted-foreground py-6">
              Vous avez tout vu ! 🎉
            </p>
          )}
        </main>
        
        <BottomNavigation />
      </div>

      {/* Modals */}
      {selectedFund && (
        <>
          <ValuePropositionModal
            isOpen={showValueModal}
            onClose={() => setShowValueModal(false)}
            onContinue={handleOpenContributionModal}
            fundTitle={selectedFund.productName}
            beneficiaryName={selectedFund.beneficiaryName}
          />

          <ContributionModal
            isOpen={showContributionModal}
            onClose={() => setShowContributionModal(false)}
            fundId={selectedFund.id}
            fundTitle={selectedFund.productName}
            targetAmount={selectedFund.targetAmount}
            currentAmount={selectedFund.currentAmount}
            currency={selectedFund.currency}
            isFromPublicFund={true}
            fundCreatorId={selectedFund.creatorId}
            occasion={selectedFund.occasion || undefined}
            onContributionSuccess={() => {
              refetch();
              setShowContributionModal(false);
            }}
          />
        </>
      )}

      {/* Create Fund Modals */}
      <ValuePropositionModal
        isOpen={showValueModalForNewFund}
        onClose={() => setShowValueModalForNewFund(false)}
        onContinue={handleOpenShopForCollectiveGift}
        fundTitle="Créer une cagnotte"
        beneficiaryName=""
        isForCreatingFund={true}
      />

      <ShopForCollectiveGiftModal
        isOpen={showShopForCollectiveGift}
        onClose={() => setShowShopForCollectiveGift(false)}
      />
    </>
  );
}
